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

import type {
  CreateHistoricalProjectInput,
  ListProjectsQuery,
  UpdateProjectStatusInput
} from "./project.validation.js";

import type {
  ProjectDetail,
  ProjectListItem,
  ProjectListResponse
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

type ProjectWithId = ProjectRecord & {
  _id: Types.ObjectId;
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

function mapProjectListItem(
  project: ProjectWithId
): ProjectListItem {
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
    contractAmountKobo: project.contractAmountKobo,
    status: project.status,
    startDate: project.startDate?.toISOString() ?? null,
    expectedCompletionDate:
      project.expectedCompletionDate?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}

function mapProjectDetail(
  project: ProjectWithId
): ProjectDetail {
  return {
    ...mapProjectListItem(project),
    clientId: project.clientId.toString(),
    serviceRequestId: project.serviceRequestId?.toString() ?? null,
    quotationId: project.quotationId?.toString() ?? null,
    contractId: project.contractId?.toString() ?? null,
    description: project.description,
    completedAt: project.completedAt?.toISOString() ?? null
  };
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

  if (
    quotation.clientId.toString() !== contract.clientId.toString()
  ) {
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

/**
 * Creates a historical project manually.
 *
 * Historical projects do not require a service request,
 * quotation or contract.
 *
 * The project and its audit record are committed together
 * in a MongoDB transaction.
 */
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

  const clientId = validateObjectId(
    input.clientId,
    "client ID"
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
        completedAt: new Date(input.completedAt)
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
                clientSnapshot,
                serviceNames: input.serviceNames,
                title: input.title,
                description: input.description,
                contractAmountKobo: input.contractAmountKobo,
                status: input.status,
                startDate: input.startDate,
                expectedCompletionDate: input.expectedCompletionDate,
                completedAt: input.completedAt
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

      createdProject = mapProjectDetail(
        project as unknown as ProjectWithId
      );
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

/**
 * Creates a project for the first accepted contract version,
 * or updates the existing project when a subsequent revision
 * is accepted.
 *
 * This function must be called within an existing MongoDB
 * transaction. It does not create, commit or end a session.
 */
export async function createOrUpdateProjectFromAcceptedContract(
  contractId: Types.ObjectId,
  session: ClientSession,
  context: ProjectAuditContext = {}
) {
  const contract = await validateAcceptedContract(
    contractId,
    session
  );

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
      serviceRequestId: serviceRequest._id,
      quotationId: quotation._id,
      contractId: contract._id,
      serviceNames,
      title: contract.title,
      description: contract.scope,
      contractAmountKobo: contract.contractAmountKobo,
      status: ProjectStatus.NOT_STARTED,
      startDate: contract.startDate ?? null,
      expectedCompletionDate:
        contract.expectedCompletionDate ?? null
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

/**
 * Retrieve a project by its database ID.
 */
export async function getProjectById(
  projectId: string
): Promise<ProjectDetail> {
  const id = validateObjectId(
    projectId,
    "project ID"
  );

  const project = await Project.findOne({
    _id: id,
    isDeleted: false
  });

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  return mapProjectDetail(
    project as unknown as ProjectWithId
  );
}

/**
 * Update a project's status.
 *
 * A completed project receives a completion timestamp.
 * Moving it away from COMPLETED clears that timestamp.
 *
 * The project update and audit record are committed
 * together in a MongoDB transaction.
 */
export async function updateProjectStatus(
  projectId: string,
  input: UpdateProjectStatusInput,
  context: ProjectAuditContext = {}
): Promise<ProjectDetail> {
  const id = validateObjectId(
    projectId,
    "project ID"
  );

  const newStatus = input.status;

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

      const previousStatus = project.status;

      if (previousStatus === newStatus) {
        updatedProject = mapProjectDetail(
          project as unknown as ProjectWithId
        );

        return;
      }

      project.status = newStatus;

      if (newStatus === ProjectStatus.COMPLETED) {
        project.completedAt = new Date();
      } else if (previousStatus === ProjectStatus.COMPLETED) {
        project.completedAt = null;
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

      updatedProject = mapProjectDetail(
        project as unknown as ProjectWithId
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

/**
 * Retrieve projects with pagination, search, filtering and sorting.
 *
 * Search fields:
 * - Project reference
 * - Project title
 * - Client name
 *
 * Date filtering applies to project creation dates.
 */
export async function getProjects(
  query: ListProjectsQuery
): Promise<ProjectListResponse> {
  const {
    page,
    limit,
    search,
    source,
    status,
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

  if (clientId) {
    filter.clientId = validateObjectId(
      clientId,
      "client ID"
    );
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
    const searchPattern = new RegExp(
      escapeRegExp(search),
      "i"
    );

    filter.$or = [
      { projectReference: searchPattern },
      { title: searchPattern },
      { "clientSnapshot.fullName": searchPattern }
    ];
  }

  const skip = (page - 1) * limit;

  const sortDirection: 1 | -1 =
    sortOrder === "asc" ? 1 : -1;

  const sortOptions: Record<string, 1 | -1> = {
    [sortBy]: sortDirection
  };

  const [
    projects,
    total
  ] = await Promise.all([
    Project.find(filter)
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
        project as unknown as ProjectWithId
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
