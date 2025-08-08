"use client";

import { Deal, DealStatus } from "@/types";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Upload,
  Eye,
  MessageSquare,
  DollarSign
} from "lucide-react";

interface DealTimelineProps {
  deal: Deal;
  className?: string;
}

interface TimelineStep {
  status: DealStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  date?: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isError?: boolean;
}

const statusOrder: DealStatus[] = [
  "invited",
  "accepted", 
  "active",
  "content_submitted",
  "under_review",
  "approved",
  "completed"
];

const statusInfo: Record<DealStatus, { 
  label: string; 
  description: string; 
  icon: React.ComponentType<{ className?: string }>;
}> = {
  invited: {
    label: "Invitation Received",
    description: "Brand has sent you a collaboration invitation",
    icon: MessageSquare,
  },
  pending: {
    label: "Response Pending",
    description: "Waiting for your response to the invitation",
    icon: Clock,
  },
  accepted: {
    label: "Deal Accepted",
    description: "You have accepted the collaboration deal",
    icon: CheckCircle,
  },
  active: {
    label: "Deal Active",
    description: "Collaboration is now active and ready for content creation",
    icon: CheckCircle,
  },
  content_submitted: {
    label: "Content Submitted",
    description: "Your content has been submitted for review",
    icon: Upload,
  },
  under_review: {
    label: "Under Review",
    description: "Brand is reviewing your submitted content",
    icon: Eye,
  },
  revision_requested: {
    label: "Revision Requested",
    description: "Brand has requested changes to your content",
    icon: AlertCircle,
  },
  approved: {
    label: "Content Approved",
    description: "Your content has been approved by the brand",
    icon: CheckCircle,
  },
  completed: {
    label: "Deal Completed",
    description: "Collaboration completed successfully",
    icon: DollarSign,
  },
  rejected: {
    label: "Deal Rejected",
    description: "Deal was rejected",
    icon: XCircle,
  },
  cancelled: {
    label: "Deal Cancelled",
    description: "Deal was cancelled",
    icon: XCircle,
  },
  dispute: {
    label: "In Dispute",
    description: "Deal is currently in dispute",
    icon: AlertCircle,
  },
};

export function DealTimeline({ deal, className }: DealTimelineProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentStatusIndex = () => {
    return statusOrder.indexOf(deal.status);
  };

  const getTimelineSteps = (): TimelineStep[] => {
    const currentIndex = getCurrentStatusIndex();
    const isRejected = deal.status === "rejected";
    const isCancelled = deal.status === "cancelled";
    const isDispute = deal.status === "dispute";
    const isRevisionRequested = deal.status === "revision_requested";

    // Handle special cases
    if (isRejected || isCancelled || isDispute) {
      return [
        {
          status: "invited",
          ...statusInfo.invited,
          date: deal.invited_at ? formatDate(deal.invited_at) : undefined,
          isCompleted: true,
          isCurrent: false,
        },
        {
          status: deal.status,
          ...statusInfo[deal.status],
          date: deal.responded_at ? formatDate(deal.responded_at) : undefined,
          isCompleted: true,
          isCurrent: true,
          isError: true,
        },
      ];
    }

    return statusOrder.map((status, index) => {
      const info = statusInfo[status];
      let date: string | undefined;
      
      // Set dates based on deal data
      if (status === "invited") date = deal.invited_at ? formatDate(deal.invited_at) : undefined;
      if (status === "accepted" && deal.responded_at) date = formatDate(deal.responded_at);
      if (status === "completed" && deal.completed_at) date = formatDate(deal.completed_at);

      return {
        status,
        ...info,
        date,
        isCompleted: index < currentIndex || (index === currentIndex && deal.status === status),
        isCurrent: index === currentIndex && deal.status === status,
        isError: false,
      };
    }).filter(step => {
      // Only show steps up to current status + 1 (next step)
      const stepIndex = statusOrder.indexOf(step.status);
      return stepIndex <= currentIndex + 1;
    });
  };

  const steps = getTimelineSteps();

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold text-gray-900">Deal Progress</h3>
      
      <div className="relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <div key={step.status} className="relative flex items-start pb-6">
              {/* Timeline line */}
              {!isLast && (
                <div 
                  className={cn(
                    "absolute left-4 top-8 w-0.5 h-full",
                    step.isCompleted ? "bg-green-500" : "bg-gray-200"
                  )} 
                />
              )}
              
              {/* Timeline dot */}
              <div className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white",
                step.isCompleted && !step.isError && "border-green-500 bg-green-50",
                step.isCurrent && !step.isError && "border-blue-500 bg-blue-50",
                step.isError && "border-red-500 bg-red-50",
                !step.isCompleted && !step.isCurrent && "border-gray-300"
              )}>
                <Icon className={cn(
                  "w-4 h-4",
                  step.isCompleted && !step.isError && "text-green-600",
                  step.isCurrent && !step.isError && "text-blue-600", 
                  step.isError && "text-red-600",
                  !step.isCompleted && !step.isCurrent && "text-gray-400"
                )} />
              </div>
              
              {/* Timeline content */}
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={cn(
                    "text-sm font-medium",
                    step.isCompleted && !step.isError && "text-green-900",
                    step.isCurrent && !step.isError && "text-blue-900",
                    step.isError && "text-red-900",
                    !step.isCompleted && !step.isCurrent && "text-gray-500"
                  )}>
                    {step.label}
                  </h4>
                  {step.date && (
                    <span className="text-xs text-gray-500 ml-2">
                      {step.date}
                    </span>
                  )}
                </div>
                <p className={cn(
                  "text-sm mt-1",
                  step.isCompleted && !step.isError && "text-green-700",
                  step.isCurrent && !step.isError && "text-blue-700",
                  step.isError && "text-red-700",
                  !step.isCompleted && !step.isCurrent && "text-gray-500"
                )}>
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Additional info for special statuses */}
      {deal.status === "revision_requested" && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-orange-800">
              Revision Required
            </span>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Please check the feedback and resubmit your content.
          </p>
        </div>
      )}
    </div>
  );
}