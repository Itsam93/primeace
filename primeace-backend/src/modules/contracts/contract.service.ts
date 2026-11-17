import mongoose, { Types } from "mongoose";

import {
  createHash,
  randomBytes
} from "node:crypto";

import {
  ContractStatus,
  QuotationStatus
} from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";

import { AuditLog } from "../audit/Auditlog.js";

import {
  createOrUpdateProjectFromAcceptedContract
} from "../projects/project.service.js";

import { Quotation } from "../quotations/Quotation.js";

import { Contract } from "./Contract.js";

import { ContractAccessToken } from "./ContractAccessToken.js";
import { ContractAcceptance } from "./ContractAcceptance.js";

import type {
  ListContractsQuery,
  UpdateContractInput
} from "./contract.validation.js";

interface AuditContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

interface ContractDraftInput {
  title: string;
  startDate?: string | null | undefined;
  expectedCompletionDate?: string | null | undefined;
  acceptanceDeadline?: string | null | undefined;
}

interface ContractResponseInput {
  response: "accepted" | "rejected";
  acceptedBy?: string | undefined;
  agreementConfirmed?: boolean | undefined;
  acceptedDocumentFileId?: string | null | undefined;
}

type ContractListFilter = {
  contractNumber?: RegExp;
  title?: RegExp;
  quotationNumber?: RegExp;
  "clientSnapshot.fullName"?: RegExp;
  "clientSnapshot.email"?: RegExp;
  "clientSnapshot.phone"?: RegExp;
  $or?: ContractListFilter[];
  status?: ContractStatus;
  clientId?: Types.ObjectId;
  quotationId?: Types.ObjectId;
  serviceRequestId?: Types.ObjectId;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
};

const ACCESS_TOKEN_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function createContractNumber(): string {
  const year = new Date().getFullYear();

  const reference = randomBytes(5)
    .toString("hex")
    .toUpperCase();

  return `PA-CON-${year}-${reference}`;
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

function parseOptionalDate(
  value: string | null | undefined,
  field: string
): Date | null {
  if (value === undefined || value === null) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `Invalid ${field}.`);
  }

  return date;
}

