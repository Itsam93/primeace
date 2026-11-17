export type RequestStatus =
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
  status: RequestStatus;
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
  status: RequestStatus;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IServiceRequestNote {
  _id: string;
  serviceRequestId: string;
  adminId: {
    _id: string;
    fullName: string;
    email: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationMeta;
}

export interface IServiceRequestListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: RequestStatus;
  serviceId?: string;
  categoryId?: string;
  submittedFrom?: string;
  submittedTo?: string;
  sortBy?: "submittedAt" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
}

export interface IUpdateServiceRequestStatusInput {
  status: RequestStatus;
}

export interface ICreateServiceRequestNoteInput {
  content: string;
}

export interface IUpdateServiceRequestStatusResponse {
  // The backend returns the updated service request.
  data: IServiceRequestDetails;
}

export type ServiceRequestNoteListResponse =
  IPaginatedResponse<IServiceRequestNote>;
