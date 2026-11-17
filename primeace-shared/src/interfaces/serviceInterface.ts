import type { ID, ISODateString } from "../types/commonType.js";

export interface IService {
  id: ID;
  categoryId: ID;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  deliverables: string[];
  isActive: boolean;
  displayOrder: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
