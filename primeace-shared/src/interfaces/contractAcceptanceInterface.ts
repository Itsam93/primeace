import type { ID, ISODateString } from "../types/commonType.js";

export interface IContractAcceptance {
  id: ID;
  contractId: ID;
  contractVersion: number;

  acceptedBy: string;
  acceptedAt: ISODateString;

  agreementConfirmed: boolean;

  acceptedDocumentFileId: ID | null;
}
