import type { ID, ISODateString } from "../types/commonType.js";

export interface IAcademicInstitution {
  id: ID;
  name: string;
  slug: string;
  isActive: boolean;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}