function validateContractDates(input: {
  startDate?: Date | null;
  expectedCompletionDate?: Date | null;
  acceptanceDeadline?: Date | null;
}): void {
  const {
    startDate,
    expectedCompletionDate,
    acceptanceDeadline
  } = input;

  if (
    startDate &&
    expectedCompletionDate &&
    expectedCompletionDate < startDate
  ) {
    throw new ApiError(
      400,
      "Expected completion date cannot be earlier than the start date."
    );
  }

  if (
    acceptanceDeadline &&
    acceptanceDeadline <= new Date()
  ) {
    throw new ApiError(
      400,
      "Contract acceptance deadline must be a future date."
    );
  }
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
): Promise<void> {
  await AuditLog.create(
    [
      {
        actorId: input.adminId,
        action: input.action,
        resourceType: "contract",
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

async function findValidAccessToken(
  token: string,
  session?: mongoose.ClientSession
) {
  if (
    !token ||
    token.length < 32 ||
    token.length > 512
  ) {
    throw new ApiError(
      404,
      "Contract link is invalid or unavailable."
    );
  }

  const accessToken = await ContractAccessToken.findOne({
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  })
    .select("+tokenHash")
    .session(session ?? null);

  if (!accessToken) {
    throw new ApiError(
      404,
      "Contract link is invalid or unavailable."
    );
  }

  return accessToken;
}

async function ensureLatestContractVersion(
  contract: {
    contractNumber: string;
    version: number;
  },
  session?: mongoose.ClientSession
): Promise<void> {
  const newerVersion = await Contract.exists({
    contractNumber: contract.contractNumber,
    version: { $gt: contract.version }
  }).session(session ?? null);

  if (newerVersion) {
    throw new ApiError(
      404,
      "Contract link is invalid or unavailable."
    );
  }
}

export async function createContractDraft(
  quotationId: string,
  input: ContractDraftInput,
  adminId: string,
  context: AuditContext = {}
) {
  const quotationObjectId = validateObjectId(
    quotationId,
    "quotation ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const title = input.title.trim();

  if (!title) {
    throw new ApiError(
      400,
      "Contract title is required."
    );
  }

  const startDate = parseOptionalDate(
    input.startDate,
    "contract start date"
  );

  const expectedCompletionDate = parseOptionalDate(
    input.expectedCompletionDate,
    "expected completion date"
  );

  const acceptanceDeadline = parseOptionalDate(
    input.acceptanceDeadline,
    "acceptance deadline"
  );

  validateContractDates({
    startDate,
    expectedCompletionDate,
    acceptanceDeadline
  });

  const session = await mongoose.startSession();

  let createdContractId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const quotation = await Quotation.findOne({
        _id: quotationObjectId,
        status: QuotationStatus.APPROVED
      }).session(session);

      if (!quotation) {
        throw new ApiError(
          404,
          "Approved quotation not found."
        );
      }

      const existingContract = await Contract.exists({
        quotationId: quotation._id
      }).session(session);

      if (existingContract) {
        throw new ApiError(
          409,
          "A contract has already been created from this quotation."
        );
      }

      if (!quotation.clientSnapshot) {
        throw new ApiError(
          400,
          "The approved quotation does not contain a valid client snapshot."
        );
      }

      if (
        quotation.items.length === 0 ||
        !Number.isSafeInteger(quotation.totalAmountKobo) ||
        quotation.totalAmountKobo < 0
      ) {
        throw new ApiError(
          400,
          "The approved quotation contains invalid contract information."
        );
      }

      const contract = new Contract({
        contractNumber: createContractNumber(),

        clientId: quotation.clientId,

        clientSnapshot: {
          fullName: quotation.clientSnapshot.fullName,
          email: quotation.clientSnapshot.email,
          phone: quotation.clientSnapshot.phone
        },

        serviceRequestId: quotation.serviceRequestId,

        quotationId: quotation._id,
        quotationNumber: quotation.quotationNumber,

        projectId: null,

        version: 1,
        previousVersionId: null,

        title,

        scope: quotation.scope,

        items: quotation.items.map((item) => ({
          serviceName: item.serviceName,
          description: item.description,
          deliverables: item.deliverables,
          quantity: item.quantity,
          unitAmountKobo: item.unitAmountKobo,
          totalAmountKobo: item.totalAmountKobo
        })),

        deliverables: [
          ...new Set(
            quotation.items.flatMap(
              (item) => item.deliverables
            )
          )
        ],

        contractAmountKobo: quotation.totalAmountKobo,

        terms: quotation.terms,

        startDate,
        expectedCompletionDate,
        acceptanceDeadline,

        status: ContractStatus.DRAFT,

        issuedAt: null
      });

      await contract.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "contract.created",
          resourceId: contract._id,
          description: "Contract draft created from an approved quotation.",
          metadata: {
            contractNumber: contract.contractNumber,
            contractVersion: contract.version,
            quotationId: quotation._id.toString(),
            quotationNumber: quotation.quotationNumber
          }
        },
        context,
        session
      );

      createdContractId = contract._id;
    });

    if (!createdContractId) {
      throw new ApiError(
        500,
        "Contract creation could not be completed."
      );
    }

    const contract = await Contract.findById(createdContractId);

    if (!contract) {
      throw new ApiError(
        500,
        "Created contract could not be retrieved."
      );
    }

    return contract;
  } finally {
    await session.endSession();
  }
}

export async function getContractById(
  contractId: string
) {
  const id = validateObjectId(
    contractId,
    "contract ID"
  );

  const contract = await Contract.findById(id);

  if (!contract) {
    throw new ApiError(404, "Contract not found.");
  }

  return contract;
}

