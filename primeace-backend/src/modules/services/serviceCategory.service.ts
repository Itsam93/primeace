import mongoose, { Types } from "mongoose";

import { ApiError } from "../../shared/errors/ApiError.js";
import { AuditLog } from "../audit/Auditlog.js";

import { Service } from "./Service.js";
import { ServiceCategory } from "./ServiceCategory.js";

import type {
  CreateServiceCategoryInput,
  ListServiceCategoriesQuery,
  UpdateServiceCategoryInput,
  UpdateServiceCategoryStatusInput
} from "./serviceCategory.validation.js";

interface AuditMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

interface CreateServiceCategoryOptions {
  input: CreateServiceCategoryInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface UpdateServiceCategoryOptions {
  categoryId: string;
  input: UpdateServiceCategoryInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface UpdateServiceCategoryStatusOptions {
  categoryId: string;
  input: UpdateServiceCategoryStatusInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface DeleteServiceCategoryOptions {
  categoryId: string;
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

async function getCategoryOrThrow(
  categoryId: Types.ObjectId,
  session?: mongoose.ClientSession
) {
  let query = ServiceCategory.findOne({
    _id: categoryId,
    isDeleted: false
  });

  if (session) {
    query = query.session(session);
  }

  const category = await query;

  if (!category) {
    throw new ApiError(404, "Service category not found.");
  }

  return category;
}

async function assertSlugAvailable(
  slug: string,
  excludeCategoryId?: Types.ObjectId,
  session?: mongoose.ClientSession
): Promise<void> {
  const filter: Record<string, unknown> = {
    slug,
    isDeleted: false
  };

  if (excludeCategoryId) {
    filter._id = { $ne: excludeCategoryId };
  }

  let query = ServiceCategory.findOne(filter);

  if (session) {
    query = query.session(session);
  }

  if (await query) {
    throw new ApiError(
      409,
      "A service category with this slug already exists."
    );
  }
}

export async function createServiceCategory(
  options: CreateServiceCategoryOptions
) {
  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  let categoryId: Types.ObjectId | undefined;

  try {
    await session.withTransaction(async () => {
      await assertSlugAvailable(
        options.input.slug,
        undefined,
        session
      );

      const [category] = await ServiceCategory.create(
        [
          {
            ...options.input
          }
        ],
        { session }
      );

      if (!category) {
        throw new ApiError(
          500,
          "The service category could not be created."
        );
      }

      categoryId = category._id;

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_category.created",
            resourceType: "service_category",
            resourceId: category._id,
            description: `Service category "${category.name}" was created.`,
            changes: {
              after: {
                name: category.name,
                slug: category.slug,
                description: category.description,
                displayOrder: category.displayOrder,
                isActive: category.isActive
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
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new ApiError(
        409,
        "A service category with this slug already exists."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  if (!categoryId) {
    throw new ApiError(
      500,
      "The service category could not be retrieved."
    );
  }

  return getServiceCategoryById(categoryId.toString());
}

export async function listServiceCategories(
  options: ListServiceCategoriesQuery
) {
  const filter: Record<string, unknown> = {};

  if (!options.includeDeleted) {
    filter.isDeleted = false;
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
      { description: search }
    ];
  }

  const sortDirection = options.sortOrder === "asc" ? 1 : -1;

  const skip = (options.page - 1) * options.limit;

  const [categories, total] = await Promise.all([
    ServiceCategory.find(filter)
      .sort({
        [options.sortBy]: sortDirection,
        _id: 1
      })
      .skip(skip)
      .limit(options.limit)
      .lean(),

    ServiceCategory.countDocuments(filter)
  ]);

  return {
    categories,
    pagination: {
      page: options.page,
      limit: options.limit,
      total,
      totalPages: Math.ceil(total / options.limit)
    }
  };
}

export async function getServiceCategoryById(
  categoryId: string
) {
  const id = assertObjectId(
    categoryId,
    "category ID"
  );

  const category = await ServiceCategory.findOne({
    _id: id,
    isDeleted: false
  }).lean();

  if (!category) {
    throw new ApiError(
      404,
      "Service category not found."
    );
  }

  const serviceCount = await Service.countDocuments({
    categoryId: id,
    isDeleted: false
  });

  return {
    ...category,
    serviceCount
  };
}

export async function updateServiceCategory(
  options: UpdateServiceCategoryOptions
) {
  const categoryId = assertObjectId(
    options.categoryId,
    "category ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const category = await getCategoryOrThrow(
        categoryId,
        session
      );

      const before = {
        name: category.name,
        slug: category.slug,
        description: category.description,
        displayOrder: category.displayOrder
      };

      if (options.input.slug) {
        await assertSlugAvailable(
          options.input.slug,
          categoryId,
          session
        );
      }

      Object.assign(category, options.input);

      await category.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_category.updated",
            resourceType: "service_category",
            resourceId: categoryId,
            description: `Service category "${category.name}" was updated.`,
            changes: {
              before,
              after: {
                name: category.name,
                slug: category.slug,
                description: category.description,
                displayOrder: category.displayOrder
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
  } catch (error) {
    if (
      error instanceof mongoose.mongo.MongoServerError &&
      error.code === 11000
    ) {
      throw new ApiError(
        409,
        "A service category with this slug already exists."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return getServiceCategoryById(options.categoryId);
}

export async function updateServiceCategoryStatus(
  options: UpdateServiceCategoryStatusOptions
) {
  const categoryId = assertObjectId(
    options.categoryId,
    "category ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const category = await getCategoryOrThrow(
        categoryId,
        session
      );

      if (category.isActive === options.input.isActive) {
        throw new ApiError(
          422,
          `The service category is already ${options.input.isActive ? "active" : "inactive"}.`
        );
      }

      if (!options.input.isActive) {
        const activeServiceExists = await Service.exists({
          categoryId,
          isActive: true,
          isDeleted: false
        }).session(session);

        if (activeServiceExists) {
          throw new ApiError(
            409,
            "Deactivate or reassign all active services in this category before deactivating it."
          );
        }
      }

      const previousStatus = category.isActive;

      category.isActive = options.input.isActive;

      await category.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_category.status_updated",
            resourceType: "service_category",
            resourceId: categoryId,
            description: `Service category "${category.name}" was ${category.isActive ? "activated" : "deactivated"}.`,
            changes: {
              before: {
                isActive: previousStatus
              },
              after: {
                isActive: category.isActive
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

  return getServiceCategoryById(options.categoryId);
}

export async function deleteServiceCategory(
  options: DeleteServiceCategoryOptions
) {
  const categoryId = assertObjectId(
    options.categoryId,
    "category ID"
  );

  const adminId = assertObjectId(
    options.adminId,
    "administrator ID"
  );

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const category = await getCategoryOrThrow(
        categoryId,
        session
      );

      const activeServiceExists = await Service.exists({
        categoryId,
        isActive: true,
        isDeleted: false
      }).session(session);

      if (activeServiceExists) {
        throw new ApiError(
          409,
          "Deactivate or reassign all active services in this category before deleting it."
        );
      }

      const previousState = {
        isDeleted: category.isDeleted,
        deletedAt: category.deletedAt,
        deletedBy: category.deletedBy
      };

      category.isDeleted = true;
      category.deletedAt = new Date();
      category.deletedBy = adminId;

      await category.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "service_category.deleted",
            resourceType: "service_category",
            resourceId: categoryId,
            description: `Service category "${category.name}" was soft-deleted.`,
            changes: {
              before: previousState,
              after: {
                isDeleted: category.isDeleted,
                deletedAt: category.deletedAt,
                deletedBy: category.deletedBy
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
    categoryId: options.categoryId,
    deleted: true
  };
}
