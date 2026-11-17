import mongoose, { Types } from "mongoose";

import { ApiError } from "../../shared/errors/ApiError.js";
import { AuditLog } from "../audit/Auditlog.js";

import { Service } from "./Service.js";
import { ServiceCategory } from "./ServiceCategory.js";
import { ServiceForm } from "./ServiceForm.js";

import type {
  CreateServiceInput,
  ListServicesQuery,
  UpdateServiceInput,
  UpdateServiceStatusInput
} from "./service.validation.js";

interface AuditMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

interface CreateServiceOptions {
  input: CreateServiceInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface UpdateServiceOptions {
  serviceId: string;
  input: UpdateServiceInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface UpdateServiceStatusOptions {
  serviceId: string;
  input: UpdateServiceStatusInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface DeleteServiceOptions {
  serviceId: string;
  adminId: string;
  auditMetadata: AuditMetadata;
}

function assertObjectId(
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

async function getActiveServiceById(serviceId: string) {
  if (!Types.ObjectId.isValid(serviceId)) {
    throw new ApiError(400, "Invalid service ID.");
  }

  const service = await Service.findOne({
    _id: serviceId,
    isActive: true,
    isDeleted: false
  }).lean();

  if (!service) {
    throw new ApiError(404, "Service not found.");
  }

  const category = await ServiceCategory.findOne({
    _id: service.categoryId,
    isActive: true,
    isDeleted: false
  }).lean();

  if (!category) {
    throw new ApiError(404, "Service not found.");
  }

  return { service, category };
}

async function getServiceOrThrow(
  serviceId: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  let query = Service.findOne({
    _id: serviceId,
    isDeleted: false
  });

  if (session) {
    query = query.session(session);
  }

  const service = await query;

  if (!service) {
    throw new ApiError(404, "Service not found.");
  }

  return service;
}

async function getActiveCategoryOrThrow(
  categoryId: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  let query = ServiceCategory.findOne({
    _id: categoryId,
    isActive: true,
    isDeleted: false
  });

  if (session) {
    query = query.session(session);
  }

  const category = await query;

  if (!category) {
    throw new ApiError(
      422,
      "The selected service category does not exist or is inactive."
    );
  }

  return category;
}

async function assertSlugAvailable(
  categoryId: Types.ObjectId,
  slug: string,
  excludeServiceId?: Types.ObjectId,
  session?: mongoose.ClientSession
): Promise<void> {
  const filter: Record<string, unknown> = {
    categoryId,
    slug,
    isDeleted: false
  };

  if (excludeServiceId) {
    filter._id = { $ne: excludeServiceId };
  }

  let query = Service.findOne(filter);

  if (session) {
    query = query.session(session);
  }

  if (await query) {
    throw new ApiError(
      409,
      "A service with this slug already exists in the selected category."
    );
  }
}

function getServiceSnapshot(service: {
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  displayOrder: number;
  isActive: boolean;
}) {
  return {
    categoryId: service.categoryId,
    name: service.name,
    slug: service.slug,
    shortDescription: service.shortDescription,
    description: service.description,
    deliverables: [...service.deliverables],
    displayOrder: service.displayOrder,
    isActive: service.isActive
  };
}

export async function getPublicServices() {
  const categories = await ServiceCategory.find({
    isActive: true,
    isDeleted: false
  })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  if (categories.length === 0) {
    return { categories: [] };
  }

  const services = await Service.find({
    categoryId: { $in: categories.map((category) => category._id) },
    isActive: true,
    isDeleted: false
  })
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  return {
    categories: categories.map((category) => ({
      ...category,
      services: services.filter(
        (service) =>
          service.categoryId.toString() === category._id.toString()
      )
    }))
  };
}

export async function getPublicService(serviceId: string) {
  return getActiveServiceById(serviceId);
}

export async function getPublicServiceForm(serviceId: string) {
  const { service } = await getActiveServiceById(serviceId);

  const form = await ServiceForm.findOne({
    serviceId: service._id,
    isActive: true
  })
    .select("serviceId version fields publishedAt")
    .lean();

  if (!form) {
    throw new ApiError(404, "No published form is available for this service.");
  }

  return {
    serviceId: form.serviceId,
    version: form.version,
    publishedAt: form.publishedAt,
    fields: form.fields
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((field) => {
        const {
          acceptedMimeTypes,
          maxFiles,
          maxFileSizeBytes,
          ...publicField
        } = field;

        return publicField;
      })
  };
}

export async function listServices(options: ListServicesQuery) {
  const filter: Record<string, unknown> = {};

  if (!options.includeDeleted) {
    filter.isDeleted = false;
  }

  if (options.categoryId) {
    filter.categoryId = assertObjectId(
      options.categoryId,
      "category ID"
    );
  }

  if (options.isActive !== undefined) {
    filter.isActive = options.isActive;
  }

  if (options.search) {
    const search = new RegExp(
      escapeRegex(options.search),
      "i"
    );

    filter.$or = [
      { name: search },
      { slug: search },
      { shortDescription: search },
      { description: search }
    ];
  }

  const sortDirection = options.sortOrder === "asc" ? 1 : -1;
  const skip = (options.page - 1) * options.limit;

  const [services, total] = await Promise.all([
    Service.find(filter)
      .sort({
        [options.sortBy]: sortDirection,
        _id: 1
      })
      .skip(skip)
      .limit(options.limit)
      .lean(),

    Service.countDocuments(filter)
  ]);

  return {
    services,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit)
    }
  };
}

export async function getServiceById(serviceId: string) {
  const id = assertObjectId(serviceId, "service ID");

  const service = await Service.findOne({
    _id: id,
    isDeleted: false
  }).lean();

  if (!service) {
    throw new ApiError(404, "Service not found.");
  }

  return service;
}

export async function createService(
  options: CreateServiceOptions
) {
  const categoryId = assertObjectId(
    options.input.categoryId,
    "category ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let serviceId: Types.ObjectId | undefined;

  try {
    await session.withTransaction(async () => {
      await getActiveCategoryOrThrow(categoryId, session);

      await assertSlugAvailable(
        categoryId,
        options.input.slug,
        undefined,
        session
      );

      const [service] = await Service.create(
        [
          {
            ...options.input,
            categoryId
          }
        ],
        { session }
      );

      if (!service) {
        throw new ApiError(
          500,
          "The service could not be created."
        );
      }

      serviceId = service._id;

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service.created",
            resourceType: "service",
            resourceId: service._id,
            description: `Service "${service.name}" was created.`,
            changes: {
              after: getServiceSnapshot(service)
            },
            metadata: null,
            ipAddress: options.auditMetadata.ipAddress,
            userAgent: options.auditMetadata.userAgent
          }
        ],
        { session }
      );
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new ApiError(
        409,
        "A service with this slug already exists in the selected category."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  if (!serviceId) {
    throw new ApiError(
      500,
      "The service could not be retrieved."
    );
  }

  return getServiceById(serviceId.toString());
}

export async function updateService(
  options: UpdateServiceOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const service = await getServiceOrThrow(
        serviceId,
        session
      );

      const before = getServiceSnapshot(service);

      const categoryId = options.input.categoryId
        ? assertObjectId(options.input.categoryId, "category ID")
        : service.categoryId;

      if (options.input.categoryId) {
        await getActiveCategoryOrThrow(categoryId, session);
      }

      const slug = options.input.slug ?? service.slug;

      await assertSlugAvailable(
        categoryId,
        slug,
        serviceId,
        session
      );

      Object.assign(service, {
        ...options.input,
        categoryId
      });

      await service.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service.updated",
            resourceType: "service",
            resourceId: serviceId,
            description: `Service "${service.name}" was updated.`,
            changes: {
              before,
              after: getServiceSnapshot(service)
            },
            metadata: null,
            ipAddress: options.auditMetadata.ipAddress,
            userAgent: options.auditMetadata.userAgent
          }
        ],
        { session }
      );
    });
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new ApiError(
        409,
        "A service with this slug already exists in the selected category."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return getServiceById(options.serviceId);
}

