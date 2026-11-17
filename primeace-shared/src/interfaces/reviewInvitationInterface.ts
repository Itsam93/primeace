import type { ID, ISODateString } from "../types/commonType.js";
import type { ReviewInvitationStatus } from "../enums/reviewInvitationStatusEnum.js";

export interface IReviewInvitation {
  id: ID;
  projectId: ID;
  clientId: ID;

  reviewId: ID | null;

  status: ReviewInvitationStatus;

  sentAt: ISODateString;
  expiresAt: ISODateString;
  submittedAt: ISODateString | null;

  createdAt: ISODateString;
  updatedAt: ISODateString;
}