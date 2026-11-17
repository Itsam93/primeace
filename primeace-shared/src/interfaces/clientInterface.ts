import type { ID, ISODateString } from "../types/commonType.js";

export interface IClient {
  id: ID;
  fullName: string;
  email: string | null;
  phone: string;
  organisation?: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type IClientSummary = Pick<
  IClient,
  "id" | "fullName" | "email" | "phone"
>;
