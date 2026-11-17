import mongoose, { Types } from "mongoose";

import {
  createHash,
  randomBytes
} from "node:crypto";

import { QuotationStatus } from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";

import { AuditLog } from "../audit/Auditlog.js";
import { Client } from "../clients/Client.js";
import { ServiceRequest } from "../service-requests/ServiceRequest.js";

import { Quotation } from "./Quotation.js";
import { QuotationAccessToken } from "./QuotationAccessToken.js";
import { QuotationResponse } from "./QuotationResponse.js";

import type {
  ListQuotationsQuery
} from "./quotation.validation.js";

interface QuotationItemInput {
  serviceRequestItemId?: string | null | undefined;
  serviceName: string;
  description: string;
  deliverables: string[];
  quantity: number;
  unitAmountKobo: number;
}

interface CreateQuotationInput {
  serviceRequestId: string;
  items: QuotationItemInput[];
  discountKobo: number;
  scope: string;
  terms: string[];
  validUntil: string;
}

interface UpdateQuotationInput {
  items?: QuotationItemInput[] | undefined;
  discountKobo?: number | undefined;
  scope?: string | undefined;
  terms?: string[] | undefined;
  validUntil?: string | undefined;
}

interface ClientResponseInput {
  response: "approved" | "declined" | "revision_requested";
  comments?: string | undefined;
}

interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface QuotationListAggregationResult {
  quotations: Record<string, unknown>[];
  total: Array<{ count: number }>;
}

const ACCESS_TOKEN_DURATION_MS =
  7 * 24 * 60 * 60 * 1000;

function createQuotationNumber(): string {
  const year = new Date().getFullYear();

  const reference = randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `PA-QUO-${year}-${reference}`;
}

