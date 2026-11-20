import mongoose, { Types } from "mongoose";

import { ApiError } from "../../shared/errors/ApiError.js";
import { AuditLog } from "../audit/Auditlog.js";

import { Project } from "./Project.js";
import { ProjectCategory } from "./ProjectCategory.js";

import type {
  CreateProjectCategoryInput,
  ListProjectCategoriesQuery,
  UpdateProjectCategoryInput,
  UpdateProjectCategoryStatusInput
} from "./project-category.validation.js";

interface AuditMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

interface CreateProjectCategoryOptions {
  input: CreateProjectCategoryInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface UpdateProjectCategoryOptions {
  categoryId: string;
  input: UpdateProjectCategoryInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface UpdateProjectCategoryStatusOptions {
  categoryId: string;
  input: UpdateProjectCategoryStatusInput;
  adminId: string;
  auditMetadata: AuditMetadata;
}

interface DeleteProjectCategoryOptions {
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
  let query = ProjectCategory.findOne({
    _id: categoryId,
    isDeleted: false
  });

  if (session) {
    query = query.session(session);
  }

  const category = await query;

  if (!category) {
    throw new ApiError(404, "Project category not found.");
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

  let query = ProjectCategory.findOne(filter);

  if (session) {
    query = query.session(session);
  }

  if (await query) {
    throw new ApiError(
      409,
      "A project category with this slug already exists."
    );
  }
}

export async function createProjectCategory(
  options: CreateProjectCategoryOptions
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

      const [category] = await ProjectCategory.create(
        [
          {
            ...options.input,
            description: options.input.description ?? null
          }
        ],
        { session }
      );

      if (!category) {
        throw new ApiError(
          500,
          "The project category could not be created."
        );
      }

      categoryId = category._id;

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "project_category.created",
            resourceType: "project_category",
            resourceId: category._id,
            description: `Project category "${category.name}" was created.`,
            changes: {
              after: {
                name: category.name,
                slug: category.slug,
                description: category.description,
                sortOrder: category.sortOrder,
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
        "A project category with this slug already exists."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  if (!categoryId) {
    throw new ApiError(
      500,
      "The project category could not be retrieved."
    );
  }

  return getProjectCategoryById(categoryId.toString());
}

export async function listProjectCategories(
  options: ListProjectCategoriesQuery
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
    ProjectCategory.find(filter)
      .sort({
        [options.sortBy]: sortDirection,
        _id: 1
      })
      .skip(skip)
      .limit(options.limit)
      .lean(),

    ProjectCategory.countDocuments(filter)
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

export async function getProjectCategoryById(
  categoryId: string
) {
  const id = assertObjectId(
    categoryId,
    "project category ID"
  );

  const category = await ProjectCategory.findOne({
    _id: id,
    isDeleted: false
  }).lean();

  if (!category) {
    throw new ApiError(
      404,
      "Project category not found."
    );
  }

  const projectCount = await Project.countDocuments({
    categoryId: id,
    isDeleted: false
  });

  return {
    ...category,
    projectCount
  };
}

export async function getPublicProjectCategories() {
  const categories = await ProjectCategory.find({
    isActive: true,
    isDeleted: false
  })
    .select("_id name slug description sortOrder")
    .sort({
      sortOrder: 1,
      name: 1
    })
    .lean();

  return {
    categories
  };
}

export async function updateProjectCategory(
  options: UpdateProjectCategoryOptions
) {
  const categoryId = assertObjectId(
    options.categoryId,
    "project category ID"
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
        sortOrder: category.sortOrder
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
            action: "project_category.updated",
            resourceType: "project_category",
            resourceId: categoryId,
            description: `Project category "${category.name}" was updated.`,
            changes: {
              before,
              after: {
                name: category.name,
                slug: category.slug,
                description: category.description,
                sortOrder: category.sortOrder
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
        "A project category with this slug already exists."
      );
    }

    throw error;
  } finally {
    await session.endSession();
  }

  return getProjectCategoryById(options.categoryId);
}

export async function updateProjectCategoryStatus(
  options: UpdateProjectCategoryStatusOptions
) {
  const categoryId = assertObjectId(
    options.categoryId,
    "project category ID"
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
          `The project category is already ${options.input.isActive ? "active" : "inactive"}.`
        );
      }

      const previousStatus = category.isActive;

      category.isActive = options.input.isActive;

      await category.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "project_category.status_updated",
            resourceType: "project_category",
            resourceId: categoryId,
            description: `Project category "${category.name}" was ${category.isActive ? "activated" : "deactivated"}.`,
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

  return getProjectCategoryById(options.categoryId);
}

export async function deleteProjectCategory(
  options: DeleteProjectCategoryOptions
) {
  const categoryId = assertObjectId(
    options.categoryId,
    "project category ID"
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

      const assignedProjectExists = await Project.exists({
        categoryId
      }).session(session);

      if (assignedProjectExists) {
        throw new ApiError(
          409,
          "This category cannot be deleted because projects are assigned to it. Reassign those projects before deleting the category."
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
            action: "project_category.deleted",
            resourceType: "project_category",
            resourceId: categoryId,
            description: `Project category "${category.name}" was soft-deleted.`,
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
