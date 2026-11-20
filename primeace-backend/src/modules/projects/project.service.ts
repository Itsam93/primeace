import { startSession, Types } from "mongoose";
import type { ClientSession } from "mongoose";

import {
  ContractStatus,
  ProjectSource,
  ProjectStatus
} from "@primeace/shared";

import { ApiError } from "../../shared/errors/ApiError.js";
import { generateProjectReference } from "../../utils/generateProjectReference.js";

import { AuditLog } from "../audit/Auditlog.js";
import { Client } from "../clients/Client.js";
import { Contract } from "../contracts/Contract.js";
import { ContractAcceptance } from "../contracts/ContractAcceptance.js";
import { Quotation } from "../quotations/Quotation.js";
import { ServiceRequest } from "../service-requests/ServiceRequest.js";

import { Project } from "./Project.js";
import type { ProjectRecord } from "./Project.js";
import { ProjectCategory } from "./ProjectCategory.js";

import type {
  CreateHistoricalProjectInput,
  ListProjectsQuery,
  UpdateProjectFeaturedInput,
  UpdateProjectInput,
  UpdateProjectStatusInput
} from "./project.validation.js";

import type {
  ProjectDetail,
  ProjectListItem,
  ProjectListResponse,
  PublicProject,
  PublicProjectListResponse
} from "./project.types.js";

interface ProjectAuditContext {
  actorId?: Types.ObjectId | null;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}

interface ProjectListFilter {
  isDeleted: false;
  source?: ProjectSource;
  status?: ProjectStatus;
  categoryId?: Types.ObjectId;
  clientId?: Types.ObjectId;
  serviceRequestId?: Types.ObjectId;
  quotationId?: Types.ObjectId;
  contractId?: Types.ObjectId;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  $or?: Array<
    | { projectReference: RegExp }
    | { title: RegExp }
    | { "clientSnapshot.fullName": RegExp }
  >;
}

