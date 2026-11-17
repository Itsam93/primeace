import type {
  ID,
  ISODateString,
  MoneyKobo
} from "../types/commonType.js";

import type { ProjectStatus } from "../enums/projectStatusEnum.js";
import type { IClientSummary } from "./clientInterface.js";

export interface IProject {
  id: ID;
  projectReference: string;

  clientId: ID;
  client: IClientSummary;

  serviceRequestId: ID;
  quotationId: ID;
  contractId: ID;

  serviceNames: string[];

  title: string;
  description: string;

  contractAmountKobo: MoneyKobo;

  status: ProjectStatus;

  startDate: ISODateString | null;
  expectedCompletionDate: ISODateString | null;
  completedAt: ISODateString | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}
