import type { ID, ISODateString } from "../types/commonType.js";

export interface IProjectUpdate {
  id: ID;
  projectId: ID;

  title: string;
  message: string;

  isClientVisible: boolean;
  sentToClientAt: ISODateString | null;

  createdBy: ID;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}