export async function updateServiceStatus(
  options: UpdateServiceStatusOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const service = await getServiceOrThrow(
        serviceId,
        session
      );

      if (service.isActive === options.input.isActive) {
        throw new ApiError(
          422,
          `The service is already ${options.input.isActive ? "active" : "inactive"}.`
        );
      }

      if (options.input.isActive) {
        await getActiveCategoryOrThrow(
          service.categoryId,
          session
        );
      }

      const previousStatus = service.isActive;

      service.isActive = options.input.isActive;

      await service.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service.status_updated",
            resourceType: "service",
            resourceId: serviceId,
            description: `Service "${service.name}" was ${service.isActive ? "activated" : "deactivated"}.`,
            changes: {
              before: {
                isActive: previousStatus
              },
              after: {
                isActive: service.isActive
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

  return getServiceById(options.serviceId);
}

export async function deleteService(
  options: DeleteServiceOptions
) {
  const serviceId = assertObjectId(
    options.serviceId,
    "service ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const service = await getServiceOrThrow(
        serviceId,
        session
      );

      const previousState = {
        isActive: service.isActive,
        isDeleted: service.isDeleted,
        deletedAt: service.deletedAt,
        deletedBy: service.deletedBy
      };

      service.isActive = false;
      service.isDeleted = true;
      service.deletedAt = new Date();
      service.deletedBy = adminId;

      await service.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service.deleted",
            resourceType: "service",
            resourceId: serviceId,
            description: `Service "${service.name}" was soft-deleted.`,
            changes: {
              before: previousState,
              after: {
                isActive: service.isActive,
                isDeleted: service.isDeleted,
                deletedAt: service.deletedAt,
                deletedBy: service.deletedBy
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

  return {
    serviceId: options.serviceId,
    deleted: true
  };
}
