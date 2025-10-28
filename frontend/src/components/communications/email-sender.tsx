"use client";

import {useState} from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {communicationApi} from '@/lib/api';
import {toast} from 'sonner';
import {HiPaperAirplane} from 'react-icons/hi2';

interface Deal {
    id: number;
    influencer?: {
        id: number;
        username: string;
        user?: {
            first_name?: string;
            last_name?: string;
            email?: string;
        };
    };
}

interface EmailSenderProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deals: Deal[];
    onSuccess?: () => void;
    defaultNotificationType?: 'invitation' | 'status_update' | 'accepted' | 'shipped' | 'completed';
}

export function EmailSender({
                                open,
                                onOpenChange,
                                deals,
                                onSuccess,
                                defaultNotificationType = 'status_update'
                            }: EmailSenderProps) {
    const [notificationType, setNotificationType] = useState<string>(defaultNotificationType);
    const [customMessage, setCustomMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (deals.length === 0) {
            toast.error('No influencers selected');
            return;
        }

        setSending(true);

    try {
      const response = await communicationApi.sendCampaignNotification({
        deal_ids: deals.map(d => d.id),
        notification_type: notificationType as any,
        custom_message: customMessage || undefined,
      });

      // After interceptor, response.data contains the result object
      const successCount = response.data?.success_count || 0;
      const failedCount = response.data?.failed_count || 0;
      
      if (failedCount > 0) {
        toast.warning(
          `Notifications sent to ${successCount} influencer(s). ${failedCount} failed.`
        );
      } else {
        toast.success(
          response.data?.message || `Notifications sent to ${successCount} influencer(s)`
        );
      }

      // Reset form
      setCustomMessage('');
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error sending notifications:', error);
      toast.error(error.response?.data?.error || 'Failed to send notifications');
    } finally {
      setSending(false);
    }
    };

    const getInfluencerName = (deal: Deal) => {
        if (!deal.influencer) return 'Unknown';

        const user = deal.influencer.user;
        if (user?.first_name || user?.last_name) {
            return `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }

        return deal.influencer.username;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Send Notification</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Notification Type */}
                    <div className="space-y-2">
                        <Label htmlFor="notification-type">Notification Type</Label>
                        <Select value={notificationType} onValueChange={setNotificationType}>
                            <SelectTrigger id="notification-type">
                                <SelectValue placeholder="Select notification type"/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="invitation">Invitation</SelectItem>
                                <SelectItem value="status_update">Status Update</SelectItem>
                                <SelectItem value="accepted">Deal Accepted</SelectItem>
                                <SelectItem value="shipped">Product Shipped</SelectItem>
                                <SelectItem value="completed">Campaign Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Message */}
                    <div className="space-y-2">
                        <Label htmlFor="custom-message">
                            Custom Message <span className="text-gray-500 text-sm">(Optional)</span>
                        </Label>
                        <Textarea
                            id="custom-message"
                            placeholder="Add a personal message to include in the email..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            className="resize-none"
                        />
                        <p className="text-xs text-gray-500">
                            {customMessage.length}/1000 characters
                        </p>
                    </div>

                    {/* Influencer List Preview */}
                    <div className="space-y-2">
                        <Label>
                            Recipients ({deals.length} influencer{deals.length !== 1 ? 's' : ''})
                        </Label>
                        <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto bg-gray-50">
                            {deals.length === 0 ? (
                                <p className="text-sm text-gray-500">No influencers selected</p>
                            ) : (
                                <ul className="space-y-2">
                                    {deals.slice(0, 10).map((deal) => (
                                        <li key={deal.id} className="text-sm flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"/>
                                            <span className="font-medium">{getInfluencerName(deal)}</span>
                                            {deal.influencer?.user?.email && (
                                                <span className="text-gray-500 text-xs">
                          ({deal.influencer.user.email})
                        </span>
                                            )}
                                        </li>
                                    ))}
                                    {deals.length > 10 && (
                                        <li className="text-sm text-gray-500 italic">
                                            And {deals.length - 10} more...
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={sending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSend}
                            disabled={sending || deals.length === 0}
                            className="gap-2"
                        >
                            {sending ? (
                                <>
                                    <div
                                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <HiPaperAirplane className="h-4 w-4"/>
                                    Send Notifications
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

