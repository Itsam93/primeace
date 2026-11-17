export type ServiceRequestStatus =
  | "new"
  | "under_review"
  | "awaiting_information"
  | "quoted"
  | "converted"
  | "declined"
  | "closed";

export interface IServiceRequestClientSnapshot {
  fullName: string;
  email: string | null;
  phone: string;
  organisation?: string | null;
}

export interface IServiceRequestItemSummary {
  serviceId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
}

export interface IServiceRequestListItem {
  _id: string;
  reference: string;
  clientSnapshot: IServiceRequestClientSnapshot;
  items: IServiceRequestItemSummary[];
  status: ServiceRequestStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceRequestItemDetails
  extends IServiceRequestItemSummary {
  _id: string;
  formVersion: number;
  answers: Record<string, unknown>;
  fileIds: string[];
}

export interface IServiceRequestDetails {
  _id: string;
  reference: string;
  clientId: string;
  clientSnapshot: IServiceRequestClientSnapshot;
  items: IServiceRequestItemDetails[];
  status: ServiceRequestStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceRequestNoteAdmin {
  _id: string;
  fullName: string;
  email: string;
}

export interface IServiceRequestNote {
  _id: string;
  serviceRequestId: string;
  adminId: IServiceRequestNoteAdmin;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceRequestPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IServiceRequestListParams {
  page: number;
  limit: number;
  search?: string;
  status?: ServiceRequestStatus;
  serviceId?: string;
  categoryId?: string;
  submittedFrom?: string;
  submittedTo?: string;
  sortBy?: "submittedAt" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface IServiceRequestStatusUpdate {
  status: ServiceRequestStatus;
}

export interface IServiceRequestNoteCreate {
  content: string;
}
