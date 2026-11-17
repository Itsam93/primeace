import type { ID, ISODateString } from "../types/commonType.js";
import type { IServiceFormField } from "../types/serviceForm.type.js";

export interface IServiceForm {
  id: ID;
  serviceId: ID;

  version: number;
  fields: IServiceFormField[];

  isActive: boolean;
  publishedAt: ISODateString | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}