import type { ID, ISODateString } from "../types/commonType.js";

export interface IAcademicDepartment {
  id: ID;
  facultyId: ID;
  name: string;
  slug: string;
  isActive: boolean;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}