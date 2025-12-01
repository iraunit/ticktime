"use client";

import {useState} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Phone} from '@/lib/icons';
import {HiEnvelope} from 'react-icons/hi2';
import {Card} from '@/components/ui/card';

interface NotificationChannelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectEmail: () => void;
    onSelectWhatsApp: () => void;
    selectedCount: number;
    brandCredits?: number;
}

export function NotificationChannelDialog({
    open,
    onOpenChange,
    onSelectEmail,
    onSelectWhatsApp,
    selectedCount,
    brandCredits
}: NotificationChannelDialogProps) {
    const handleEmailSelect = () => {
        onSelectEmail();
        onOpenChange(false);
    };

    const handleWhatsAppSelect = () => {
        onSelectWhatsApp();
        onOpenChange(false);
    };

    const hasEnoughCredits = brandCredits === undefined || brandCredits >= selectedCount;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Choose Notification Channel</DialogTitle>
                    <DialogDescription>
                        Select how you want to notify {selectedCount} selected influencer{selectedCount !== 1 ? 's' : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 py-4">
                    <Card 
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-2 hover:border-blue-300"
                        onClick={handleEmailSelect}
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <HiEnvelope className="h-6 w-6 text-blue-600"/>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">Email Notification</h3>
                                <p className="text-sm text-gray-600">
                                    Send notification via email. No credits required.
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card 
                        className={`p-4 transition-colors border-2 ${
                            hasEnoughCredits 
                                ? 'cursor-pointer hover:bg-gray-50 hover:border-green-300' 
                                : 'opacity-60 cursor-not-allowed border-gray-200'
                        }`}
                        onClick={hasEnoughCredits ? handleWhatsAppSelect : undefined}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                                hasEnoughCredits ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                                <Phone className={`h-6 w-6 ${hasEnoughCredits ? 'text-green-600' : 'text-gray-400'}`}/>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900">WhatsApp Notification</h3>
                                    {brandCredits !== undefined && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                            {brandCredits} credits
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Send notification via WhatsApp. Requires {selectedCount} credit{selectedCount !== 1 ? 's' : ''}.
                                </p>
                                {!hasEnoughCredits && (
                                    <p className="text-xs text-amber-600 font-medium">
                                        Insufficient credits. You have {brandCredits} but need {selectedCount}. Contact support to recharge.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

