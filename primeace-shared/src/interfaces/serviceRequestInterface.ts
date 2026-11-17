import type { ID, ISODateString } from "../types/commonType.js";
import type { RequestStatus } from "../enums/requestStatusEnum.js";
import type { IServiceRequestItem } from "./serviceRequestItemInterface.js";
import type { IClientSummary } from "./clientInterface.js";

export interface IServiceRequest {
  id: ID;
  reference: string;

  clientId: ID;
  client: IClientSummary;

  items: IServiceRequestItem[];

  status: RequestStatus;

  submittedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