export async function getContracts(
  query: ListContractsQuery
) {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    clientId,
    quotationId,
    serviceRequestId,
    from,
    to,
    sortBy = "createdAt",
    sortOrder = "desc"
  } = query;

  const filter: ContractListFilter = {};

  if (search?.trim()) {
    const searchRegex = new RegExp(
      escapeRegex(search.trim()),
      "i"
    );

    filter.$or = [
      { contractNumber: searchRegex },
      { title: searchRegex },
      { quotationNumber: searchRegex },
      { "clientSnapshot.fullName": searchRegex },
      { "clientSnapshot.email": searchRegex },
      { "clientSnapshot.phone": searchRegex }
    ];
  }

  if (status) {
    filter.status = status;
  }

  if (clientId) {
    filter.clientId = validateObjectId(
      clientId,
      "client ID"
    );
  }

  if (quotationId) {
    filter.quotationId = validateObjectId(
      quotationId,
      "quotation ID"
    );
  }

  if (serviceRequestId) {
    filter.serviceRequestId = validateObjectId(
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

    filter.createdAt = createdAt;
  }

  const skip = (page - 1) * limit;

  const sortDirection: 1 | -1 =
    sortOrder === "asc" ? 1 : -1;

  const sort: Record<string, 1 | -1> = {
    [sortBy]: sortDirection
  };

  const [contracts, total] = await Promise.all([
    Contract.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit),

    Contract.countDocuments(filter)
  ]);

  return {
    contracts,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export async function updateContractDraft(
  contractId: string,
  input: UpdateContractInput,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    contractId,
    "contract ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let updatedContractId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const contract = await Contract.findById(id)
        .session(session);

      if (!contract) {
        throw new ApiError(404, "Contract not found.");
      }

      if (contract.status !== ContractStatus.DRAFT) {
        throw new ApiError(
          409,
          "Only draft contracts can be updated."
        );
      }

      const startDate: Date | null =
        input.startDate !== undefined
          ? parseOptionalDate(
              input.startDate,
              "contract start date"
            )
          : contract.startDate ?? null;

      const expectedCompletionDate: Date | null =
        input.expectedCompletionDate !== undefined
          ? parseOptionalDate(
              input.expectedCompletionDate,
              "expected completion date"
            )
          : contract.expectedCompletionDate ?? null;

      const acceptanceDeadline: Date | null =
        input.acceptanceDeadline !== undefined
          ? parseOptionalDate(
              input.acceptanceDeadline,
              "acceptance deadline"
            )
          : contract.acceptanceDeadline ?? null;

      validateContractDates({
        startDate,
        expectedCompletionDate,
        acceptanceDeadline:
          input.acceptanceDeadline !== undefined
            ? acceptanceDeadline
            : null
      });

      const changes: Record<string, unknown> = {};

      if (input.title !== undefined) {
        changes.title = {
          before: contract.title,
          after: input.title
        };

        contract.title = input.title;
      }

      if (input.scope !== undefined) {
        changes.scope = {
          before: contract.scope,
          after: input.scope
        };

        contract.scope = input.scope;
      }

      if (input.deliverables !== undefined) {
        changes.deliverables = {
          before: [...contract.deliverables],
          after: [...input.deliverables]
        };

        contract.deliverables = [...input.deliverables];
      }

      if (input.terms !== undefined) {
        changes.terms = {
          before: [...contract.terms],
          after: [...input.terms]
        };

        contract.terms = [...input.terms];
      }

      if (input.startDate !== undefined) {
        changes.startDate = {
          before: contract.startDate,
          after: startDate
        };

        contract.startDate = startDate;
      }

      if (input.expectedCompletionDate !== undefined) {
        changes.expectedCompletionDate = {
          before: contract.expectedCompletionDate,
          after: expectedCompletionDate
        };

        contract.expectedCompletionDate = expectedCompletionDate;
      }

      if (input.acceptanceDeadline !== undefined) {
        changes.acceptanceDeadline = {
          before: contract.acceptanceDeadline,
          after: acceptanceDeadline
        };

        contract.acceptanceDeadline = acceptanceDeadline;
      }

      await contract.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "contract.updated",
          resourceId: contract._id,
          description: "Contract draft details updated.",
          changes,
          metadata: {
            contractNumber: contract.contractNumber,
            contractVersion: contract.version
          }
        },
        context,
        session
      );

      updatedContractId = contract._id;
    });

    if (!updatedContractId) {
      throw new ApiError(
        500,
        "Contract update could not be completed."
      );
    }

    const contract = await Contract.findById(updatedContractId);

    if (!contract) {
      throw new ApiError(
        500,
        "Updated contract could not be retrieved."
      );
    }

    return contract;
  } finally {
    await session.endSession();
  }
}

