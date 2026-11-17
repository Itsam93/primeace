import { Types } from "mongoose";

import type {
  IQuotation,
  IQuotationItem,
  IClientSummary
} from "@primeace/shared";

import type { QuotationDocument } from "./Quotation.js";

type QuotationWithIdentifiers = QuotationDocument & {
  _id: Types.ObjectId;
  items: Array<
    QuotationDocument["items"][number] & {
      _id: Types.ObjectId;
    }
  >;
};

function serializeId(
  value: Types.ObjectId | string | null | undefined
): string | null {
  return value == null ? null : value.toString();
}

function serializeQuotationItem(
  item: QuotationWithIdentifiers["items"][number]
): IQuotationItem {
  return {
    id: item._id.toString(),
    serviceRequestItemId: serializeId(
      item.serviceRequestItemId
    ),
    serviceName: item.serviceName,
    description: item.description,
    deliverables: item.deliverables,
    quantity: item.quantity,
    unitAmountKobo: item.unitAmountKobo,
    totalAmountKobo: item.totalAmountKobo
  };
}

export function serializeQuotation(
  quotation: QuotationWithIdentifiers,
  client: IClientSummary
): IQuotation {
  return {
    id: quotation._id.toString(),
    quotationNumber: quotation.quotationNumber,

    clientId: quotation.clientId.toString(),
    client,

    serviceRequestId: quotation.serviceRequestId.toString(),
    serviceRequestReference:
      quotation.serviceRequestReference,

    version: quotation.version,
    previousVersionId: serializeId(
      quotation.previousVersionId
    ),

    items: quotation.items.map(serializeQuotationItem),

    subtotalKobo: quotation.subtotalKobo,
    discountKobo: quotation.discountKobo,
    totalAmountKobo: quotation.totalAmountKobo,

    scope: quotation.scope,
    terms: quotation.terms,

    validUntil: quotation.validUntil.toISOString(),

    status: quotation.status,

    issuedAt: quotation.issuedAt?.toISOString() ?? null,
    respondedAt: quotation.respondedAt?.toISOString() ?? null,

    createdAt: quotation.createdAt.toISOString(),
    updatedAt: quotation.updatedAt.toISOString()
  };
}
