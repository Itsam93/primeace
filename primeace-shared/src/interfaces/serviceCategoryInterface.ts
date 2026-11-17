import type { ID, ISODateString } from "../types/commonType.js";

export interface IServiceCategory {
  id: ID;
  name: string;
  slug: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
