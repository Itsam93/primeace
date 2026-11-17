export interface IDashboardClientSnapshot {
  fullName: string;
  email: string | null;
  phone: string;
}

export interface IDashboardStatistics {
  clients: {
    total: number;
  };

  requests: {
    total: number;
    new: number;
    underReview: number;
    awaitingInformation: number;
  };

  quotations: {
    totalDocuments: number;
    drafts: number;
    awaitingResponse: number;
    revisionRequested: number;
  };

  contracts: {
    totalDocuments: number;
    awaitingAcceptance: number;
  };

  projects: {
    total: number;
    active: number;
    completed: number;
  };

  reviews: {
    pending: number;
  };
}

export interface IDashboardStatusCount {
  status: string;
  count: number;
}

export interface IDashboardStatusBreakdown {
  requests: IDashboardStatusCount[];
  quotations: IDashboardStatusCount[];
  contracts: IDashboardStatusCount[];
  projects: IDashboardStatusCount[];
  reviews: IDashboardStatusCount[];
}

export interface IDashboardRequest {
  _id: string;
  reference: string;
  clientSnapshot: IDashboardClientSnapshot;
  status: string;
  submittedAt: string;
  createdAt: string;
}

export interface IDashboardProject {
  _id: string;
  projectReference: string;
  title: string;
  clientSnapshot: IDashboardClientSnapshot;
  status: string;
  createdAt: string;
  expectedCompletionDate: string | null;
}

export interface IDashboardActivity {
  _id: string;
  actorId: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  createdAt: string;
}

export interface IDashboardOverview {
  statistics: IDashboardStatistics;
  statusBreakdown: IDashboardStatusBreakdown;
  recentRequests: IDashboardRequest[];
  recentProjects: IDashboardProject[];
  recentActivity: IDashboardActivity[];
}
