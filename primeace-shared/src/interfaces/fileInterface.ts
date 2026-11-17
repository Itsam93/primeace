import type { ID, ISODateString } from "../types/commonType.js";

export type FilePurpose =
  | "service_request"
  | "project_deliverable"
  | "contract"
  | "accepted_contract"
  | "academic_reference"
  | "other";

export interface IFile {
  id: ID;

  originalName: string;
  mimeType: string;
  sizeBytes: number;
  format: string;

  purpose: FilePurpose;

  clientId: ID | null;
  serviceRequestId: ID | null;
  projectId: ID | null;

  uploadedAt: ISODateString;
}