import type {
  ID,
  ISODateString,
  MoneyKobo
} from "../types/commonType.js";

import type { ContractStatus } from "../enums/contractStatusEnum.js";
import type { IClientSummary } from "./clientInterface.js";

export interface IContract {
  id: ID;
  contractNumber: string;

  clientId: ID;
  client: IClientSummary;

  quotationId: ID;
  quotationNumber: string;

  projectId: ID | null;

  version: number;
  previousVersionId: ID | null;

  title: string;
  scope: string;
  deliverables: string[];

  contractAmountKobo: MoneyKobo;

  terms: string;
  startDate: ISODateString | null;
  expectedCompletionDate: ISODateString | null;

  status: ContractStatus;

  issuedAt: ISODateString | null;
  expiresAt: ISODateString | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}
