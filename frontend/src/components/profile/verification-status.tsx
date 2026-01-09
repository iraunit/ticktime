"use client";

import {Badge} from '@/components/ui/badge';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {CheckCircle, Clock, Mail, Phone, XCircle} from '@/lib/icons';
import {formatTimeRemaining, useEmailVerification} from '@/hooks/use-email-verification';
import {usePhoneVerification} from '@/hooks/use-phone-verification';

interface VerificationStatusProps {
    profile?: any;
}

export function VerificationStatus({profile}: VerificationStatusProps) {
    const {
        sending: sendingEmail,
        canResend: canResendEmail,
        secondsUntilResend: secondsUntilResendEmail,
        sendVerificationEmail,
    } = useEmailVerification();

    const {
        sending: sendingPhone,
        canResend: canResendPhone,
        secondsUntilResend: secondsUntilResendPhone,
        sendVerificationPhone,
    } = usePhoneVerification();

    if (!profile) return null;

    const verificationItems = [
        {
            id: 'email',
            label: 'Email Verification',
            verified: profile.email_verified,
            description: 'Email address has been verified',
            rejectionReason: undefined,
            action: !profile.email_verified ? {
                label: sendingEmail ? 'Sending...' : canResendEmail ? 'Send Verification Email' : `Resend in ${formatTimeRemaining(secondsUntilResendEmail)}`,
                onClick: sendVerificationEmail,
                disabled: !canResendEmail || sendingEmail,
                icon: Mail,
            } : null
        },
        {
            id: 'phone',
            label: 'Phone Verification',
            verified: profile.phone_verified,
            description: 'Phone number has been verified',
            rejectionReason: undefined,
            action: !profile.phone_verified ? {
                label: sendingPhone ? 'Sending...' : canResendPhone ? 'Send Verification WhatsApp' : `Resend in ${formatTimeRemaining(secondsUntilResendPhone)}`,
                onClick: sendVerificationPhone,
                disabled: !canResendPhone || sendingPhone,
                icon: Phone,
            } : null
        },
        {
            id: 'aadhar',
            label: 'Aadhar Verification',
            verified: !!(profile.aadhar_number && profile.aadhar_document && profile.is_verified),
            description: profile.verification_rejection_reason 
                ? 'Aadhar verification was rejected'
                : 'Aadhar document has been uploaded and verified',
            rejectionReason: profile.verification_rejection_reason
        },
        {
            id: 'profile',
            label: 'Profile Verification',
            verified: profile.profile_verified,
            description: 'Complete profile verification (requires email, phone, and aadhar verification)',
            rejectionReason: undefined
        }
    ];

    const getStatusIcon = (verified: boolean) => {
        if (verified) {
            return <CheckCircle className="h-4 w-4 text-green-600"/>;
        }
        return <XCircle className="h-4 w-4 text-red-500"/>;
    };

    const getStatusBadge = (verified: boolean) => {
        if (verified) {
            return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
        }
        return <Badge variant="secondary" className="bg-gray-100 text-gray-600">Pending</Badge>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-500"/>
                <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
            </div>

            {/* Verification Items */}
            <div className="grid gap-4">
                {verificationItems.map((item) => (
                    <Card key={item.id} className={`border-l-4 ${
                        item.verified ? 'border-l-green-500' : item.rejectionReason ? 'border-l-red-500' : 'border-l-gray-300'
                    }`}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(item.verified)}
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {item.label}
                                        </h3>
                                        <p className={`text-xs mt-1 ${item.rejectionReason ? 'text-red-600' : 'text-gray-500'}`}>
                                            {item.description}
                                        </p>
                                        {item.rejectionReason && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                                <strong>Rejection Reason:</strong> {item.rejectionReason}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.action && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={item.action.onClick}
                                            disabled={item.action.disabled}
                                            className="gap-2"
                                        >
                                            {item.action.icon && <item.action.icon className="h-4 w-4"/>}
                                            {item.action.label}
                                        </Button>
                                    )}
                                    {getStatusBadge(item.verified)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Overall Status */}
            <Card className={`border-l-4 ${
                profile.profile_verified ? 'border-l-green-500 bg-green-50' : 'border-l-amber-500 bg-amber-50'
            }`}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                        {profile.profile_verified ? (
                            <CheckCircle className="h-6 w-6 text-green-600"/>
                        ) : (
                            <Clock className="h-6 w-6 text-amber-600"/>
                        )}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">
                                {profile.profile_verified ? 'Profile Fully Verified' : 'Profile Verification Pending'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {profile.profile_verified
                                    ? 'Your profile is fully verified and ready for collaborations'
                                    : 'Complete email, phone, and aadhar verification to get your profile verified'
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
