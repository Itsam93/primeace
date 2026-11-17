import { Types } from "mongoose";

import { ApiError } from "../../shared/errors/ApiError.js";

import { Client } from "./Client.js";
import {
  normalizeEmail,
  normalizePhone
} from "../../utils/client.utils.js";

import { ServiceRequest } from "../service-requests/ServiceRequest.js";
import { Quotation } from "../quotations/Quotation.js";
import { Contract } from "../contracts/Contract.js";
import { Project } from "../projects/Project.js";

export interface ListClientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "fullName" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateClientInput {
  fullName: string;
  email?: string;
  phone: string;
  organisation?: string;
}

function assertObjectId(
  value: string,
  field: string
): void {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(
      400,
      `Invalid ${field}.`
    );
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createClient(
  input: CreateClientInput
) {
  const fullName = input.fullName.trim();
  const email = normalizeEmail(input.email);
  const phone = input.phone.trim();
  const normalizedPhone = normalizePhone(phone);
  const organisation = input.organisation?.trim() || null;

  if (normalizedPhone.length < 7) {
    throw new ApiError(
      400,
      "A valid phone number is required."
    );
  }

  if (!/^\+?\d+$/.test(normalizedPhone)) {
    throw new ApiError(
      400,
      "Invalid phone number format."
    );
  }

  // Match the existing client identity.
  // When an email is supplied, both normalized values are checked.
  // When email is omitted, phone is used.
  const existingClient = await Client.findOne({
    normalizedPhone,
    normalizedEmail: email,
    isDeleted: false
  })
    .select("_id")
    .lean();

  if (existingClient) {
    throw new ApiError(
      409,
      "A client with these contact details already exists."
    );
  }

  try {
    const [client] = await Client.create([
      {
        fullName,
        email,
        normalizedEmail: email,
        phone,
        normalizedPhone,
        organisation
      }
    ]);

    return client;
  } catch (error) {
    // The unique email index protects against concurrent
    // requests attempting to create the same email address.
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new ApiError(
        409,
        "A client with this email address already exists."
      );
    }

    throw error;
  }
}

export async function listClients(
  query: ListClientsQuery
) {
  const page = Math.max(
    1,
    Math.floor(query.page ?? 1)
  );

  const limit = Math.min(
    100,
    Math.max(
      1,
      Math.floor(query.limit ?? 20)
    )
  );

  const search = query.search?.trim();

  const sortBy = query.sortBy ?? "createdAt";
  const sortOrder = query.sortOrder ?? "desc";

  const filter: Record<string, unknown> = {
    isDeleted: false
  };

  if (search) {
    const searchRegex = new RegExp(
      escapeRegex(search),
      "i"
    );

    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { organisation: searchRegex }
    ];
  }

  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const [clients, total] = await Promise.all([
    Client.find(filter)
      .select(
        "fullName email phone organisation createdAt updatedAt"
      )
      .sort({
        [sortBy]: sortDirection,
        _id: -1
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),

    Client.countDocuments(filter)
  ]);

  return {
    clients,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1
    }
  };
}

export async function getClientById(
  clientId: string
) {
  assertObjectId(clientId, "client ID");

  const client = await Client.findOne({
    _id: clientId,
    isDeleted: false
  })
    .select(
      "fullName email phone organisation createdAt updatedAt"
    )
    .lean();

  if (!client) {
    throw new ApiError(
      404,
      "Client not found."
    );
  }

  const [
    serviceRequests,
    quotations,
    contracts,
    projects
  ] = await Promise.all([
    ServiceRequest.find({
      clientId,
      isDeleted: false
    })
      .select(
        "reference items.serviceName items.categoryName status submittedAt createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean(),

    Quotation.find({
      clientId
    })
      .select(
        "quotationNumber serviceRequestId serviceRequestReference version previousVersionId items subtotalKobo discountKobo totalAmountKobo scope terms validUntil status issuedAt respondedAt createdAt updatedAt"
      )
      .sort({
        quotationNumber: 1,
        version: -1,
        createdAt: -1
      })
      .lean(),

    Contract.find({
      clientId
    })
      .select(
        "contractNumber quotationId quotationNumber serviceRequestId projectId version previousVersionId title scope items deliverables contractAmountKobo terms startDate expectedCompletionDate status issuedAt acceptanceDeadline createdAt updatedAt"
      )
      .sort({
        contractNumber: 1,
        version: -1,
        createdAt: -1
      })
      .lean(),

    Project.find({
      clientId,
      isDeleted: false
    })
      .select(
        "projectReference serviceNames title description contractAmountKobo status startDate expectedCompletionDate completedAt serviceRequestId quotationId contractId createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .lean()
  ]);

  // Group quotation revisions under their quotation number.
  const quotationGroups = new Map<
    string,
    typeof quotations
  >();

  for (const quotation of quotations) {
    const group = quotationGroups.get(
      quotation.quotationNumber
    );

    if (group) {
      group.push(quotation);
    } else {
      quotationGroups.set(
        quotation.quotationNumber,
        [quotation]
      );
    }
  }

  const groupedQuotations = Array.from(
    quotationGroups,
    ([quotationNumber, revisions]) => ({
      quotationNumber,
      latestVersion: revisions[0] ?? null,
      revisions
    })
  );

  // Group contract revisions under their contract number.
  const contractGroups = new Map<
    string,
    typeof contracts
  >();

  for (const contract of contracts) {
    const group = contractGroups.get(
      contract.contractNumber
    );

    if (group) {
      group.push(contract);
    } else {
      contractGroups.set(
        contract.contractNumber,
        [contract]
      );
    }
  }

  const groupedContracts = Array.from(
    contractGroups,
    ([contractNumber, revisions]) => ({
      contractNumber,
      latestVersion: revisions[0] ?? null,
      revisions
    })
  );

  return {
    client,
    serviceRequests,
    quotations: groupedQuotations,
    contracts: groupedContracts,
    projects
  };
}