interface ProjectCategorySummaryRecord {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

interface ProjectVideoClipRecord {
  url: string;
  publicId: string;
  thumbnailUrl: string;
  alt: string;
}

type ProjectWithId = ProjectRecord & {
  _id: Types.ObjectId;
};

type ProjectWithPopulatedCategory = Omit<
  ProjectWithId,
  "categoryId" | "videoClip"
> & {
  categoryId:
    | Types.ObjectId
    | ProjectCategorySummaryRecord
    | null;
  videoClip?: ProjectVideoClipRecord | null;
};

function validateObjectId(
  value: string,
  field: string
): Types.ObjectId {
  if (!/^[a-f\d]{24}$/i.test(value)) {
    throw new ApiError(400, `Invalid ${field}.`);
  }

  return new Types.ObjectId(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapProjectCategory(
  categoryId: ProjectWithPopulatedCategory["categoryId"]
) {
  if (!categoryId || categoryId instanceof Types.ObjectId) {
    return null;
  }

  return {
    id: categoryId._id.toString(),
    name: categoryId.name,
    slug: categoryId.slug
  };
}

function mapProjectVideoClip(
  videoClip: ProjectVideoClipRecord | null | undefined
) {
  if (!videoClip?.url) {
    return null;
  }

  return {
    url: videoClip.url,
    thumbnailUrl: videoClip.thumbnailUrl,
    alt: videoClip.alt
  };
}

function mapProjectListItem(
  project: ProjectWithPopulatedCategory
): ProjectListItem {
  const coverImage = project.coverImage?.url
    ? {
        url: project.coverImage.url,
        alt: project.coverImage.alt || project.title
      }
    : null;

  return {
    id: project._id.toString(),
    projectReference: project.projectReference,
    source: project.source ?? ProjectSource.CONTRACT,
    clientSnapshot: {
      fullName: project.clientSnapshot.fullName,
      email: project.clientSnapshot.email,
      phone: project.clientSnapshot.phone
    },
    serviceNames: project.serviceNames,
    title: project.title,
    description: project.description,
    categoryId:
      project.categoryId instanceof Types.ObjectId
        ? project.categoryId.toString()
        : project.categoryId?._id.toString() ?? null,
    category: mapProjectCategory(project.categoryId),
    contractAmountKobo: project.contractAmountKobo,
    status: project.status,
    startDate: project.startDate?.toISOString() ?? null,
    expectedCompletionDate:
      project.expectedCompletionDate?.toISOString() ?? null,
    completedAt: project.completedAt?.toISOString() ?? null,
    coverImage,
    videoClip: mapProjectVideoClip(project.videoClip),
    isFeatured: project.isFeatured ?? false,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

function mapProjectDetail(
  project: ProjectWithPopulatedCategory
): ProjectDetail {
  return {
    ...mapProjectListItem(project),
    clientId: project.clientId.toString(),
    serviceRequestId: project.serviceRequestId?.toString() ?? null,
    quotationId: project.quotationId?.toString() ?? null,
    contractId: project.contractId?.toString() ?? null
  };
}

/**
 * Map a project to the public response format.
 *
 * Excludes client information, financial details,
 * internal references and administrative fields.
 */
function mapPublicProject(
  project: ProjectWithPopulatedCategory
): PublicProject {
  return {
    id: project._id.toString(),
    title: project.title,
    description: project.description,
    serviceNames: project.serviceNames,
    source: project.source ?? ProjectSource.CONTRACT,
    category: mapProjectCategory(project.categoryId),
    completedAt: project.completedAt?.toISOString() ?? null,
    coverImage: project.coverImage?.url
      ? {
          url: project.coverImage.url,
          alt: project.coverImage.alt || project.title
        }
      : null,
    videoClip: mapProjectVideoClip(project.videoClip)
  };
}

async function getActiveProjectCategory(
  categoryId: Types.ObjectId,
  session?: ClientSession
) {
  let query = ProjectCategory.findOne({
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
      404,
      "The selected project category does not exist or is inactive."
    );
  }

  return category;
}

async function validateAcceptedContract(
  contractId: Types.ObjectId,
  session: ClientSession
) {
  const contract = await Contract.findById(contractId).session(session);

  if (!contract) {
    throw new ApiError(404, "Contract not found.");
  }

  if (contract.status !== ContractStatus.ACCEPTED) {
    throw new ApiError(
      409,
      "Only accepted contracts can generate or update projects."
    );
  }

  const newerVersion = await Contract.exists({
    contractNumber: contract.contractNumber,
    version: { $gt: contract.version }
  }).session(session);

  if (newerVersion) {
    throw new ApiError(
      409,
      "Only the latest contract version can be used to update a project."
    );
  }

  const acceptance = await ContractAcceptance.findOne({
    contractId: contract._id,
    contractVersion: contract.version,
    agreementConfirmed: true
  }).session(session);

  if (!acceptance) {
    throw new ApiError(
      409,
      "Valid contract acceptance evidence was not found."
    );
  }

  return contract;
}

async function getContractRelatedRecords(
  contract: Awaited<ReturnType<typeof validateAcceptedContract>>,
  session: ClientSession
) {
  const quotation = await Quotation.findById(contract.quotationId)
    .session(session);

  if (!quotation) {
    throw new ApiError(404, "Associated quotation not found.");
  }

  if (quotation.clientId.toString() !== contract.clientId.toString()) {
    throw new ApiError(
      409,
      "Contract and quotation client references do not match."
    );
  }

  const serviceRequest = await ServiceRequest.findById(
    quotation.serviceRequestId
  ).session(session);

  if (!serviceRequest) {
    throw new ApiError(404, "Associated service request not found.");
  }

  if (
    serviceRequest.clientId.toString() !== contract.clientId.toString() ||
    serviceRequest.clientId.toString() !== quotation.clientId.toString()
  ) {
    throw new ApiError(
      409,
      "Contract, quotation and service request client references do not match."
    );
  }

  return {
    quotation,
    serviceRequest
  };
}

async function writeProjectAuditLog(
  projectId: Types.ObjectId,
  contractId: Types.ObjectId,
  contractVersion: number,
  quotationId: Types.ObjectId,
  serviceRequestId: Types.ObjectId,
  action: "project.created" | "project.updated_from_contract_revision",
  description: string,
  session: ClientSession,
  context: ProjectAuditContext
): Promise<void> {
  await AuditLog.create(
    [
      {
        actorId: context.actorId ?? null,
        action,
        resourceType: "project",
        resourceId: projectId,
        description,
        metadata: {
          contractId: contractId.toString(),
          contractVersion,
          quotationId: quotationId.toString(),
          serviceRequestId: serviceRequestId.toString()
        },
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null
      }
    ],
    { session }
  );
}

export async function createHistoricalProject(
  input: CreateHistoricalProjectInput,
  context: ProjectAuditContext
): Promise<ProjectDetail> {
  if (!context.actorId) {
    throw new ApiError(
      401,
      "Administrator authentication is required."
    );
  }

  const clientId = validateObjectId(input.clientId, "client ID");
  const categoryId = validateObjectId(
    input.categoryId,
    "project category ID"
  );

  const adminId = context.actorId;
  const session = await startSession();

  try {
    let createdProject: ProjectDetail | null = null;

    await session.withTransaction(async () => {
      const client = await Client.findOne({
        _id: clientId,
        isDeleted: false
      }).session(session);

      if (!client) {
        throw new ApiError(
          404,
          "The selected client does not exist."
        );
      }

      const category = await getActiveProjectCategory(
        categoryId,
        session
      );

      const clientSnapshot = {
        fullName: client.fullName,
        email: client.email ?? null,
        phone: client.phone
      };

      const project = new Project({
        projectReference: generateProjectReference(),
        source: ProjectSource.HISTORICAL,
        clientId: client._id,
        clientSnapshot,
        categoryId: category._id,
        serviceRequestId: null,
        quotationId: null,
        contractId: null,
        serviceNames: input.serviceNames,
        title: input.title,
        description: input.description,
        contractAmountKobo: input.contractAmountKobo,
        status: input.status,
        startDate: input.startDate
          ? new Date(input.startDate)
          : null,
        expectedCompletionDate: input.expectedCompletionDate
          ? new Date(input.expectedCompletionDate)
          : null,
        completedAt: new Date(input.completedAt),
        isFeatured: false
      });

      await project.save({ session });

      await AuditLog.create(
        [
          {
            actorId: adminId,
            action: "project.historical_created",
            resourceType: "project",
            resourceId: project._id,
            description:
              `Historical project "${project.title}" was created.`,
            changes: {
              after: {
                projectReference: project.projectReference,
                source: ProjectSource.HISTORICAL,
                clientId: client._id.toString(),
                categoryId: category._id.toString(),
                categoryName: category.name,
                clientSnapshot,
                serviceNames: input.serviceNames,
                title: input.title,
                description: input.description,
                contractAmountKobo: input.contractAmountKobo,
                status: input.status,
                startDate: input.startDate,
                expectedCompletionDate: input.expectedCompletionDate,
                completedAt: input.completedAt,
                isFeatured: false
              }
            },
            metadata: {
              source: ProjectSource.HISTORICAL
            },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        ],
        { session }
      );

      createdProject = mapProjectDetail({
        ...project.toObject(),
        _id: project._id,
        categoryId: category.toObject()
      } as ProjectWithPopulatedCategory);
    });

    if (!createdProject) {
      throw new ApiError(
        500,
        "The historical project could not be created."
      );
    }

    return createdProject;
  } finally {
    await session.endSession();
  }
}

export async function createOrUpdateProjectFromAcceptedContract(
  contractId: Types.ObjectId,
  session: ClientSession,
  context: ProjectAuditContext = {}
) {
  const contract = await validateAcceptedContract(contractId, session);

  const {
    quotation,
    serviceRequest
  } = await getContractRelatedRecords(contract, session);

  const serviceNames = serviceRequest.items.map(
    (item) => item.serviceName
  );

  const sourceSnapshot =
    contract.clientSnapshot ?? serviceRequest.clientSnapshot;

  if (!sourceSnapshot) {
    throw new ApiError(
      409,
      "A client snapshot is required to create or update the project."
    );
  }

  const clientSnapshot = {
    fullName: sourceSnapshot.fullName,
    email: sourceSnapshot.email ?? null,
    phone: sourceSnapshot.phone
  };

  let project = contract.projectId
    ? await Project.findById(contract.projectId).session(session)
    : await Project.findOne({
        contractId: contract._id
      }).session(session);

  const isNewProject = !project;

  if (!project) {
    project = new Project({
      projectReference: generateProjectReference(),
      source: ProjectSource.CONTRACT,
      clientId: contract.clientId,
      clientSnapshot,
      categoryId: null,
      serviceRequestId: serviceRequest._id,
      quotationId: quotation._id,
      contractId: contract._id,
      serviceNames,
      title: contract.title,
      description: contract.scope,
      contractAmountKobo: contract.contractAmountKobo,
      status: ProjectStatus.NOT_STARTED,
      startDate: contract.startDate ?? null,
      expectedCompletionDate: contract.expectedCompletionDate ?? null,
      isFeatured: false
    });
  } else {
    if (
      project.clientId.toString() !== contract.clientId.toString() ||
      project.quotationId?.toString() !== quotation._id.toString() ||
      project.serviceRequestId?.toString() !== serviceRequest._id.toString()
    ) {
      throw new ApiError(
        409,
        "The existing project references do not match the accepted contract."
      );
    }

    project.source = ProjectSource.CONTRACT;
    project.contractId = contract._id;
    project.clientSnapshot = clientSnapshot;
    project.serviceNames = serviceNames;
    project.title = contract.title;
    project.description = contract.scope;
    project.contractAmountKobo = contract.contractAmountKobo;
    project.startDate = contract.startDate ?? null;
    project.expectedCompletionDate =
      contract.expectedCompletionDate ?? null;
  }

  await project.save({ session });

  if (!contract.projectId) {
    contract.projectId = project._id;
    await contract.save({ session });
  }

  await writeProjectAuditLog(
    project._id,
    contract._id,
    contract.version,
    quotation._id,
    serviceRequest._id,
    isNewProject
      ? "project.created"
      : "project.updated_from_contract_revision",
    isNewProject
      ? "Project created automatically following contract acceptance."
      : "Project updated following acceptance of a contract revision.",
    session,
    context
  );

  return project;
}

export async function getProjectById(
  projectId: string
): Promise<ProjectDetail> {
  const id = validateObjectId(projectId, "project ID");

  const project = await Project.findOne({
    _id: id,
    isDeleted: false
  }).populate({
    path: "categoryId",
    select: "name slug"
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  return mapProjectDetail(
    project.toObject() as ProjectWithPopulatedCategory
  );
}

/**
 * Update editable information on an existing project.
 *
 * Works for both historical and contract-generated projects.
 * Existing media and contract-related references are preserved.
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput,
  context: ProjectAuditContext = {}
): Promise<ProjectDetail> {
  const id = validateObjectId(projectId, "project ID");
  const session = await startSession();

  try {
    let updatedProject: ProjectDetail | null = null;

    await session.withTransaction(async () => {
      const project = await Project.findOne({
        _id: id,
        isDeleted: false
      }).session(session);

      if (!project) {
        throw new ApiError(404, "Project not found.");
      }

      const previousValues = {
        title: project.title,
        description: project.description,
        categoryId: project.categoryId?.toString() ?? null,
        serviceNames: [...project.serviceNames],
        contractAmountKobo: project.contractAmountKobo,
        startDate: project.startDate?.toISOString() ?? null,
        expectedCompletionDate:
          project.expectedCompletionDate?.toISOString() ?? null
      };

      if (input.title !== undefined) {
        project.title = input.title;
      }

      if (input.description !== undefined) {
        project.description = input.description;
      }

      if (input.categoryId !== undefined) {
        const categoryId = validateObjectId(
          input.categoryId,
          "project category ID"
        );

        const category = await getActiveProjectCategory(
          categoryId,
          session
        );

        project.categoryId = category._id;
      }

      if (input.serviceNames !== undefined) {
        project.serviceNames = input.serviceNames;
      }

      if (input.contractAmountKobo !== undefined) {
        project.contractAmountKobo = input.contractAmountKobo;
      }

      if (input.startDate !== undefined) {
        project.startDate = input.startDate
          ? new Date(input.startDate)
          : null;
      }

      if (input.expectedCompletionDate !== undefined) {
        project.expectedCompletionDate =
          input.expectedCompletionDate
            ? new Date(input.expectedCompletionDate)
            : null;
      }

      if (
        project.startDate &&
        project.expectedCompletionDate &&
        project.expectedCompletionDate < project.startDate
      ) {
        throw new ApiError(
          400,
          "The expected completion date cannot be earlier than the start date."
        );
      }

      await project.save({ session });

      const currentValues = {
        title: project.title,
        description: project.description,
        categoryId: project.categoryId?.toString() ?? null,
        serviceNames: [...project.serviceNames],
        contractAmountKobo: project.contractAmountKobo,
        startDate: project.startDate?.toISOString() ?? null,
        expectedCompletionDate:
          project.expectedCompletionDate?.toISOString() ?? null
      };

      const changes: Record<
        string,
        { from: unknown; to: unknown }
      > = {};

      for (const key of Object.keys(previousValues) as Array<
        keyof typeof previousValues
      >) {
        const previous = previousValues[key];
        const current = currentValues[key];

        const hasChanged =
          Array.isArray(previous) && Array.isArray(current)
            ? JSON.stringify(previous) !== JSON.stringify(current)
            : previous !== current;

        if (hasChanged) {
          changes[key] = {
            from: previous,
            to: current
          };
        }
      }

      if (Object.keys(changes).length > 0) {
        await AuditLog.create(
          [
            {
              actorId: context.actorId ?? null,
              action: "project.updated",
              resourceType: "project",
              resourceId: project._id,
              description:
                `Project "${project.title}" was updated.`,
              changes,
              metadata: {
                projectReference: project.projectReference,
                source: project.source
              },
              ipAddress: context.ipAddress ?? null,
              userAgent: context.userAgent ?? null
            }
          ],
          { session }
        );
      }

      const populatedProject = await Project.findOne({
        _id: project._id,
        isDeleted: false
      })
        .populate({
          path: "categoryId",
          select: "name slug"
        })
        .session(session);

      if (!populatedProject) {
        throw new ApiError(404, "Project not found.");
      }

      updatedProject = mapProjectDetail(
        populatedProject.toObject() as ProjectWithPopulatedCategory
      );
    });

    if (!updatedProject) {
      throw new ApiError(
        500,
        "The project update could not be completed."
      );
    }

    return updatedProject;
  } finally {
    await session.endSession();
  }
}

export async function updateProjectStatus(
  projectId: string,
  input: UpdateProjectStatusInput,
  context: ProjectAuditContext = {}
): Promise<ProjectDetail> {
  const id = validateObjectId(projectId, "project ID");
  const newStatus = input.status;
  const session = await startSession();

  try {
    let updatedProject: ProjectDetail | null = null;

    await session.withTransaction(async () => {
      const project = await Project.findOne({
        _id: id,
        isDeleted: false
      })
        .populate({
          path: "categoryId",
          select: "name slug"
        })
        .session(session);

      if (!project) {
        throw new ApiError(404, "Project not found.");
      }

      const previousStatus = project.status;
      const previousFeaturedStatus = project.isFeatured ?? false;

      if (previousStatus === newStatus) {
        updatedProject = mapProjectDetail(
          project.toObject() as ProjectWithPopulatedCategory
        );
        return;
      }

      project.status = newStatus;

      if (newStatus === ProjectStatus.COMPLETED) {
        project.completedAt = new Date();
      } else if (previousStatus === ProjectStatus.COMPLETED) {
        project.completedAt = null;
        project.isFeatured = false;
      }

      await project.save({ session });

      await AuditLog.create(
        [
          {
            actorId: context.actorId ?? null,
            action: "project.status_updated",
            resourceType: "project",
            resourceId: project._id,
            description:
              `Project status changed from ${previousStatus} to ${newStatus}.`,
            changes: {
              status: {
                from: previousStatus,
                to: newStatus
              },
              ...(previousFeaturedStatus !== (project.isFeatured ?? false)
                ? {
                    isFeatured: {
                      from: previousFeaturedStatus,
                      to: project.isFeatured ?? false
                    }
                  }
                : {})
            },
            metadata: {
              projectReference: project.projectReference
            },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        ],
        { session }
      );

      updatedProject = mapProjectDetail(
        project.toObject() as ProjectWithPopulatedCategory
      );
    });

    if (!updatedProject) {
      throw new ApiError(
        500,
        "The project status update could not be completed."
      );
    }

    return updatedProject;
  } finally {
    await session.endSession();
  }
}

export async function updateProjectFeatured(
  projectId: string,
  input: UpdateProjectFeaturedInput,
  context: ProjectAuditContext = {}
): Promise<ProjectDetail> {
  const id = validateObjectId(projectId, "project ID");
  const session = await startSession();

  try {
    let updatedProject: ProjectDetail | null = null;

    await session.withTransaction(async () => {
      const project = await Project.findOne({
        _id: id,
        isDeleted: false
      }).session(session);

      if (!project) {
        throw new ApiError(404, "Project not found.");
      }

      const previousFeaturedStatus = project.isFeatured ?? false;
      const newFeaturedStatus = input.isFeatured;

      if (
        newFeaturedStatus &&
        project.status !== ProjectStatus.COMPLETED
      ) {
        throw new ApiError(
          409,
          "Only completed projects can be featured."
        );
      }

      if (newFeaturedStatus) {
        if (!project.categoryId) {
          throw new ApiError(
            409,
            "Assign an active project category before featuring this project."
          );
        }

        await getActiveProjectCategory(project.categoryId, session);
      }

      if (previousFeaturedStatus === newFeaturedStatus) {
        const populatedProject = await Project.findById(project._id)
          .populate({
            path: "categoryId",
            select: "name slug"
          })
          .session(session);

        if (!populatedProject) {
          throw new ApiError(404, "Project not found.");
        }

        updatedProject = mapProjectDetail(
          populatedProject.toObject() as ProjectWithPopulatedCategory
        );
        return;
      }

      project.isFeatured = newFeaturedStatus;

      await project.save({ session });

      await AuditLog.create(
        [
          {
            actorId: context.actorId ?? null,
            action: "project.featured_status_updated",
            resourceType: "project",
            resourceId: project._id,
            description: newFeaturedStatus
              ? `Project "${project.title}" was added to the public showcase.`
              : `Project "${project.title}" was removed from the public showcase.`,
            changes: {
              isFeatured: {
                from: previousFeaturedStatus,
                to: newFeaturedStatus
              }
            },
            metadata: {
              projectReference: project.projectReference
            },
            ipAddress: context.ipAddress ?? null,
            userAgent: context.userAgent ?? null
          }
        ],
        { session }
      );

      const populatedProject = await Project.findById(project._id)
        .populate({
          path: "categoryId",
          select: "name slug"
        })
        .session(session);

      if (!populatedProject) {
        throw new ApiError(404, "Project not found.");
      }

      updatedProject = mapProjectDetail(
        populatedProject.toObject() as ProjectWithPopulatedCategory
      );
    });

    if (!updatedProject) {
      throw new ApiError(
        500,
        "The project featured status update could not be completed."
      );
    }

    return updatedProject;
  } finally {
    await session.endSession();
  }
}

export async function getProjects(
  query: ListProjectsQuery
): Promise<ProjectListResponse> {
  const {
    page,
    limit,
    search,
    source,
    status,
    categoryId,
    clientId,
    serviceRequestId,
    quotationId,
    contractId,
    from,
    to,
    sortBy,
    sortOrder
  } = query;

  const filter: ProjectListFilter = {
    isDeleted: false
  };

  if (source) {
    filter.source = source;
  }

  if (status) {
    filter.status = status;
  }

  if (categoryId) {
    filter.categoryId = validateObjectId(
      categoryId,
      "project category ID"
    );
  }

  if (clientId) {
    filter.clientId = validateObjectId(clientId, "client ID");
  }

  if (serviceRequestId) {
    filter.serviceRequestId = validateObjectId(
      serviceRequestId,
      "service request ID"
    );
  }

  if (quotationId) {
    filter.quotationId = validateObjectId(
      quotationId,
      "quotation ID"
    );
  }

  if (contractId) {
    filter.contractId = validateObjectId(
      contractId,
      "contract ID"
    );
  }

  if (from || to) {
    filter.createdAt = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {})
    };
  }

  if (search) {
    const searchPattern = new RegExp(escapeRegExp(search), "i");

    filter.$or = [
      { projectReference: searchPattern },
      { title: searchPattern },
      { "clientSnapshot.fullName": searchPattern }
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection: 1 | -1 = sortOrder === "asc" ? 1 : -1;

  const sortOptions: Record<string, 1 | -1> = {
    [sortBy]: sortDirection
  };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate({
        path: "categoryId",
        select: "name slug"
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),

    Project.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    projects: projects.map((project) =>
      mapProjectListItem(
        project as unknown as ProjectWithPopulatedCategory
      )
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  };
}

/**
 * Retrieve completed projects selected for the public showcase.
 *
 * Only completed, featured and non-deleted projects with an
 * active, non-deleted showcase category are returned.
 *
 * Private client information, financial details and
 * administrative fields are excluded from the response.
 */
export async function getFeaturedPublicProjects():
  Promise<PublicProjectListResponse> {
  const activeCategories = await ProjectCategory.find({
    isActive: true,
    isDeleted: false
  })
    .select("_id")
    .lean();

  const activeCategoryIds = activeCategories.map(
    (category) => category._id
  );

  if (activeCategoryIds.length === 0) {
    return {
      projects: []
    };
  }

  const projects = await Project.find({
    status: ProjectStatus.COMPLETED,
    isFeatured: true,
    isDeleted: false,
    categoryId: {
      $in: activeCategoryIds
    }
  })
    .populate({
      path: "categoryId",
      match: {
        isActive: true,
        isDeleted: false
      },
      select: "name slug"
    })
    .select(
      "_id title description serviceNames source completedAt coverImage videoClip categoryId"
    )
    .sort({
      completedAt: -1,
      createdAt: -1
    })
    .lean();

  const visibleProjects = projects.filter(
    (project) => Boolean(project.categoryId)
  );

  return {
    projects: visibleProjects.map((project) =>
      mapPublicProject(
        project as unknown as ProjectWithPopulatedCategory
      )
    )
  };
}