function hashToken(token: string): string {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

function validateObjectId(
  value: string,
  field: string
): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${field}.`);
  }

  return new Types.ObjectId(value);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function calculateQuotationAmounts(
  items: QuotationItemInput[],
  discountKobo: number
) {
  if (items.length === 0) {
    throw new ApiError(
      400,
      "A quotation must contain at least one item."
    );
  }

  if (
    !Number.isSafeInteger(discountKobo) ||
    discountKobo < 0
  ) {
    throw new ApiError(400, "Invalid quotation discount.");
  }

  const calculatedItems = items.map((item) => {
    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      !Number.isSafeInteger(item.unitAmountKobo) ||
      item.unitAmountKobo < 0
    ) {
      throw new ApiError(
        400,
        "Invalid quotation item amount or quantity."
      );
    }

    const totalAmountKobo =
      item.quantity * item.unitAmountKobo;

    if (!Number.isSafeInteger(totalAmountKobo)) {
      throw new ApiError(
        400,
        "Quotation item total exceeds the supported amount."
      );
    }

    return {
      serviceRequestItemId: item.serviceRequestItemId
        ? validateObjectId(
            item.serviceRequestItemId,
            "service request item ID"
          )
        : null,

      serviceName: item.serviceName.trim(),
      description: item.description.trim(),
      deliverables: item.deliverables.map(
        (value) => value.trim()
      ),
      quantity: item.quantity,
      unitAmountKobo: item.unitAmountKobo,
      totalAmountKobo
    };
  });

  const subtotalKobo = calculatedItems.reduce(
    (total, item) => total + item.totalAmountKobo,
    0
  );

  if (!Number.isSafeInteger(subtotalKobo)) {
    throw new ApiError(
      400,
      "Quotation subtotal exceeds the supported amount."
    );
  }

  if (discountKobo > subtotalKobo) {
    throw new ApiError(
      400,
      "Quotation discount cannot exceed the subtotal."
    );
  }

  return {
    items: calculatedItems,
    subtotalKobo,
    discountKobo,
    totalAmountKobo: subtotalKobo - discountKobo
  };
}

async function validateQuotationItems(
  serviceRequestId: Types.ObjectId,
  items: QuotationItemInput[],
  session: mongoose.ClientSession
) {
  const serviceRequest = await ServiceRequest.findOne({
    _id: serviceRequestId,
    isDeleted: false
  }).session(session);

  if (!serviceRequest) {
    throw new ApiError(404, "Service request not found.");
  }

  const requestItemIds = new Set(
    serviceRequest.items.map(
      (item) =>
        (
          item as typeof item & {
            _id: Types.ObjectId;
          }
        )._id.toString()
    )
  );

  for (const item of items) {
    if (
      item.serviceRequestItemId &&
      !requestItemIds.has(item.serviceRequestItemId)
    ) {
      throw new ApiError(
        400,
        "A quotation item references a service that does not belong to this request."
      );
    }
  }

  return serviceRequest;
}

async function writeAuditLog(
  input: {
    adminId: Types.ObjectId | null;
    action: string;
    resourceId: Types.ObjectId;
    description: string;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  },
  context: AuditContext,
  session: mongoose.ClientSession
) {
  await AuditLog.create(
    [
      {
        actorId: input.adminId,
        action: input.action,
        resourceType: "quotation",
        resourceId: input.resourceId,
        description: input.description,
        changes: input.changes ?? null,
        metadata: input.metadata ?? null,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null
      }
    ],
    { session }
  );
}

function getTokenExpiry(validUntil: Date): Date {
  const defaultExpiry = new Date(
    Date.now() + ACCESS_TOKEN_DURATION_MS
  );

  return validUntil < defaultExpiry
    ? validUntil
    : defaultExpiry;
}

async function findValidAccessToken(
  token: string,
  session?: mongoose.ClientSession
) {
  if (!token || token.length < 32 || token.length > 512) {
    throw new ApiError(
      404,
      "Quotation link is invalid or unavailable."
    );
  }

  const tokenDocument = await QuotationAccessToken.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  })
    .select("+tokenHash")
    .session(session ?? null);

  if (!tokenDocument) {
    throw new ApiError(
      404,
      "Quotation link is invalid or unavailable."
    );
  }

  return tokenDocument;
}

/**
 * Create a quotation draft.
 */
export async function createQuotationDraft(
  input: CreateQuotationInput,
  adminId: string,
  context: AuditContext = {}
) {
  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const serviceRequestId = validateObjectId(
    input.serviceRequestId,
    "service request ID"
  );

  const validUntil = new Date(input.validUntil);

  if (
    Number.isNaN(validUntil.getTime()) ||
    validUntil <= new Date()
  ) {
    throw new ApiError(
      400,
      "Quotation validity must be a future date."
    );
  }

  const session = await mongoose.startSession();

  let createdQuotationId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const serviceRequest = await validateQuotationItems(
        serviceRequestId,
        input.items,
        session
      );

      const client = await Client.findOne({
        _id: serviceRequest.clientId,
        isDeleted: false
      }).session(session);

      if (!client) {
        throw new ApiError(
          404,
          "Associated client not found."
        );
      }

      const amounts = calculateQuotationAmounts(
        input.items,
        input.discountKobo
      );

      const quotation = new Quotation({
        quotationNumber: createQuotationNumber(),

        clientId: client._id,

        clientSnapshot: {
          fullName: client.fullName,
          email: client.email,
          phone: client.phone
        },

        serviceRequestId: serviceRequest._id,
        serviceRequestReference: serviceRequest.reference,

        version: 1,
        previousVersionId: null,

        ...amounts,

        scope: input.scope.trim(),
        terms: input.terms.map((term) => term.trim()),
        validUntil,

        status: QuotationStatus.DRAFT
      });

      await quotation.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "quotation.created",
          resourceId: quotation._id,
          description: "Quotation draft created.",
          metadata: {
            quotationNumber: quotation.quotationNumber,
            quotationVersion: quotation.version,
            serviceRequestId: serviceRequest._id.toString()
          }
        },
        context,
        session
      );

      createdQuotationId = quotation._id;
    });

    if (!createdQuotationId) {
      throw new ApiError(
        500,
        "Quotation creation could not be completed."
      );
    }

    const quotation = await Quotation.findById(
      createdQuotationId
    );

    if (!quotation) {
      throw new ApiError(
        500,
        "Created quotation could not be retrieved."
      );
    }

    return quotation;
  } finally {
    await session.endSession();
  }
}

/**
 * Update an existing quotation draft.
 */
export async function updateQuotationDraft(
  quotationId: string,
  input: UpdateQuotationInput,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    quotationId,
    "quotation ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const quotation = await Quotation.findById(id)
        .session(session);

      if (!quotation) {
        throw new ApiError(404, "Quotation not found.");
      }

      if (quotation.status !== QuotationStatus.DRAFT) {
        throw new ApiError(
          409,
          "Only draft quotations can be edited."
        );
      }

      const changes: Record<string, unknown> = {};

      if (input.items !== undefined) {
        await validateQuotationItems(
          quotation.serviceRequestId,
          input.items,
          session
        );

        const amounts = calculateQuotationAmounts(
          input.items,
          input.discountKobo ?? quotation.discountKobo
        );

        quotation.items = amounts.items as typeof quotation.items;
        quotation.subtotalKobo = amounts.subtotalKobo;
        quotation.discountKobo = amounts.discountKobo;
        quotation.totalAmountKobo = amounts.totalAmountKobo;

        changes.itemsUpdated = true;
        changes.totalAmountKobo = amounts.totalAmountKobo;
      } else if (input.discountKobo !== undefined) {
        const amounts = calculateQuotationAmounts(
          quotation.items.map((item) => ({
            serviceRequestItemId:
              item.serviceRequestItemId?.toString() ?? null,
            serviceName: item.serviceName,
            description: item.description,
            deliverables: item.deliverables,
            quantity: item.quantity,
            unitAmountKobo: item.unitAmountKobo
          })),
          input.discountKobo
        );

        quotation.discountKobo = amounts.discountKobo;
        quotation.totalAmountKobo = amounts.totalAmountKobo;

        changes.discountKobo = amounts.discountKobo;
        changes.totalAmountKobo = amounts.totalAmountKobo;
      }

      if (input.scope !== undefined) {
        quotation.scope = input.scope.trim();
        changes.scopeUpdated = true;
      }

      if (input.terms !== undefined) {
        quotation.terms = input.terms.map(
          (term) => term.trim()
        );

        changes.termsUpdated = true;
      }

      if (input.validUntil !== undefined) {
        const validUntil = new Date(input.validUntil);

        if (
          Number.isNaN(validUntil.getTime()) ||
          validUntil <= new Date()
        ) {
          throw new ApiError(
            400,
            "Quotation validity must be a future date."
          );
        }

        quotation.validUntil = validUntil;
        changes.validUntil = validUntil.toISOString();
      }

      await quotation.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "quotation.updated",
          resourceId: quotation._id,
          description: "Quotation draft updated.",
          changes
        },
        context,
        session
      );
    });

    const updatedQuotation = await Quotation.findById(id);

    if (!updatedQuotation) {
      throw new ApiError(404, "Quotation not found.");
    }

    return updatedQuotation;
  } finally {
    await session.endSession();
  }
}

/**
 * Issue a quotation and generate its secure client access token.
 */
export async function issueQuotation(
  quotationId: string,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    quotationId,
    "quotation ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let issuedQuotationId: Types.ObjectId | null = null;
  let rawToken: string | null = null;

  try {
    await session.withTransaction(async () => {
      const quotation = await Quotation.findById(id)
        .session(session);

      if (!quotation) {
        throw new ApiError(404, "Quotation not found.");
      }

      if (quotation.status !== QuotationStatus.DRAFT) {
        throw new ApiError(
          409,
          "Only draft quotations can be issued."
        );
      }

      if (quotation.validUntil <= new Date()) {
        throw new ApiError(
          400,
          "The quotation validity date has passed."
        );
      }

      if (
        quotation.items.length === 0 ||
        quotation.totalAmountKobo < 0
      ) {
        throw new ApiError(
          400,
          "Quotation must contain valid items and amounts."
        );
      }

      const client = await Client.findOne({
        _id: quotation.clientId,
        isDeleted: false
      }).session(session);

      const serviceRequest = await ServiceRequest.findOne({
        _id: quotation.serviceRequestId,
        isDeleted: false
      }).session(session);

      if (!client || !serviceRequest) {
        throw new ApiError(
          409,
          "The associated client or service request is unavailable."
        );
      }

      const token = randomBytes(32).toString("hex");

      const accessToken = new QuotationAccessToken({
        quotationId: quotation._id,
        quotationNumber: quotation.quotationNumber,
        quotationVersion: quotation.version,
        clientId: quotation.clientId,
        tokenHash: hashToken(token),
        expiresAt: getTokenExpiry(quotation.validUntil)
      });

      await accessToken.save({ session });

      quotation.status = QuotationStatus.SENT;
      quotation.issuedAt = new Date();

      await quotation.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "quotation.issued",
          resourceId: quotation._id,
          description: "Quotation issued to client.",
          metadata: {
            quotationNumber: quotation.quotationNumber,
            quotationVersion: quotation.version,
            accessTokenId: accessToken._id.toString(),
            tokenExpiresAt: accessToken.expiresAt.toISOString()
          }
        },
        context,
        session
      );

      issuedQuotationId = quotation._id;
      rawToken = token;
    });

    if (!issuedQuotationId || !rawToken) {
      throw new ApiError(
        500,
        "Quotation issuance could not be completed."
      );
    }

    const quotation = await Quotation.findById(
      issuedQuotationId
    );

    if (!quotation) {
      throw new ApiError(
        500,
        "Issued quotation could not be retrieved."
      );
    }

    return {
      quotation,
      accessToken: rawToken
    };
  } finally {
    await session.endSession();
  }
}

/**
 * Withdraw an issued quotation.
 */
export async function withdrawQuotation(
  quotationId: string,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    quotationId,
    "quotation ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const quotation = await Quotation.findById(id)
        .session(session);

      if (!quotation) {
        throw new ApiError(404, "Quotation not found.");
      }

      if (quotation.status !== QuotationStatus.SENT) {
        throw new ApiError(
          409,
          "Only issued quotations can be withdrawn."
        );
      }

      quotation.status = QuotationStatus.WITHDRAWN;

      await quotation.save({ session });

      await QuotationAccessToken.updateMany(
        {
          quotationId: quotation._id,
          quotationVersion: quotation.version,
          revokedAt: null
        },
        {
          $set: { revokedAt: new Date() }
        },
        { session }
      );

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "quotation.withdrawn",
          resourceId: quotation._id,
          description: "Issued quotation withdrawn.",
          metadata: {
            quotationNumber: quotation.quotationNumber,
            quotationVersion: quotation.version
          }
        },
        context,
        session
      );
    });

    const quotation = await Quotation.findById(id);

    if (!quotation) {
      throw new ApiError(404, "Quotation not found.");
    }

    return quotation;
  } finally {
    await session.endSession();
  }
}

/**
 * Create a new draft revision after a client requests changes.
 */
export async function createQuotationRevision(
  quotationId: string,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    quotationId,
    "quotation ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let newQuotationId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const previousQuotation = await Quotation.findById(id)
        .session(session);

      if (!previousQuotation) {
        throw new ApiError(404, "Quotation not found.");
      }

      if (
        previousQuotation.status !==
        QuotationStatus.REVISION_REQUESTED
      ) {
        throw new ApiError(
          409,
          "A new revision can only be created after the client requests changes."
        );
      }

      await QuotationAccessToken.updateMany(
        {
          quotationId: previousQuotation._id,
          quotationVersion: previousQuotation.version,
          revokedAt: null
        },
        {
          $set: { revokedAt: new Date() }
        },
        { session }
      );

      const revision = new Quotation({
        quotationNumber: previousQuotation.quotationNumber,

        clientId: previousQuotation.clientId,
        clientSnapshot: previousQuotation.clientSnapshot,

        serviceRequestId: previousQuotation.serviceRequestId,
        serviceRequestReference:
          previousQuotation.serviceRequestReference,

        version: previousQuotation.version + 1,
        previousVersionId: previousQuotation._id,

        items: previousQuotation.items.map((item) => ({
          serviceRequestItemId: item.serviceRequestItemId,
          serviceName: item.serviceName,
          description: item.description,
          deliverables: item.deliverables,
          quantity: item.quantity,
          unitAmountKobo: item.unitAmountKobo,
          totalAmountKobo: item.totalAmountKobo
        })),

        subtotalKobo: previousQuotation.subtotalKobo,
        discountKobo: previousQuotation.discountKobo,
        totalAmountKobo: previousQuotation.totalAmountKobo,

        scope: previousQuotation.scope,
        terms: previousQuotation.terms,
        validUntil: previousQuotation.validUntil,

        status: QuotationStatus.DRAFT
      });

      await revision.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "quotation.revised",
          resourceId: revision._id,
          description: "New quotation revision created.",
          metadata: {
            quotationNumber: revision.quotationNumber,
            previousVersion: previousQuotation.version,
            newVersion: revision.version,
            previousQuotationId: previousQuotation._id.toString()
          }
        },
        context,
        session
      );

      newQuotationId = revision._id;
    });

    if (!newQuotationId) {
      throw new ApiError(
        500,
        "Quotation revision could not be created."
      );
    }

    const revision = await Quotation.findById(newQuotationId);

    if (!revision) {
      throw new ApiError(
        500,
        "Created quotation revision could not be retrieved."
      );
    }

    return revision;
  } finally {
    await session.endSession();
  }
}

/**
 * Retrieve a quotation using its secure client access token.
 */
export async function getQuotationByAccessToken(
  token: string
) {
  const accessToken = await findValidAccessToken(token);

  const quotation = await Quotation.findOne({
    _id: accessToken.quotationId,
    quotationNumber: accessToken.quotationNumber,
    version: accessToken.quotationVersion,
    status: QuotationStatus.SENT
  });

  if (!quotation || quotation.validUntil <= new Date()) {
    throw new ApiError(
      404,
      "Quotation link is invalid or unavailable."
    );
  }

  await QuotationAccessToken.updateOne(
    { _id: accessToken._id },
    { $set: { lastAccessedAt: new Date() } }
  );

  return quotation;
}

/**
 * Retrieve one quotation for administrative use.
 *
 * Quotations associated with soft-deleted clients or service
 * requests are not exposed through this operation.
 */
export async function getQuotationById(
  quotationId: string
) {
  const id = validateObjectId(
    quotationId,
    "quotation ID"
  );

  const quotation = await Quotation.findById(id);

  if (!quotation) {
    throw new ApiError(404, "Quotation not found.");
  }

  const [client, serviceRequest] = await Promise.all([
    Client.findOne({
      _id: quotation.clientId,
      isDeleted: false
    }).select("_id"),

    ServiceRequest.findOne({
      _id: quotation.serviceRequestId,
      isDeleted: false
    }).select("_id")
  ]);

  if (!client || !serviceRequest) {
    throw new ApiError(404, "Quotation not found.");
  }

  return quotation;
}

/**
 * List quotations for the administrative interface.
 *
 * The aggregation excludes quotations whose associated
 * clients or service requests have been soft-deleted.
 */
export async function listQuotations(
  query: ListQuotationsQuery
) {
  const {
    page,
    limit,
    search,
    status,
    clientId,
    serviceRequestId,
    from,
    to,
    sortBy,
    sortOrder
  } = query;

  const match: Record<string, unknown> = {};

  if (status) {
    match.status = status;
  }

  if (clientId) {
    match.clientId = validateObjectId(
      clientId,
      "client ID"
    );
  }

  if (serviceRequestId) {
    match.serviceRequestId = validateObjectId(
      serviceRequestId,
      "service request ID"
    );
  }

  if (from || to) {
    const createdAt: {
      $gte?: Date;
      $lte?: Date;
    } = {};

    if (from) {
      createdAt.$gte = new Date(from);
    }

    if (to) {
      createdAt.$lte = new Date(to);
    }

    match.createdAt = createdAt;
  }

  if (search) {
    const searchExpression = new RegExp(
      escapeRegex(search),
      "i"
    );

    match.$or = [
      { quotationNumber: searchExpression },
      { serviceRequestReference: searchExpression },
      { "clientSnapshot.fullName": searchExpression },
      { "clientSnapshot.email": searchExpression },
      { "clientSnapshot.phone": searchExpression },
      { "items.serviceName": searchExpression }
    ];
  }

  const sortDirection: 1 | -1 =
    sortOrder === "asc" ? 1 : -1;

  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortDirection,
    _id: -1
  };

  const skip = (page - 1) * limit;

  const pipeline: mongoose.PipelineStage[] = [
    {
      $match: match
    },
    {
      $lookup: {
        from: Client.collection.name,
        localField: "clientId",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              isDeleted: false
            }
          },
          {
            $project: {
              _id: 1
            }
          }
        ],
        as: "activeClient"
      }
    },
    {
      $lookup: {
        from: ServiceRequest.collection.name,
        localField: "serviceRequestId",
        foreignField: "_id",
        pipeline: [
          {
            $match: {
              isDeleted: false
            }
          },
          {
            $project: {
              _id: 1
            }
          }
        ],
        as: "activeServiceRequest"
      }
    },
    {
      $match: {
        activeClient: { $ne: [] },
        activeServiceRequest: { $ne: [] }
      }
    },
    {
      $facet: {
        quotations: [
          {
            $sort: sort
          },
          {
            $skip: skip
          },
          {
            $limit: limit
          },
          {
            $project: {
              activeClient: 0,
              activeServiceRequest: 0
            }
          }
        ],
        total: [
          {
            $count: "count"
          }
        ]
      }
    }
  ];

  const [result] = await Quotation.aggregate<QuotationListAggregationResult>(
    pipeline
  );

  const quotations = result?.quotations ?? [];
  const total = result?.total[0]?.count ?? 0;

  return {
    quotations,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Record a client's response to an issued quotation.
 */
export async function respondToQuotation(
  token: string,
  input: ClientResponseInput,
  context: AuditContext = {}
) {
  const session = await mongoose.startSession();

  let quotationId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const accessToken = await findValidAccessToken(
        token,
        session
      );

      const quotation = await Quotation.findOne({
        _id: accessToken.quotationId,
        quotationNumber: accessToken.quotationNumber,
        version: accessToken.quotationVersion
      }).session(session);

      if (
        !quotation ||
        quotation.status !== QuotationStatus.SENT
      ) {
        throw new ApiError(
          404,
          "Quotation link is invalid or unavailable."
        );
      }

      if (quotation.validUntil <= new Date()) {
        throw new ApiError(
          410,
          "This quotation has expired."
        );
      }

      const responseStatus = {
        approved: QuotationStatus.APPROVED,
        declined: QuotationStatus.DECLINED,
        revision_requested: QuotationStatus.REVISION_REQUESTED
      } as const;

      const respondedAt = new Date();

      const [quotationResponse] = await QuotationResponse.create(
        [
          {
            quotationId: quotation._id,
            quotationNumber: quotation.quotationNumber,
            quotationVersion: quotation.version,
            response: input.response,
            comments: input.comments ?? null,
            accessTokenId: accessToken._id,
            respondedAt
          }
        ],
        { session }
      );

      quotation.status = responseStatus[input.response];
      quotation.respondedAt = respondedAt;

      await quotation.save({ session });

      await QuotationAccessToken.updateMany(
        {
          quotationId: quotation._id,
          quotationVersion: quotation.version,
          revokedAt: null
        },
        {
          $set: { revokedAt: respondedAt }
        },
        { session }
      );

      await writeAuditLog(
        {
          adminId: null,
          action: `quotation.client_${input.response}`,
          resourceId: quotation._id,
          description: `Client ${input.response.replaceAll("_", " ")} the quotation.`,
          metadata: {
            quotationNumber: quotation.quotationNumber,
            quotationVersion: quotation.version,
            responseId: quotationResponse?._id.toString() ?? null
          }
        },
        context,
        session
      );

      quotationId = quotation._id;
    });

    if (!quotationId) {
      throw new ApiError(
        500,
        "Quotation response could not be recorded."
      );
    }

    return Quotation.findById(quotationId);
  } finally {
    await session.endSession();
  }
}
