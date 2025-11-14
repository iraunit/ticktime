"use client";

import {useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {ContentSubmission as ContentSubmissionType, Deal} from "@/types";
import {AlertTriangle, CheckCircle, Clock, Download, Eye, FileImage, FileVideo, Upload} from "@/lib/icons";
import {cn} from "@/lib/utils";
import Image from "next/image";

interface ContentStatusProps {
    deal: Deal;
    submissions?: ContentSubmissionType[];
    onResubmit?: () => void;
    className?: string;
}

const statusConfig = {
    content_submitted: {
        icon: Clock,
        label: "Submitted",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        description: "Your content has been submitted and is awaiting review."
    },
    under_review: {
        icon: Clock,
        label: "Under Review",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        description: "The brand is currently reviewing your submitted content."
    },
    revision_requested: {
        icon: AlertTriangle,
        label: "Revision Requested",
        color: "bg-red-100 text-red-800 border-red-200",
        description: "The brand has requested revisions to your content. Please review the feedback and resubmit."
    },
    approved: {
        icon: CheckCircle,
        label: "Approved",
        color: "bg-green-100 text-green-800 border-green-200",
        description: "Your content has been approved! The campaign is now complete."
    }
};

export function ContentStatus({deal, submissions = [], onResubmit, className}: ContentStatusProps) {
    const [selectedSubmission, setSelectedSubmission] = useState<ContentSubmissionType | null>(null);

    const currentStatus = deal.status as keyof typeof statusConfig;
    const config = statusConfig[currentStatus];

    if (!config) {
        return null;
    }

    const StatusIcon = config.icon;
    const hasSubmissions = submissions.length > 0;
    const needsRevision = deal.status === 'revision_requested';

    const getFileIcon = (contentType: string) => {
        if (contentType.includes('image') || contentType === 'post' || contentType === 'story') {
            return <FileImage className="h-5 w-5 text-blue-500"/>;
        } else if (contentType.includes('video') || contentType === 'reel') {
            return <FileVideo className="h-5 w-5 text-purple-500"/>;
        }
        return <FileImage className="h-5 w-5 text-gray-500"/>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Status Header */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5"/>
                        <span>Content Status</span>
                        <Badge className={cn("text-sm border", config.color)}>
                            {config.label}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{config.description}</p>

                    {needsRevision && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4"/>
                            <AlertDescription>
                                Please review the feedback below and resubmit your content with the requested changes.
                            </AlertDescription>
                        </Alert>
                    )}

                    {needsRevision && (
                        <Button
                            onClick={onResubmit}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            <Upload className="h-4 w-4 mr-2"/>
                            Resubmit Content
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Submitted Content */}
            {hasSubmissions && (
                <Card>
                    <CardHeader>
                        <CardTitle>Submitted Content ({submissions.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {submissions.map((submission) => (
                                <div key={submission.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            {getFileIcon(submission.content_type)}
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {submission.platform} - {submission.content_type}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Submitted {formatDate(submission.submitted_at)}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            {submission.approved === true && (
                                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                    <CheckCircle className="h-3 w-3 mr-1"/>
                                                    Approved
                                                </Badge>
                                            )}
                                            {submission.approved === false && (
                                                <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                                    <AlertTriangle className="h-3 w-3 mr-1"/>
                                                    Needs Revision
                                                </Badge>
                                            )}
                                            {submission.approved === null && (
                                                <Badge
                                                    className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                                    <Clock className="h-3 w-3 mr-1"/>
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Caption */}
                                    {submission.caption && (
                                        <div className="bg-gray-50 rounded p-3">
                                            <p className="text-sm font-medium mb-1">Caption:</p>
                                            <p className="text-sm text-gray-700">{submission.caption}</p>
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {submission.feedback && (
                                        <div className="bg-red-50 border border-red-200 rounded p-3">
                                            <p className="text-sm font-medium text-red-900 mb-1">Feedback:</p>
                                            <p className="text-sm text-red-800">{submission.feedback}</p>
                                        </div>
                                    )}

                                    {/* File Actions */}
                                    <div className="flex items-center space-x-2">
                                        {submission.file_upload && submission.file_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedSubmission(submission)}
                                            >
                                                <Eye className="h-4 w-4 mr-1"/>
                                                Preview
                                            </Button>
                                        )}
                                        {submission.file_url && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(submission.file_url, '_blank')}
                                            >
                                                <Download className="h-4 w-4 mr-1"/>
                                                {submission.file_upload ? "Download" : "Open Link"}
                                            </Button>
                                        )}
                                    </div>

                                    {/* Revision Count */}
                                    {submission.revision_count > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Revision #{submission.revision_count}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* File Preview Modal */}
            {selectedSubmission && selectedSubmission.file_upload && selectedSubmission.file_url && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedSubmission(null)}
                >
                    <div
                        className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex items-center justify-between">
                            <h3 className="font-semibold">
                                {selectedSubmission.platform} - {selectedSubmission.content_type}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                ×
                            </Button>
                        </div>
                        <div className="p-4">
                            {selectedSubmission.content_type.includes('video') || selectedSubmission.content_type === 'reel' ? (
                                <video
                                    src={selectedSubmission.file_url}
                                    controls
                                    className="max-w-full max-h-[70vh]"
                                />
                            ) : (
                                <Image
                                    src={selectedSubmission.file_url}
                                    alt={`${selectedSubmission.platform} ${selectedSubmission.content_type}`}
                                    width={800}
                                    height={600}
                                    className="max-w-full max-h-[70vh] object-contain"
                                />
                            )}
                            {selectedSubmission.caption && (
                                <div className="mt-4 p-3 bg-gray-50 rounded">
                                    <p className="text-sm font-medium mb-1">Caption:</p>
                                    <p className="text-sm">{selectedSubmission.caption}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}