export async function issueContract(
  contractId: string,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    contractId,
    "contract ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let issuedContractId: Types.ObjectId | null = null;
  let rawToken: string | null = null;

  try {
    await session.withTransaction(async () => {
      const contract = await Contract.findById(id)
        .session(session);

      if (!contract) {
        throw new ApiError(404, "Contract not found.");
      }

      if (contract.status !== ContractStatus.DRAFT) {
        throw new ApiError(
          409,
          "Only draft contracts can be issued."
        );
      }

      if (
        !contract.acceptanceDeadline ||
        contract.acceptanceDeadline <= new Date()
      ) {
        throw new ApiError(
          400,
          "A valid future acceptance deadline is required before issuing the contract."
        );
      }

      await ensureLatestContractVersion(contract, session);

      const token = randomBytes(32).toString("hex");

      const expiresAt = new Date(
        Math.min(
          contract.acceptanceDeadline.getTime(),
          Date.now() + ACCESS_TOKEN_DURATION_MS
        )
      );

      const accessToken = new ContractAccessToken({
        contractId: contract._id,
        contractVersion: contract.version,
        tokenHash: hashToken(token),
        expiresAt
      });

      await accessToken.save({ session });

      contract.status = ContractStatus.ISSUED;
      contract.issuedAt = new Date();

      await contract.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "contract.issued",
          resourceId: contract._id,
          description: "Contract issued to the client.",
          metadata: {
            contractNumber: contract.contractNumber,
            contractVersion: contract.version,
            accessTokenId: accessToken._id.toString(),
            tokenExpiresAt: expiresAt.toISOString()
          }
        },
        context,
        session
      );

      issuedContractId = contract._id;
      rawToken = token;
    });

    if (!issuedContractId || !rawToken) {
      throw new ApiError(
        500,
        "Contract issuance could not be completed."
      );
    }

    const contract = await Contract.findById(issuedContractId);

    if (!contract) {
      throw new ApiError(
        500,
        "Issued contract could not be retrieved."
      );
    }

    return {
      contract,
      accessToken: rawToken
    };
  } finally {
    await session.endSession();
  }
}

export async function withdrawContract(
  contractId: string,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    contractId,
    "contract ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const contract = await Contract.findById(id)
        .session(session);

      if (!contract) {
        throw new ApiError(404, "Contract not found.");
      }

      if (contract.status !== ContractStatus.ISSUED) {
        throw new ApiError(
          409,
          "Only issued contracts can be withdrawn."
        );
      }

      contract.status = ContractStatus.WITHDRAWN;

      await contract.save({ session });

      const revokedAt = new Date();

      await ContractAccessToken.updateMany(
        {
          contractId: contract._id,
          contractVersion: contract.version,
          revokedAt: null
        },
        {
          $set: { revokedAt }
        },
        { session }
      );

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "contract.withdrawn",
          resourceId: contract._id,
          description: "Issued contract withdrawn.",
          metadata: {
            contractNumber: contract.contractNumber,
            contractVersion: contract.version
          }
        },
        context,
        session
      );
    });

    const contract = await Contract.findById(id);

    if (!contract) {
      throw new ApiError(404, "Contract not found.");
    }

    return contract;
  } finally {
    await session.endSession();
  }
}

export async function createContractRevision(
  contractId: string,
  adminId: string,
  context: AuditContext = {}
) {
  const id = validateObjectId(
    contractId,
    "contract ID"
  );

  const administratorId = validateObjectId(
    adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let newContractId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const previousContract = await Contract.findById(id)
        .session(session);

      if (!previousContract) {
        throw new ApiError(404, "Contract not found.");
      }

      if (previousContract.status === ContractStatus.DRAFT) {
        throw new ApiError(
          409,
          "A revision cannot be created from a draft contract."
        );
      }

      if (previousContract.status === ContractStatus.WITHDRAWN) {
        throw new ApiError(
          409,
          "A revision cannot be created from a withdrawn contract."
        );
      }

      await ensureLatestContractVersion(
        previousContract,
        session
      );

      const revokedAt = new Date();

      await ContractAccessToken.updateMany(
        {
          contractId: previousContract._id,
          contractVersion: previousContract.version,
          revokedAt: null
        },
        {
          $set: { revokedAt }
        },
        { session }
      );

      const revision = new Contract({
        contractNumber: previousContract.contractNumber,

        clientId: previousContract.clientId,
        clientSnapshot: previousContract.clientSnapshot,

        serviceRequestId: previousContract.serviceRequestId,

        quotationId: previousContract.quotationId,
        quotationNumber: previousContract.quotationNumber,

        projectId: previousContract.projectId,

        version: previousContract.version + 1,
        previousVersionId: previousContract._id,

        title: previousContract.title,
        scope: previousContract.scope,

        items: previousContract.items.map((item) => ({
          serviceName: item.serviceName,
          description: item.description,
          deliverables: item.deliverables,
          quantity: item.quantity,
          unitAmountKobo: item.unitAmountKobo,
          totalAmountKobo: item.totalAmountKobo
        })),

        deliverables: [...previousContract.deliverables],

        contractAmountKobo: previousContract.contractAmountKobo,

        terms: [...previousContract.terms],

        startDate: previousContract.startDate,
        expectedCompletionDate: previousContract.expectedCompletionDate,

        acceptanceDeadline: null,

        status: ContractStatus.DRAFT,

        issuedAt: null
      });

      await revision.save({ session });

      await writeAuditLog(
        {
          adminId: administratorId,
          action: "contract.revised",
          resourceId: revision._id,
          description: "New contract revision created.",
          metadata: {
            contractNumber: revision.contractNumber,
            previousVersion: previousContract.version,
            newVersion: revision.version,
            previousContractId: previousContract._id.toString()
          }
        },
        context,
        session
      );

      newContractId = revision._id;
    });

    if (!newContractId) {
      throw new ApiError(
        500,
        "Contract revision could not be created."
      );
    }

    const revision = await Contract.findById(newContractId);

    if (!revision) {
      throw new ApiError(
        500,
        "Created contract revision could not be retrieved."
      );
    }

    return revision;
  } finally {
    await session.endSession();
  }
}

