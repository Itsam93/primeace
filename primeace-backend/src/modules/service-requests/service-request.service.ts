import mongoose, { Types } from "mongoose";

import { RequestStatus } from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";
import { AuditLog } from "../audit/Auditlog.js";
import { ServiceRequest } from "./ServiceRequest.js";
import { ServiceRequestNote } from "./ServiceRequestNote.js";

interface ListServiceRequestsOptions {
  page: number;
  limit: number;
  search?: string | undefined;
  status?: RequestStatus | undefined;
  serviceId?: string | undefined;
  categoryId?: string | undefined;
  submittedFrom?: string | undefined;
  submittedTo?: string | undefined;
  sortBy: "submittedAt" | "createdAt" | "status";
  sortOrder: "asc" | "desc";
}

interface ListServiceRequestNotesOptions {
  requestId: string;
  page: number;
  limit: number;
}

interface AuditMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

interface UpdateServiceRequestStatusOptions {
  requestId: string;
  status: RequestStatus;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface CreateServiceRequestNoteOptions {
  requestId: string;
  content: string;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface ServiceRequestListItem {
  _id: Types.ObjectId;
  reference: string;
  clientSnapshot: {
    fullName: string;
    email: string | null;
    phone: string;
  };
  items: {
    serviceId: Types.ObjectId;
    serviceName: string;
    categoryId: Types.ObjectId;
    categoryName: string;
  }[];
  status: RequestStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceRequestDetails {
  _id: Types.ObjectId;
  reference: string;
  clientId: Types.ObjectId;
  clientSnapshot: {
    fullName: string;
    email: string | null;
    phone: string;
  };
  items: {
    _id: Types.ObjectId;
    serviceId: Types.ObjectId;
    serviceName: string;
    categoryId: Types.ObjectId;
    categoryName: string;
    formVersion: number;
    answers: Record<string, unknown>;
    fileIds: Types.ObjectId[];
  }[];
  status: RequestStatus;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceRequestNoteItem {
  _id: Types.ObjectId;
  serviceRequestId: Types.ObjectId;
  adminId: {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
  };
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const allowedStatusTransitions: Record<
  RequestStatus,
  readonly RequestStatus[]
> = {
  [RequestStatus.NEW]: [
    RequestStatus.UNDER_REVIEW,
    RequestStatus.DECLINED,
    RequestStatus.CLOSED
  ],

  [RequestStatus.UNDER_REVIEW]: [
    RequestStatus.AWAITING_INFORMATION,
    RequestStatus.QUOTED,
    RequestStatus.DECLINED,
    RequestStatus.CLOSED
  ],

  [RequestStatus.AWAITING_INFORMATION]: [
    RequestStatus.UNDER_REVIEW,
    RequestStatus.DECLINED,
    RequestStatus.CLOSED
  ],

  [RequestStatus.QUOTED]: [
    RequestStatus.CONVERTED,
    RequestStatus.DECLINED,
    RequestStatus.CLOSED
  ],

  [RequestStatus.CONVERTED]: [
    RequestStatus.CLOSED
  ],

  [RequestStatus.DECLINED]: [
    RequestStatus.CLOSED
  ],

  [RequestStatus.CLOSED]: []
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertObjectId(value: string, field: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${field}.`);
  }

  return new Types.ObjectId(value);
}

async function assertServiceRequestExists(
  requestId: Types.ObjectId
): Promise<void> {
  const exists = await ServiceRequest.exists({
    _id: requestId,
    isDeleted: false
  });

  if (!exists) {
    throw new ApiError(404, "Service request not found.");
  }
}

function buildServiceRequestFilter(
  options: ListServiceRequestsOptions
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    isDeleted: false
  };

  if (options.status) {
    filter.status = options.status;
  }

  if (options.serviceId) {
    filter["items.serviceId"] = assertObjectId(
      options.serviceId,
      "service ID"
    );
  }

  if (options.categoryId) {
    filter["items.categoryId"] = assertObjectId(
      options.categoryId,
      "category ID"
    );
  }

  if (options.submittedFrom || options.submittedTo) {
    const submittedAt: Record<string, Date> = {};

    if (options.submittedFrom) {
      submittedAt.$gte = new Date(options.submittedFrom);
    }

    if (options.submittedTo) {
      submittedAt.$lte = new Date(options.submittedTo);
    }

    filter.submittedAt = submittedAt;
  }

  if (options.search) {
    const search = new RegExp(
      escapeRegex(options.search),
      "i"
    );

    filter.$or = [
      { reference: search },
      { "clientSnapshot.fullName": search },
      { "clientSnapshot.email": search },
      { "clientSnapshot.phone": search }
    ];
  }

  return filter;
}

export async function listServiceRequests(
  options: ListServiceRequestsOptions
): Promise<{
  requests: ServiceRequestListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  if (
    options.submittedFrom &&
    options.submittedTo &&
    new Date(options.submittedFrom) > new Date(options.submittedTo)
  ) {
    throw new ApiError(
      422,
      "The submission start date cannot be later than the end date."
    );
  }

  const filter = buildServiceRequestFilter(options);

  const sortDirection = options.sortOrder === "asc" ? 1 : -1;

  const sort: Record<string, 1 | -1> = {
    [options.sortBy]: sortDirection
  };

  const skip = (options.page - 1) * options.limit;

  const [requests, total] = await Promise.all([
    ServiceRequest.find(filter)
      .select(
        "_id reference clientSnapshot items.serviceId items.serviceName items.categoryId items.categoryName status submittedAt createdAt updatedAt"
      )
      .sort(sort)
      .skip(skip)
      .limit(options.limit)
      .lean<ServiceRequestListItem[]>(),

    ServiceRequest.countDocuments(filter)
  ]);

  return {
    requests,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit)
    }
  };
}

export async function getServiceRequestById(
  requestId: string
): Promise<ServiceRequestDetails> {
  const id = assertObjectId(requestId, "service request ID");

  const request = await ServiceRequest.findOne({
    _id: id,
    isDeleted: false
  })
    .lean<ServiceRequestDetails>();

  if (!request) {
    throw new ApiError(404, "Service request not found.");
  }

  return request;
}

export async function updateServiceRequestStatus(
  options: UpdateServiceRequestStatusOptions
): Promise<ServiceRequestDetails> {
  const requestId = assertObjectId(
    options.requestId,
    "service request ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const request = await ServiceRequest.findOne({
        _id: requestId,
        isDeleted: false
      }).session(session);

      if (!request) {
        throw new ApiError(404, "Service request not found.");
      }

      const currentStatus = request.status;

      if (currentStatus === options.status) {
        throw new ApiError(
          422,
          "The service request already has this status."
        );
      }

      const allowedStatuses =
        allowedStatusTransitions[currentStatus];

      if (!allowedStatuses.includes(options.status)) {
        throw new ApiError(
          422,
          `A service request cannot transition from ${currentStatus} to ${options.status}.`
        );
      }

      request.status = options.status;

      await request.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_request.status_updated",
            resourceType: "service_request",
            resourceId: requestId,
            description: `Service request ${request.reference} status changed from ${currentStatus} to ${options.status}.`,
            changes: {
              before: {
                status: currentStatus
              },
              after: {
                status: options.status
              }
            },
            metadata: null,
            ipAddress: options.auditMetadata.ipAddress,
            userAgent: options.auditMetadata.userAgent
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return getServiceRequestById(options.requestId);
}

export async function createServiceRequestNote(
  options: CreateServiceRequestNoteOptions
): Promise<ServiceRequestNoteItem> {
  const requestId = assertObjectId(
    options.requestId,
    "service request ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let createdNoteId: Types.ObjectId | null = null;

  try {
    await session.withTransaction(async () => {
      const request = await ServiceRequest.findOne({
        _id: requestId,
        isDeleted: false
      }).session(session);

      if (!request) {
        throw new ApiError(404, "Service request not found.");
      }

      const [note] = await ServiceRequestNote.create(
        [
          {
            serviceRequestId: requestId,
            adminId,
            content: options.content
          }
        ],
        { session }
      );

      if (!note) {
        throw new ApiError(
          500,
          "The internal note could not be created."
        );
      }

      createdNoteId = note._id;

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_request.note_created",
            resourceType: "service_request",
            resourceId: requestId,
            description: `An internal note was added to service request ${request.reference}.`,
            changes: null,
            metadata: {
              noteId: note._id
            },
            ipAddress: options.auditMetadata.ipAddress,
            userAgent: options.auditMetadata.userAgent
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  if (!createdNoteId) {
    throw new ApiError(
      500,
      "The internal note could not be retrieved."
    );
  }

  const createdNote = await ServiceRequestNote.findById(
    createdNoteId
  )
    .populate("adminId", "fullName email")
    .lean<ServiceRequestNoteItem>();

  if (!createdNote) {
    throw new ApiError(
      500,
      "The internal note could not be retrieved."
    );
  }

  return createdNote;
}

export async function listServiceRequestNotes(
  options: ListServiceRequestNotesOptions
): Promise<{
  notes: ServiceRequestNoteItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const requestId = assertObjectId(
    options.requestId,
    "service request ID"
  );

  await assertServiceRequestExists(requestId);

  const filter = {
    serviceRequestId: requestId
  };

  const skip = (options.page - 1) * options.limit;

  const [notes, total] = await Promise.all([
    ServiceRequestNote.find(filter)
      .populate("adminId", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(options.limit)
      .lean<ServiceRequestNoteItem[]>(),

    ServiceRequestNote.countDocuments(filter)
  ]);

  return {
    notes,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit)
    }
  };
}
