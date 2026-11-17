import type { ID, ISODateString } from "../types/commonType.js";

export interface IServiceRequestItem {
  id: ID;
  serviceId: ID;
  serviceName: string;
  categoryId: ID;
  categoryName: string;

  formVersion: number;
  answers: Record<string, unknown>;

  fileIds: ID[];

  createdAt: ISODateString;
  updatedAt: ISODateString;
}
