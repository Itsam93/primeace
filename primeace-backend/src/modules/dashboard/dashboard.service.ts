import type { Types } from "mongoose";

import {
  ContractStatus,
  ProjectStatus,
  QuotationStatus,
  RequestStatus,
  ReviewStatus
} from "@primeace/shared";

import { AuditLog } from "../audit/Auditlog.js";
import { Client } from "../clients/Client.js";
import { Contract } from "../contracts/Contract.js";
import { Project } from "../projects/Project.js";
import { Quotation } from "../quotations/Quotation.js";
import { Review } from "../reviews/Review.js";
import { ServiceRequest } from "../service-requests/ServiceRequest.js";

interface StatusAggregationRow {
  _id: string | null;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface DashboardRequest {
  _id: Types.ObjectId;
  reference: string;
  clientSnapshot: {
    fullName: string;
    email: string | null;
    phone: string;
  };
  status: RequestStatus;
  submittedAt: Date;
  createdAt: Date;
}

interface DashboardProject {
  _id: Types.ObjectId;
  projectReference: string;
  title: string;
  clientSnapshot: {
    fullName: string;
    email: string | null;
    phone: string;
  };
  status: ProjectStatus;
  createdAt: Date;
  expectedCompletionDate: Date | null;
}

interface DashboardActivity {
  _id: Types.ObjectId;
  actorId: {
    _id: Types.ObjectId;
    fullName: string;
    email: string;
  } | null;
  action: string;
  resourceType: string;
  resourceId: Types.ObjectId;
  description: string;
  createdAt: Date;
}

interface DashboardOverview {
  statistics: {
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
  };

  statusBreakdown: {
    requests: StatusCount[];
    quotations: StatusCount[];
    contracts: StatusCount[];
    projects: StatusCount[];
    reviews: StatusCount[];
  };

  recentRequests: DashboardRequest[];
  recentProjects: DashboardProject[];
  recentActivity: DashboardActivity[];
}

function formatStatusBreakdown(
  results: StatusAggregationRow[]
): StatusCount[] {
  return results.map((result) => ({
    status: result._id ?? "UNKNOWN",
    count: result.count
  }));
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const activeProjectStatuses = [
    ProjectStatus.NOT_STARTED,
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.UNDER_REVIEW,
    ProjectStatus.ON_HOLD
  ];

  const [
    totalClients,
    totalRequests,
    newRequests,
    underReviewRequests,
    awaitingInformationRequests,
    totalQuotations,
    draftQuotations,
    sentQuotations,
    revisionRequestedQuotations,
    totalContracts,
    issuedContracts,
    totalProjects,
    activeProjects,
    completedProjects,
    pendingReviews,
    requestStatuses,
    quotationStatuses,
    contractStatuses,
    projectStatuses,
    reviewStatuses,
    recentRequests,
    recentProjects,
    recentActivity
  ] = await Promise.all([
    Client.countDocuments({
      isDeleted: false
    }),

    ServiceRequest.countDocuments({
      isDeleted: false
    }),

    ServiceRequest.countDocuments({
      isDeleted: false,
      status: RequestStatus.NEW
    }),

    ServiceRequest.countDocuments({
      isDeleted: false,
      status: RequestStatus.UNDER_REVIEW
    }),

    ServiceRequest.countDocuments({
      isDeleted: false,
      status: RequestStatus.AWAITING_INFORMATION
    }),

    Quotation.countDocuments(),

    Quotation.countDocuments({
      status: QuotationStatus.DRAFT
    }),

    Quotation.countDocuments({
      status: QuotationStatus.SENT
    }),

    Quotation.countDocuments({
      status: QuotationStatus.REVISION_REQUESTED
    }),

    Contract.countDocuments(),

    Contract.countDocuments({
      status: ContractStatus.ISSUED
    }),

    Project.countDocuments({
      isDeleted: false
    }),

    Project.countDocuments({
      isDeleted: false,
      status: {
        $in: activeProjectStatuses
      }
    }),

    Project.countDocuments({
      isDeleted: false,
      status: ProjectStatus.COMPLETED
    }),

    Review.countDocuments({
      status: ReviewStatus.PENDING
    }),

    ServiceRequest.aggregate<StatusAggregationRow>([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]).exec(),

    Quotation.aggregate<StatusAggregationRow>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]).exec(),

    Contract.aggregate<StatusAggregationRow>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]).exec(),

    Project.aggregate<StatusAggregationRow>([
      {
        $match: {
          isDeleted: false
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]).exec(),

    Review.aggregate<StatusAggregationRow>([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      },
      {
        $sort: {
          _id: 1
        }
      }
    ]).exec(),

    ServiceRequest.find({
      isDeleted: false
    })
      .select(
        "reference clientSnapshot status submittedAt createdAt"
      )
      .sort({
        submittedAt: -1
      })
      .limit(5)
      .lean<DashboardRequest[]>()
      .exec(),

    Project.find({
      isDeleted: false
    })
      .select(
        "projectReference title clientSnapshot status createdAt expectedCompletionDate"
      )
      .sort({
        createdAt: -1
      })
      .limit(5)
      .lean<DashboardProject[]>()
      .exec(),

    AuditLog.find()
      .select(
        "actorId action resourceType resourceId description createdAt"
      )
      .populate<{
        actorId: DashboardActivity["actorId"];
      }>({
        path: "actorId",
        select: "fullName email"
      })
      .sort({
        createdAt: -1
      })
      .limit(8)
      .lean<DashboardActivity[]>()
      .exec()
  ]);

  return {
    statistics: {
      clients: {
        total: totalClients
      },

      requests: {
        total: totalRequests,
        new: newRequests,
        underReview: underReviewRequests,
        awaitingInformation: awaitingInformationRequests
      },

      quotations: {
        totalDocuments: totalQuotations,
        drafts: draftQuotations,
        awaitingResponse: sentQuotations,
        revisionRequested: revisionRequestedQuotations
      },

      contracts: {
        totalDocuments: totalContracts,
        awaitingAcceptance: issuedContracts
      },

      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects
      },

      reviews: {
        pending: pendingReviews
      }
    },

    statusBreakdown: {
      requests: formatStatusBreakdown(requestStatuses),
      quotations: formatStatusBreakdown(quotationStatuses),
      contracts: formatStatusBreakdown(contractStatuses),
      projects: formatStatusBreakdown(projectStatuses),
      reviews: formatStatusBreakdown(reviewStatuses)
    },

    recentRequests,
    recentProjects,
    recentActivity
  };
}
