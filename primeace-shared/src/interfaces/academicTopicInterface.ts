import type { ID, ISODateString } from "../types/commonType.js";
import type { AcademicLevel } from "../types/academic.type.js";

export interface IAcademicTopic {
  id: ID;

  institutionId: ID | null;
  facultyId: ID | null;
  departmentId: ID | null;

  title: string;
  description: string | null;
  academicLevels: AcademicLevel[];

  isActive: boolean;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}