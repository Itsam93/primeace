import type { ID, ISODateString } from "../types/commonType.js";
import type { ReviewStatus } from "../enums/reviewStatusEnum.js";

export type ReviewDisplayPreference =
  | "full_name"
  | "first_name"
  | "anonymous";

export type ReviewSubmissionMethod =
  | "client"
  | "admin";

export interface IReview {
  id: ID;
  projectId: ID;
  clientId: ID;

  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;

  displayPreference: ReviewDisplayPreference;
  displayName: string | null;
  consentToPublish: boolean;

  submissionMethod: ReviewSubmissionMethod;
  submittedBy: ID | null;

  status: ReviewStatus;
  isFeatured: boolean;

  submittedAt: ISODateString;
  moderatedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface IPublicReview {
  id: ID;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  displayName: string;
  createdAt: ISODateString;
}
