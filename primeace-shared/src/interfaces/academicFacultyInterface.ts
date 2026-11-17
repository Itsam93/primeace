import type { ID, ISODateString } from "../types/commonType.js";

export interface IAcademicFaculty {
  id: ID;
  institutionId: ID;
  name: string;
  slug: string;
  isActive: boolean;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}