import type {
  ID,
  ISODateString,
  MoneyKobo
} from "../types/commonType.js";

import type { QuotationStatus } from "../enums/quotationStatusEnum.js";
import type { IClientSummary } from "./clientInterface.js";
import type { IQuotationItem } from "./quotationItemInterface.js";

export interface IQuotation {
  id: ID;
  quotationNumber: string;

  clientId: ID;
  client: IClientSummary;

  serviceRequestId: ID;
  serviceRequestReference: string;

  version: number;
  previousVersionId: ID | null;

  items: IQuotationItem[];

  subtotalKobo: MoneyKobo;
  discountKobo: MoneyKobo;
  totalAmountKobo: MoneyKobo;

  scope: string;
  terms: string[];

  validUntil: ISODateString;

  status: QuotationStatus;

  issuedAt: ISODateString | null;
  respondedAt: ISODateString | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}
