"use client";

import {useState} from "react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {GlobalLoader} from "@/components/ui/global-loader";
import {HiArrowPath, HiPlus} from "react-icons/hi2";
import {HiX} from "react-icons/hi";
import {api} from "@/lib/api";
import {toast} from "@/lib/toast";
import ReactSelect from "react-select";

interface CampaignSelectionDialogProps {
    trigger: React.ReactNode;
    influencerIds: number[];
    onSuccess?: () => void;
    title?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CampaignSelectionDialog({
                                            trigger,
                                            influencerIds,
                                            onSuccess,
                                            title = "Add to Campaigns",
                                            open,
                                            onOpenChange
                                        }: CampaignSelectionDialogProps) {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
    const [isLoadingActions, setIsLoadingActions] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Use external open state if provided, otherwise use internal state
    const dialogOpen = open !== undefined ? open : isOpen;
    const setDialogOpen = onOpenChange || setIsOpen;

    const fetchCampaigns = async () => {
        setIsLoadingCampaigns(true);
        try {
            const response = await api.get('/brands/campaigns/for-influencers/');
            const campaignsData = response.data.campaigns || [];
            setCampaigns(campaignsData);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
            toast.error('Failed to load campaigns. Please try again.');
        } finally {
            setIsLoadingCampaigns(false);
        }
    };

    const handleCampaignSelect = (campaignId: string) => {
        setSelectedCampaigns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(campaignId)) {
                newSet.delete(campaignId);
            } else {
                newSet.add(campaignId);
            }
            return newSet;
        });
    };

    const handleAddToCampaigns = async () => {
        if (selectedCampaigns.size === 0) {
            toast.error('Please select campaigns.');
            return;
        }

        if (influencerIds.length === 0) {
            toast.error('No influencers selected.');
            return;
        }

        setIsLoadingActions(true);
        try {
            let successCount = 0;
            let errorCount = 0;

            // Add influencers to each selected campaign
            for (const campaignId of selectedCampaigns) {
                try {
                    const response = await api.post(`/brands/campaigns/${campaignId}/add-influencers/`, {
                        influencer_ids: influencerIds
                    });

                    if (response.data) {
                        successCount++;
                    }
                } catch (error: any) {
                    console.error(`Failed to add influencers to campaign ${campaignId}:`, error);
                    errorCount++;
                }
            }

            if (successCount > 0) {
                const influencerText = influencerIds.length === 1 ? 'influencer' : `${influencerIds.length} influencer${influencerIds.length > 1 ? 's' : ''}`;
                toast.success(`Successfully added ${influencerText} to ${successCount} campaign${successCount > 1 ? 's' : ''}.`);
                if (errorCount > 0) {
                    toast.error(`Failed to add to ${errorCount} campaign${errorCount > 1 ? 's' : ''}.`);
                }
                setDialogOpen(false);
                setSelectedCampaigns(new Set());
                onSuccess?.();
            } else {
                toast.error('Failed to add influencers to any campaigns. Please try again.');
            }
        } catch (error) {
            console.error('Failed to add influencers to campaigns:', error);
            toast.error('Failed to add influencers to campaigns. Please try again.');
        } finally {
            setIsLoadingActions(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setDialogOpen(open);
        if (open) {
            fetchCampaigns();
        } else {
            setSelectedCampaigns(new Set());
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {isLoadingCampaigns ? (
                        <div className="flex items-center justify-center py-4">
                            <GlobalLoader/>
                        </div>
                    ) : campaigns.length > 0 ? (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700">
                                    Select Campaigns ({selectedCampaigns.size} selected)
                                </label>
                            </div>

                            <div className="space-y-3">
                                <ReactSelect
                                    options={campaigns
                                        .sort((a: any, b: any) => {
                                            // Sort by creation date (most recent first)
                                            const getDate = (obj: any) => {
                                                const dateStr = obj.created_at || obj.created || obj.date_created;
                                                if (!dateStr) return new Date(0);
                                                const date = new Date(dateStr);
                                                return isNaN(date.getTime()) ? new Date(0) : date;
                                            };
                                            const dateA = getDate(a);
                                            const dateB = getDate(b);
                                            return dateB.getTime() - dateA.getTime();
                                        })
                                        .map((c: any) => ({
                                            value: c.id.toString(),
                                            label: `${c.title}${(() => {
                                                const dateStr = c.created_at || c.created || c.date_created;
                                                if (!dateStr) return '';
                                                const date = new Date(dateStr);
                                                return isNaN(date.getTime()) ? '' : ` (${date.toLocaleDateString()})`;
                                            })()}`,
                                            meta: c
                                        }))}
                                    isMulti
                                    classNamePrefix="rs"
                                    placeholder="Search campaigns..."
                                    value={Array.from(selectedCampaigns).map(id => {
                                        const c = campaigns.find((x: any) => x.id.toString() === id);
                                        return c ? {
                                            value: id,
                                            label: `${c.title}${(() => {
                                                const dateStr = c.created_at || c.created || c.date_created;
                                                if (!dateStr) return '';
                                                const date = new Date(dateStr);
                                                return isNaN(date.getTime()) ? '' : ` (${date.toLocaleDateString()})`;
                                            })()}`,
                                            meta: c
                                        } : {value: id, label: id} as any;
                                    })}
                                    onChange={(vals) => {
                                        const ids = new Set((vals as any[]).map(v => v.value));
                                        setSelectedCampaigns(ids as Set<string>);
                                    }}
                                    styles={{
                                        control: (base) => ({...base, borderColor: '#e5e7eb', minHeight: 44}),
                                        multiValue: (base) => ({...base, backgroundColor: '#eef2ff'}),
                                        multiValueLabel: (base) => ({...base, color: '#4338ca'}),
                                    }}
                                    menuPlacement="auto"
                                    closeMenuOnSelect={false}
                                    hideSelectedOptions={false}
                                    isClearable={false}
                                />
                                {selectedCampaigns.size > 0 && (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800 mb-2">
                                            Selected Campaigns ({selectedCampaigns.size}):
                                        </p>
                                        <div className="space-y-1">
                                            {Array.from(selectedCampaigns).slice(0, 10).map(campaignId => {
                                                const campaign = campaigns.find((c: any) => c.id.toString() === campaignId);
                                                return campaign ? (
                                                    <div key={campaignId}
                                                         className="flex items-center justify-between text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="text-blue-700">{campaign.title}</span>
                                                            {(campaign.created_at || campaign.created || campaign.date_created) && (
                                                                <span className="text-xs text-blue-500">
                                  Created: {(() => {
                                                                    const dateStr = campaign.created_at || campaign.created || campaign.date_created;
                                                                    if (!dateStr) return '';
                                                                    const date = new Date(dateStr);
                                                                    return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                                                                })()}
                                </span>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCampaignSelect(campaignId)}
                                                            className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                                                        >
                                                            <HiX className="w-3 h-3"/>
                                                        </Button>
                                                    </div>
                                                ) : null;
                                            })}
                                            {selectedCampaigns.size > 10 && (
                                                <div
                                                    className="text-xs text-blue-700">and {selectedCampaigns.size - 10} more...</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-500 mb-3">No active campaigns available</p>
                            <Button
                                size="sm"
                                onClick={() => window.open('/brand/campaigns/create', '_blank')}
                            >
                                Create Campaign
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddToCampaigns}
                            disabled={selectedCampaigns.size === 0 || influencerIds.length === 0 || isLoadingActions}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                        >
                            {isLoadingActions ? (
                                <>
                                    <HiArrowPath className="w-4 h-4 mr-2 animate-spin"/>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <HiPlus className="w-4 h-4 mr-2"/>
                                    Add to Campaigns
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