export async function getContractByAccessToken(
  token: string
) {
  const accessToken = await findValidAccessToken(token);

  const contract = await Contract.findOne({
    _id: accessToken.contractId,
    version: accessToken.contractVersion,
    status: ContractStatus.ISSUED
  });

  if (!contract) {
    throw new ApiError(
      404,
      "Contract link is invalid or unavailable."
    );
  }

  await ensureLatestContractVersion(contract);

  if (
    !contract.acceptanceDeadline ||
    contract.acceptanceDeadline <= new Date()
  ) {
    throw new ApiError(
      410,
      "This contract has expired."
    );
  }

  await ContractAccessToken.updateOne(
    { _id: accessToken._id },
    {
      $set: {
        lastAccessedAt: new Date()
      }
    }
  );

  return contract;
}

export async function respondToContract(
  token: string,
  input: ContractResponseInput,
  context: AuditContext = {}
) {
  const session = await mongoose.startSession();

  let respondedContractId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const accessToken = await findValidAccessToken(
        token,
        session
      );

      const contract = await Contract.findOne({
        _id: accessToken.contractId,
        version: accessToken.contractVersion
      }).session(session);

      if (
        !contract ||
        contract.status !== ContractStatus.ISSUED
      ) {
        throw new ApiError(
          404,
          "Contract link is invalid or unavailable."
        );
      }

      await ensureLatestContractVersion(contract, session);

      if (
        !contract.acceptanceDeadline ||
        contract.acceptanceDeadline <= new Date()
      ) {
        throw new ApiError(
          410,
          "This contract has expired."
        );
      }

      const respondedAt = new Date();

      if (input.response === "accepted") {
        const acceptedBy = input.acceptedBy?.trim();

        if (!acceptedBy) {
          throw new ApiError(
            400,
            "The name of the person accepting the contract is required."
          );
        }

        if (input.agreementConfirmed !== true) {
          throw new ApiError(
            400,
            "You must explicitly confirm your agreement to the contract."
          );
        }

        const acceptedDocumentFileId =
          input.acceptedDocumentFileId
            ? validateObjectId(
                input.acceptedDocumentFileId,
                "accepted contract document ID"
              )
            : null;

        await ContractAcceptance.create(
          [
            {
              contractId: contract._id,
              contractVersion: contract.version,
              acceptedBy,
              acceptedAt: respondedAt,
              agreementConfirmed: true,
              acceptedDocumentFileId,
              evidence: {
                ipAddress: context.ipAddress ?? null,
                userAgent: context.userAgent ?? null
              }
            }
          ],
          { session }
        );

        contract.status = ContractStatus.ACCEPTED;

        await contract.save({ session });

        await createOrUpdateProjectFromAcceptedContract(
          contract._id,
          session,
          context
        );
      } else {
        contract.status = ContractStatus.REJECTED;

        await contract.save({ session });
      }

      await ContractAccessToken.updateMany(
        {
          contractId: contract._id,
          contractVersion: contract.version,
          revokedAt: null
        },
        {
          $set: {
            revokedAt: respondedAt
          }
        },
        { session }
      );

      await writeAuditLog(
        {
          adminId: null,
          action: `contract.client_${input.response}`,
          resourceId: contract._id,
          description:
            input.response === "accepted"
              ? "Client accepted the contract."
              : "Client rejected the contract.",
          metadata: {
            contractNumber: contract.contractNumber,
            contractVersion: contract.version
          }
        },
        context,
        session
      );

      respondedContractId = contract._id;
    });

    if (!respondedContractId) {
      throw new ApiError(
        500,
        "Contract response could not be recorded."
      );
    }

    const contract = await Contract.findById(respondedContractId);

    if (!contract) {
      throw new ApiError(
        500,
        "Contract response could not be retrieved."
      );
    }

    return contract;
  } finally {
    await session.endSession();
  }
}
