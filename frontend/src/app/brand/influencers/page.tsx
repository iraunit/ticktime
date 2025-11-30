"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {Card} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Checkbox} from "@/components/ui/checkbox";
import {
    HiArrowPath,
    HiBookmark,
    HiCheck,
    HiCheckBadge,
    HiChevronDown,
    HiChevronUp,
    HiEnvelope,
    HiEye,
    HiEyeSlash,
    HiFunnel,
    HiGlobeAlt,
    HiHeart,
    HiMagnifyingGlass,
    HiMapPin,
    HiPlay,
    HiPlus,
    HiSparkles,
    HiStar,
    HiUsers
} from "react-icons/hi2";
import {HiX} from "react-icons/hi";
import {getPlatformConfig, platformConfig, platformOptions} from "@/lib/platform-config";
import {api} from "@/lib/api";
import {toast} from "@/lib/toast";
import {GlobalLoader} from "@/components/ui/global-loader";
import {CampaignSelectionDialog} from "@/components/campaigns/campaign-selection-dialog";
import {MultiSelectOption, MultiSelectSearch} from "@/components/ui/multi-select-search";


interface Influencer {
    id: number;
    username: string;            // user.username
    full_name: string;          // computed full name
    industry: string;           // industry name
    bio: string;
    profile_image?: string;
    is_verified: boolean;
    total_followers: number;
    avg_engagement: number;
    collaboration_count: number;
    avg_rating: number;
    platforms: string[];        // active platforms
    location: string;           // formatted location from backend
    posts_count?: number;
    rate_per_post?: number;
    is_bookmarked?: boolean;
}

// Column configuration
const columnConfig = {
    creator: {key: 'creator', label: 'Creator Profile', visible: true, sortable: false},
    rating: {key: 'rating', label: 'Rating', visible: true, sortable: true},
    followers: {key: 'followers', label: 'Followers', visible: true, sortable: true},
    engagement: {key: 'engagement', label: 'Engagement', visible: true, sortable: true},
    posts: {key: 'posts', label: 'Posts', visible: true, sortable: true},
    location: {key: 'location', label: 'Location', visible: true, sortable: false},
    categories: {key: 'categories', label: 'Categories', visible: true, sortable: false},
    actions: {key: 'actions', label: 'Actions', visible: true, sortable: false}
};

const followerRanges = [
    {label: "All Followers", min: 0, max: 999999999},
    {label: "1K - 10K", min: 1000, max: 10000},
    {label: "10K - 50K", min: 10000, max: 50000},
    {label: "50K - 100K", min: 50000, max: 100000},
    {label: "100K - 500K", min: 100000, max: 500000},
    {label: "500K - 1M", min: 500000, max: 1000000},
    {label: "1M - 5M", min: 1000000, max: 5000000},
    {label: "5M+", min: 5000000, max: 999999999}
];

type IndustryOption = { key: string; name: string };

export default function InfluencerSearchPage() {
    const [influencers, setInfluencers] = useState<Influencer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showColumnSettings, setShowColumnSettings] = useState(false);
    const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
    const [selectedInfluencers, setSelectedInfluencers] = useState<Set<number>>(new Set());
    const [showCampaignDialog, setShowCampaignDialog] = useState(false);
    const [showMessageDialog, setShowMessageDialog] = useState(false);
    const [messageInfluencer, setMessageInfluencer] = useState<Influencer | null>(null);
    const [messageContent, setMessageContent] = useState("");
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
    const [individualInfluencer, setIndividualInfluencer] = useState<number | null>(null);
    const [isLoadingActions, setIsLoadingActions] = useState(false);
    const [showCampaignSelectionInMessage, setShowCampaignSelectionInMessage] = useState(false);
    const [useDropdownForCampaigns, setUseDropdownForCampaigns] = useState(false);
    const [campaignSearchTerm, setCampaignSearchTerm] = useState("");
    const [showImportDialog, setShowImportDialog] = useState(false);
    const importFiltersFromCampaign = async () => {
        try {
            const id = window.prompt('Enter Campaign ID to import filters');
            if (!id) return;
            const resp = await api.get(`/brands/campaigns/${id}/`);
            const c = resp?.data?.campaign || {};
            const ages = Array.isArray(c.target_influencer_age_ranges) ? c.target_influencer_age_ranges : [];
            const prefs = Array.isArray(c.target_influencer_collaboration_preferences) ? c.target_influencer_collaboration_preferences : [];
            const maxAmt = c.target_influencer_max_collab_amount;
            setAgeRangesFilter(ages);
            setCollabPrefsFilter(prefs);
            setMaxCollabAmountFilter(maxAmt ? String(maxAmt) : "");
            toast.success('Filters imported from campaign');
            setShowFilters(true);
            await fetchInfluencers(1, false);
        } catch (e: any) {
            toast.error('Failed to import filters');
        }
    };
    const [ageRangesFilter, setAgeRangesFilter] = useState<string[]>([]);
    const [collabPrefsFilter, setCollabPrefsFilter] = useState<string[]>([]);
    const [maxCollabAmountFilter, setMaxCollabAmountFilter] = useState<string>("");

    // Helper to show @username consistently (fallbacks if username missing)
    const getDisplayUsername = useCallback((inf: Influencer) => {
        const user = (inf?.username || '').trim();
        const handle = (inf?.handle || '').trim();
        const name = (inf?.name || '').trim();
        return user || handle || name || '';
    }, []);

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('influencer-table-columns');
        return saved ? JSON.parse(saved) : Object.fromEntries(
            Object.entries(columnConfig).map(([key, config]: [string, any]) => [key, config.visible])
        );
    });

    // Filter states
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [locationOptions, setLocationOptions] = useState<MultiSelectOption[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [genderFilters, setGenderFilters] = useState<string[]>([]);
    const [followerRange, setFollowerRange] = useState("All Followers");
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<MultiSelectOption[]>([]);
    const [pendingCampaignLocations, setPendingCampaignLocations] = useState<string[]>([]);
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
    const [industries, setIndustries] = useState<IndustryOption[]>([]);
    const [sortBy, setSortBy] = useState("followers");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [sortCombined, setSortCombined] = useState<string>("followers_desc");
    const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
    const [campaignFilter, setCampaignFilter] = useState<string>("");
    const [isInitialised, setIsInitialised] = useState(false);

    // Save column visibility to localStorage
    useEffect(() => {
        localStorage.setItem('influencer-table-columns', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Load filters from URL query on first mount so refresh preserves state
    useEffect(() => {
        try {
            if (typeof window === 'undefined') {
                setIsInitialised(true);
                return;
            }
            const params = new URLSearchParams(window.location.search);

            const search = params.get('search') || '';
            const platforms = (params.get('platforms') || '').split(',').map(s => s.trim()).filter(Boolean);
            const locations = (params.get('locations') || '').split(',').map(s => s.trim()).filter(Boolean);
            const genders = (params.get('genders') || '').split(',').map(s => s.trim()).filter(Boolean);
            const follower = params.get('follower_range') || '';
            const categories = (params.get('categories') || '').split(',').map(s => s.trim()).filter(Boolean);
            const industriesCsv = (params.get('industries') || '').split(',').map(s => s.trim()).filter(Boolean);
            const sortByParam = params.get('sort_by') || '';
            const sortOrderParam = params.get('sort_order') || '';
            const ageRangeParam = params.get('age_range') || '';
            const collabPrefs = (params.get('collaboration_preferences') || '').split(',').map(s => s.trim()).filter(Boolean);
            const maxCollab = params.get('max_collab_amount') || '';
            const campaignId = params.get('campaign_id') || '';

            if (search) setSearchTerm(search);
            if (platforms.length > 0) setSelectedPlatforms(platforms);
            if (locations.length > 0) setSelectedLocations(locations);
            if (genders.length > 0) setGenderFilters(genders);
            if (follower) setFollowerRange(follower);
            if (categories.length > 0) setSelectedCategories(categories);
            if (industriesCsv.length > 0) setSelectedIndustries(industriesCsv);
            if (sortByParam) setSortBy(sortByParam);
            if (sortOrderParam === 'asc' || sortOrderParam === 'desc') setSortOrder(sortOrderParam);
            if (ageRangeParam) setAgeRangesFilter([ageRangeParam]);
            if (collabPrefs.length > 0) setCollabPrefsFilter(collabPrefs);
            if (maxCollab) setMaxCollabAmountFilter(maxCollab);
            if (campaignId) setCampaignFilter(campaignId);
        } catch {
            // Ignore URL parse errors and fall back to defaults
        } finally {
            setIsInitialised(true);
        }
    }, []);

    // Load influencers from API
    const fetchInfluencers = useCallback(async (pageNum = 1, append = false) => {
        if (pageNum === 1) setIsLoading(true);

        try {
            const response = await api.get('/influencers/search/', {
                params: {
                    page: pageNum,
                    search: searchTerm,
                    platforms: selectedPlatforms.length > 0 ? selectedPlatforms.join(',') : undefined,
                    locations: selectedLocations.length > 0 ? selectedLocations.join(',') : undefined,
                    genders: genderFilters.length > 0 ? genderFilters.join(',') : undefined,
                    follower_range: followerRange !== 'All Followers' ? followerRange : undefined,
                    categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
                    industries: selectedIndustries.length > 0 ? selectedIndustries.join(',') : undefined,
                    sort_by: sortBy,
                    sort_order: sortOrder,
                    age_range: ageRangesFilter.length === 1 ? ageRangesFilter[0] : undefined,
                    collaboration_preferences: collabPrefsFilter.length > 0 ? collabPrefsFilter.join(',') : undefined,
                    max_collab_amount: maxCollabAmountFilter || undefined,
                    campaign_id: campaignFilter || undefined,
                }
            });

            const newInfluencers = response.data.results || [];
            const pagination = response.data.pagination || {};

            setInfluencers(prev => append ? [...prev, ...newInfluencers] : newInfluencers);
            setHasMore(pagination.has_next || false);
            setPage(pagination.page || pageNum);
            setTotalPages(pagination.total_pages || 1);
            setTotalCount(pagination.total_count || 0);
        } catch (error: any) {
            console.error('Failed to fetch influencers:', error);
            console.error('Error details:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
                statusText: error?.response?.statusText
            });

            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Failed to load influencers. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, selectedPlatforms, selectedLocations, genderFilters, followerRange, selectedCategories, selectedIndustries, sortBy, sortOrder, ageRangesFilter, collabPrefsFilter, maxCollabAmountFilter, campaignFilter]);

    // Sync filters and sorting to URL (after initialisation from URL)
    useEffect(() => {
        if (!isInitialised) return;
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set('search', searchTerm);
            if (selectedPlatforms.length > 0) params.set('platforms', selectedPlatforms.join(','));
            if (selectedLocations.length > 0) params.set('locations', selectedLocations.join(','));
            if (genderFilters.length > 0) params.set('genders', genderFilters.join(','));
            if (followerRange && followerRange !== 'All Followers') params.set('follower_range', followerRange);
            if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
            if (selectedIndustries.length > 0) params.set('industries', selectedIndustries.join(','));
            if (sortBy) params.set('sort_by', sortBy);
            if (sortOrder) params.set('sort_order', sortOrder);
            if (ageRangesFilter.length === 1) params.set('age_range', ageRangesFilter[0]);
            if (collabPrefsFilter.length > 0) params.set('collaboration_preferences', collabPrefsFilter.join(','));
            if (maxCollabAmountFilter) params.set('max_collab_amount', maxCollabAmountFilter);
            if (campaignFilter) params.set('campaign_id', campaignFilter);
            const qs = params.toString();
            const url = qs ? `/brand/influencers?${qs}` : '/brand/influencers';
            window.history.replaceState(null, '', url);
        } catch {
        }
    }, [searchTerm, selectedPlatforms, selectedLocations, genderFilters, followerRange, selectedCategories, selectedIndustries, sortBy, sortOrder, ageRangesFilter, collabPrefsFilter, maxCollabAmountFilter, campaignFilter]);

    // Bookmark influencer
    const handleBookmark = async (influencerId: number) => {
        try {
            const response = await api.post(`/brands/influencers/${influencerId}/bookmark/`);
            if (response.data) {
                toast.success("Influencer bookmarked successfully!");
                // Update local state immediately
                setInfluencers(prev => prev.map(influencer =>
                    influencer.id === influencerId
                        ? {...influencer, is_bookmarked: true}
                        : influencer
                ));
                if (selectedInfluencer && selectedInfluencer.id === influencerId) {
                    setSelectedInfluencer(prev => prev ? {...prev, is_bookmarked: true} : null);
                }
            }
        } catch (error) {
            console.error('Failed to bookmark influencer:', error);
            toast.error('Failed to bookmark influencer. Please try again.');
        }
    };

    // Remove bookmark
    const handleRemoveBookmark = async (influencerId: number) => {
        try {
            const response = await api.delete(`/brands/influencers/${influencerId}/unbookmark/`);
            if (response.data) {
                toast.success("Influencer removed from bookmarks!");
                // Update local state immediately
                setInfluencers(prev => prev.map(influencer =>
                    influencer.id === influencerId
                        ? {...influencer, is_bookmarked: false}
                        : influencer
                ));
                if (selectedInfluencer && selectedInfluencer.id === influencerId) {
                    setSelectedInfluencer(prev => prev ? {...prev, is_bookmarked: false} : null);
                }
            }
        } catch (error) {
            console.error('Failed to remove bookmark:', error);
            toast.error('Failed to remove bookmark. Please try again.');
        }
    };

    // Fetch campaigns for adding influencers / filtering
    const fetchCampaigns = useCallback(async () => {
        try {
            console.log('Fetching campaigns for influencers...');
            const response = await api.get('/brands/campaigns/for-influencers/');
            console.log('Campaigns for influencers response:', response.data);
            const campaignsData = response.data.campaigns || [];
            setCampaigns(campaignsData);

            // Use dropdown if more than 10 campaigns
            setUseDropdownForCampaigns(campaignsData.length > 10);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
            toast.error('Failed to load campaigns. Please try again.');
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    // Handle influencer selection
    const handleInfluencerSelect = (influencerId: number) => {
        setSelectedInfluencers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(influencerId)) {
                newSet.delete(influencerId);
            } else {
                newSet.add(influencerId);
            }
            return newSet;
        });
    };

    // Add selected influencers to campaigns
    const handleAddToCampaigns = async () => {
        if (selectedCampaigns.size === 0) {
            toast.error('Please select campaigns.');
            return;
        }

        // Check if we have influencers to add (either individual or bulk)
        if (!individualInfluencer && selectedInfluencers.size === 0) {
            toast.error('Please select influencers.');
            return;
        }

        setIsLoadingActions(true);
        try {
            // Use individual influencer if available, otherwise use bulk selection
            const influencerIds = individualInfluencer ? [individualInfluencer] : Array.from(selectedInfluencers);
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
                const influencerText = individualInfluencer ? 'influencer' : `${influencerIds.length} influencer${influencerIds.length > 1 ? 's' : ''}`;
                toast.success(`Successfully added ${influencerText} to ${successCount} campaign${successCount > 1 ? 's' : ''}.`);
                if (errorCount > 0) {
                    toast.error(`Failed to add to ${errorCount} campaign${errorCount > 1 ? 's' : ''}.`);
                }
                // Reset individual influencer state
                setIndividualInfluencer(null);
                setShowCampaignDialog(false);
                setSelectedCampaigns(new Set());
                fetchInfluencers(1, false);
            } else {
                toast.error('Failed to add influencers to any campaigns. Please try again.');
            }
        } catch (error: any) {
            console.error('Failed to add influencers to campaigns:', error);
            toast.error('Failed to add influencers to campaigns. Please try again.');
        } finally {
            setIsLoadingActions(false);
        }
    };

    // Handle campaign selection
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

    // Send message to influencer
    const handleSendMessage = async () => {
        if (!messageInfluencer || !messageContent.trim()) {
            toast.error('Please enter a message.');
            return;
        }

        setIsLoadingActions(true);
        try {
            const response = await api.post(`/brands/influencers/${messageInfluencer.id}/message/`, {
                content: messageContent
            });

            if (response.data) {
                toast.success('Message sent successfully!');
                setMessageContent("");
                setShowMessageDialog(false);
                setMessageInfluencer(null);
            }
        } catch (error: any) {
            console.error('Failed to send message:', error);
            const errorMessage = error.response?.data?.message || 'Failed to send message. Please try again.';

            // Check if it's the campaign requirement error
            if (errorMessage.includes('No existing deal found with this influencer')) {
                setShowCampaignSelectionInMessage(true);
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setIsLoadingActions(false);
        }
    };

    // Open message dialog
    const openMessageDialog = (influencer: Influencer) => {
        // Open messages in a new tab for this influencer
        window.open(`/brand/messages?influencer=${influencer.id}`, '_blank', 'noopener,noreferrer');
    };

    // Open campaign dialog
    const openCampaignDialog = () => {
        if (selectedInfluencers.size === 0) {
            toast.error('Please select influencers first.');
            return;
        }
        setShowCampaignDialog(true);
    };

    // Open campaign dialog for individual influencer
    const openIndividualCampaignDialog = (influencerId: number) => {
        setIndividualInfluencer(influencerId);
        setShowCampaignDialog(true);
    };

    useEffect(() => {
        // Initialize from query params
        try {
            const params = new URLSearchParams(window.location.search);
            const inds = params.get('industries');
            if (inds) setSelectedIndustries(inds.split(',').filter(Boolean));
            const cats = params.get('categories');
            if (cats) setSelectedCategories(cats.split(',').filter(Boolean));
            const campaignId = params.get('campaign_id');
            if (campaignId) setCampaignFilter(campaignId);
        } catch {
        }
        // Load industries for dropdown
        api.get('/common/industries/').then(res => {
            setIndustries(res.data?.industries || []);
        }).catch(() => {
        });
        // Load content categories (all) from common; fallback to filters API
        api.get('/common/content-categories/').then(res => {
            const cats = res?.data?.result?.categories || res?.data?.categories || [];
            const opts: MultiSelectOption[] = Array.isArray(cats)
                ? cats.map((c: any) => {
                    if (typeof c === 'string') return {value: c, label: c};
                    const key = (c.key || '').toString();
                    const label = (c.name || c.key || '').toString();
                    return key ? {value: key, label} : null;
                }).filter(Boolean) as MultiSelectOption[]
                : [];
            if (opts.length > 0) {
                setCategoryOptions(opts);
            } else {
                // Fallback to filters endpoint structure
                api.get('/influencers/filters/').then(r2 => {
                    const cats2 = r2?.data?.filters?.categories || [];
                    const opts2: MultiSelectOption[] = Array.isArray(cats2)
                        ? cats2.map((n: any) => {
                            const s = (typeof n === 'string' ? n : (n?.name || n?.key || '')) as string;
                            return s ? {value: s, label: s} : null;
                        }).filter(Boolean) as MultiSelectOption[]
                        : [];
                    setCategoryOptions(opts2);
                }).catch(() => {
                });
            }
        }).catch(() => {
            api.get('/influencers/filters/').then(r2 => {
                const cats2 = r2?.data?.filters?.categories || [];
                const opts2: MultiSelectOption[] = Array.isArray(cats2)
                    ? cats2.map((n: any) => {
                        const s = (typeof n === 'string' ? n : (n?.name || n?.key || '')) as string;
                        return s ? {value: s, label: s} : null;
                    }).filter(Boolean) as MultiSelectOption[]
                    : [];
                setCategoryOptions(opts2);
            }).catch(() => {
            });
        });
        // Load influencer locations for multi-select
        api.get('/common/influencer-locations/').then(res => {
            const locations: Array<{ city: string; state?: string }>
                = (res?.data?.locations || res?.data?.result?.locations || []);
            const opts: MultiSelectOption[] = locations.map(loc => {
                const city = (loc.city || '').trim();
                const state = (loc.state || '').trim();
                const label = state ? `${city}, ${state}` : city;
                return {value: label, label};
            });
            setLocationOptions(opts);
            // Apply pending campaign locations once options are available
            if (pendingCampaignLocations.length > 0) {
                const normalized = normalizeCampaignLocations(pendingCampaignLocations, opts);
                setSelectedLocations(normalized);
                setPendingCampaignLocations([]);
            }
        }).catch(() => {
        });
    }, []);

    const normalizeCampaignLocations = (rawList: string[], opts: MultiSelectOption[]) => {
        const lowerToLabel = new Map<string, string>(opts.map(o => [o.label.toLowerCase(), o.label]));
        const results: string[] = [];
        for (const raw of rawList) {
            let base = String(raw || '').trim();
            // Support delimiter variants like "City||State" or "City, State, India"
            base = base.replace(/\|\|/g, ', ');
            base = base.replace(/,?\s*india$/i, '');
            const parts = base.split(',').map(s => s.trim()).filter(Boolean);
            let candidate = base;
            if (parts.length >= 2) candidate = `${parts[0]}, ${parts[1]}`;
            const match = lowerToLabel.get(candidate.toLowerCase());
            results.push(match || candidate);
        }
        return results;
    };

    useEffect(() => {
        if (!isInitialised) return;
        setPage(1);
        fetchInfluencers(1, false);
    }, [fetchInfluencers, isInitialised]);

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("desc");
        }
    };

    const SortIcon = ({column}: { column: string }) => {
        if (sortBy !== column) return <HiChevronDown className="w-3 h-3 text-gray-400"/>;
        return sortOrder === "asc" ? <HiChevronUp className="w-3 h-3"/> : <HiChevronDown className="w-3 h-3"/>;
    };

    const hasActiveFilters = useMemo(() => {
        return searchTerm !== "" ||
            selectedPlatforms.length > 0 ||
            selectedLocations.length > 0 ||
            genderFilters.length > 0 ||
            followerRange !== "All Followers" ||
            selectedCategories.length > 0 ||
            selectedIndustries.length > 0 ||
            ageRangesFilter.length > 0 ||
            collabPrefsFilter.length > 0 ||
            !!maxCollabAmountFilter ||
            !!campaignFilter;
    }, [searchTerm, selectedPlatforms, selectedLocations, genderFilters, followerRange, selectedCategories, selectedIndustries, ageRangesFilter, collabPrefsFilter, maxCollabAmountFilter, campaignFilter]);

    const clearAllFilters = () => {
        setSearchTerm("");
        setSelectedPlatforms([]);
        setSelectedLocations([]);
        setGenderFilters([]);
        setFollowerRange("All Followers");
        setSelectedCategories([]);
        setSelectedIndustries([]);
        setAgeRangesFilter([]);
        setCollabPrefsFilter([]);
        setMaxCollabAmountFilter("");
        setCampaignFilter("");
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const handleContact = (influencer: Influencer) => {
        toast.success(`Contacting ${influencer.full_name}...`);
    };

    const handleAddToCampaignOld = (influencer: Influencer) => {
        toast.success(`${influencer.full_name} added to campaign!`);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchInfluencers(nextPage, true);
    };

    const toggleColumnVisibility = (columnKey: string) => {
        setVisibleColumns((prev: Record<string, boolean>) => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const PlatformIcon = ({platform}: { platform: string }) => {
        const config = platformConfig[platform as keyof typeof platformConfig];
        if (!config) return null;

        const IconComponent = config.icon;
        return (
            <div className={`w-6 h-6 ${config.bg} ${config.border} border rounded-md flex items-center justify-center`}>
                <IconComponent className={`w-3 h-3 ${config.color}`}/>
            </div>
        );
    };

    const primaryPlatform = selectedPlatforms[0] || 'all';

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Compact Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Discover Creators
                            </h1>
                            <p className="text-sm text-gray-600">
                                Find the perfect influencers for your brand. Filter by platform, audience size, and
                                content categories.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-500">Found</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {totalCount} creators
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowColumnSettings(!showColumnSettings)}
                                className="border border-gray-300 hover:border-gray-400"
                            >
                                <HiEyeSlash className="h-4 w-4 mr-1"/>
                                Columns
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="border border-gray-300 hover:border-gray-400"
                            >
                                <HiFunnel className="h-4 w-4 mr-1"/>
                                Filters
                                {hasActiveFilters && (
                                    <Badge className="ml-1 bg-indigo-100 text-indigo-800 px-1 py-0 text-xs">
                                        Active
                                    </Badge>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowImportDialog(true)}
                                className="border border-gray-300 hover:border-gray-400"
                            >
                                {selectedCampaign ? `Using: ${selectedCampaign.title}` : 'Import from Campaign'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Column Settings Panel */}
                {showColumnSettings && (
                    <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900">Column Visibility</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowColumnSettings(false)}
                                >
                                    <HiX className="w-4 h-4"/>
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(columnConfig).map(([key, config]) => (
                                    <div key={key} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={key}
                                            checked={visibleColumns[key]}
                                            onCheckedChange={() => toggleColumnVisibility(key)}
                                        />
                                        <label htmlFor={key} className="text-sm text-gray-700">
                                            {config.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                )}

                {/* Compact Search and Filters */}
                <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
                    <div className="p-3">
                        {/* Search Bar */}
                        <div className="relative mb-3">
                            <HiMagnifyingGlass
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                            <Input
                                placeholder="Search creators by name, username, or keywords..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 text-sm border border-gray-300 focus:border-indigo-300 focus:ring-indigo-200 rounded-lg"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded-full h-6 w-6 p-0"
                                >
                                    <HiX className="h-3 w-3"/>
                                </Button>
                            )}
                        </div>

                        {/* Quick Filters Row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                            {/* Platforms (Multi-select) */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Platforms</label>
                                <MultiSelectSearch
                                    options={platformOptions.map(p => ({value: p.value, label: p.label}))}
                                    value={selectedPlatforms}
                                    onValueChange={setSelectedPlatforms}
                                    placeholder="Select platforms"
                                />
                                {selectedPlatforms.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {selectedPlatforms.map(val => {
                                            const cfg = getPlatformConfig(val);
                                            const Icon = cfg?.icon;
                                            return (
                                                <span key={val}
                                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs bg-gray-50">
                                                    {Icon && <Icon
                                                        className={`w-3 h-3 ${cfg?.color || 'text-gray-600'}`}/>}<span>{cfg?.label || val}</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Campaign */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Campaign</label>
                                <Select
                                    value={campaignFilter || "all"}
                                    onValueChange={(val) => setCampaignFilter(val === "all" ? "" : val)}
                                >
                                    <SelectTrigger className="h-8 text-xs border border-gray-300">
                                        <SelectValue placeholder="All campaigns"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Campaigns</SelectItem>
                                        {campaigns.map((campaign) => (
                                            <SelectItem key={campaign.id} value={String(campaign.id)}>
                                                {campaign.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Industry (Multi-select) */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Industries</label>
                                <MultiSelectSearch
                                    options={industries.map(ind => ({value: ind.key, label: ind.name}))}
                                    value={selectedIndustries}
                                    onValueChange={setSelectedIndustries}
                                    placeholder="Select industries"
                                />
                            </div>

                            {/* Followers */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Followers</label>
                                <Select value={followerRange} onValueChange={setFollowerRange}>
                                    <SelectTrigger className="h-8 text-xs border border-gray-300">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {followerRanges.map(range => (
                                            <SelectItem key={range.label} value={range.label}>{range.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Sort (combined) */}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">Sort</label>
                                <Select value={sortCombined} onValueChange={(val) => {
                                    setSortCombined(val);
                                    const [by, order] = val.split('_');
                                    setSortBy(by);
                                    setSortOrder(order as 'asc' | 'desc');
                                }}>
                                    <SelectTrigger className="h-8 text-xs border border-gray-300">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="followers_desc">Followers (High to Low)</SelectItem>
                                        <SelectItem value="followers_asc">Followers (Low to High)</SelectItem>
                                        <SelectItem value="engagement_desc">Engagement (High to Low)</SelectItem>
                                        <SelectItem value="engagement_asc">Engagement (Low to High)</SelectItem>
                                        <SelectItem value="rating_desc">Rating (High to Low)</SelectItem>
                                        <SelectItem value="rating_asc">Rating (Low to High)</SelectItem>
                                        <SelectItem value="posts_desc">Posts (High to Low)</SelectItem>
                                        <SelectItem value="posts_asc">Posts (Low to High)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700">&nbsp;</label>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="w-full h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                        <HiX className="h-3 w-3 mr-1"/>
                                        Clear All
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <Card className="mb-3 bg-white border border-gray-200 shadow-sm">
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <HiSparkles className="w-4 h-4 text-indigo-600"/>
                                    Advanced Filters
                                </h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowFilters(false)}
                                >
                                    <HiX className="w-4 h-4"/>
                                </Button>
                            </div>

                            <div className="grid gap-3">
                                {/* Categories (Multi-select) */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                        Content Categories
                                    </label>
                                    <MultiSelectSearch
                                        options={categoryOptions}
                                        value={selectedCategories}
                                        onValueChange={setSelectedCategories}
                                        placeholder="Select categories"
                                    />
                                </div>

                                {/* Additional Filters */}
                                <div className="grid md:grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Locations</label>
                                        <MultiSelectSearch
                                            options={locationOptions}
                                            value={selectedLocations}
                                            onValueChange={setSelectedLocations}
                                            placeholder="Select locations"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Gender</label>
                                        <MultiSelectSearch
                                            options={[
                                                {value: 'male', label: 'Male'},
                                                {value: 'female', label: 'Female'},
                                                {value: 'other', label: 'Other'},
                                            ]}
                                            value={genderFilters}
                                            onValueChange={setGenderFilters}
                                            placeholder="Select genders"
                                        />
                                    </div>

                                    <div className="space-y-1"/>
                                </div>

                                {/* Extended Filters */}
                                <div className="grid md:grid-cols-3 gap-2 mt-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Age Range</label>
                                        <MultiSelectSearch
                                            options={[
                                                {value: '18-24', label: '18-24'},
                                                {value: '25-34', label: '25-34'},
                                                {value: '35-44', label: '35-44'},
                                                {value: '45-54', label: '45-54'},
                                                {value: '55+', label: '55+'},
                                            ]}
                                            value={ageRangesFilter}
                                            onValueChange={(vals) => setAgeRangesFilter(vals)}
                                            placeholder="Select age ranges"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Collaboration
                                            Preferences</label>
                                        <MultiSelectSearch
                                            options={[
                                                {value: 'cash', label: 'Cash'},
                                                {value: 'barter', label: 'Barter'},
                                                {value: 'hybrid', label: 'Hybrid'},
                                            ]}
                                            value={collabPrefsFilter}
                                            onValueChange={(vals) => setCollabPrefsFilter(vals)}
                                            placeholder="Select preferences"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700">Max Collab Amount
                                            (INR)</label>
                                        <Input type="number" placeholder="e.g., 10000" value={maxCollabAmountFilter}
                                               onChange={(e) => setMaxCollabAmountFilter(e.target.value)}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Bulk Actions Bar */}
                {selectedInfluencers.size > 0 && (
                    <Card
                        className="mb-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 shadow-sm">
                        <div className="p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <HiCheck className="w-5 h-5 text-indigo-600"/>
                                        <span className="text-sm font-medium text-indigo-900">
                      {selectedInfluencers.size} influencer{selectedInfluencers.size !== 1 ? 's' : ''} selected
                    </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedInfluencers(new Set())}
                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                                    >
                                        <HiX className="w-4 h-4"/>
                                        Clear
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={openCampaignDialog}
                                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                    >
                                        <HiPlus className="w-4 h-4 mr-1"/>
                                        Add to Campaigns
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Compact Table View */}
                <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                    <Checkbox
                                        checked={selectedInfluencers.size === influencers.length && influencers.length > 0}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedInfluencers(new Set(influencers.map(i => i.id)));
                                            } else {
                                                setSelectedInfluencers(new Set());
                                            }
                                        }}
                                    />
                                </th>
                                {visibleColumns.creator && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        Creator Profile
                                    </th>
                                )}
                                {visibleColumns.rating && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('rating')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiStar className="w-3 h-3 text-yellow-500"/>
                                            Rating
                                            <SortIcon column="rating"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.followers && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('followers')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiUsers className="w-3 h-3 text-blue-500"/>
                                            Followers
                                            <SortIcon column="followers"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.engagement && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('engagement')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiHeart className="w-3 h-3 text-red-500"/>
                                            Engagement
                                            <SortIcon column="engagement"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.posts && (
                                    <th
                                        className="px-3 py-2 text-left text-xs font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onClick={() => handleSort('posts')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <HiPlay className="w-3 h-3 text-green-500"/>
                                            Posts
                                            <SortIcon column="posts"/>
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.location && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        <div className="flex items-center gap-1">
                                            <HiMapPin className="w-3 h-3 text-purple-500"/>
                                            Location
                                        </div>
                                    </th>
                                )}
                                {visibleColumns.categories && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        Industry
                                    </th>
                                )}
                                {/* Platform-specific columns */}
                                {primaryPlatform === 'instagram' && (
                                    <>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Avg
                                            Likes
                                        </th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Avg
                                            Comments
                                        </th>
                                    </>
                                )}
                                {primaryPlatform === 'youtube' && (
                                    <>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Subscribers</th>
                                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Avg
                                            Views
                                        </th>
                                    </>
                                )}
                                {primaryPlatform === 'twitter' && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Followers
                                        (X)</th>
                                )}
                                {primaryPlatform === 'facebook' && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">Page
                                        Likes</th>
                                )}
                                {visibleColumns.actions && (
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-900">
                                        Actions
                                    </th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {influencers.map((influencer) => (
                                <tr
                                    key={influencer.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-3 py-2">
                                        <Checkbox
                                            checked={selectedInfluencers.has(influencer.id)}
                                            onCheckedChange={(checked) => handleInfluencerSelect(influencer.id)}
                                        />
                                    </td>
                                    {visibleColumns.creator && (
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <div
                                                        className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden border border-white shadow-sm">
                                                        {influencer.profile_image ? (
                                                            <img
                                                                src={influencer.profile_image}
                                                                alt={influencer.full_name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div
                                                                className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                                                {influencer.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {influencer.is_verified && (
                                                        <div
                                                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 border border-white rounded-full flex items-center justify-center">
                                                            <HiCheckBadge className="w-2 h-2 text-white"/>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1 mb-0.5">
                                                        <h3 className="font-medium text-gray-900 truncate text-sm">{influencer.full_name}</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">{getDisplayUsername(influencer) ? `@${getDisplayUsername(influencer)}` : ''}</p>
                                                    <div className="flex items-center gap-1">
                                                        {influencer.platforms.slice(0, 2).map(platform => (
                                                            <PlatformIcon key={platform} platform={platform}/>
                                                        ))}
                                                        {influencer.platforms.length > 2 && (
                                                            <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                +{influencer.platforms.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.rating && (
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                <HiStar className="w-3 h-3 text-yellow-500 fill-current"/>
                                                <span className="font-medium text-gray-900 text-sm">
                            {typeof influencer.avg_rating === 'number' && influencer.avg_rating > 0 ? influencer.avg_rating.toFixed(1) : "0.0"}
                          </span>
                                            </div>
                                        </td>
                                    )}
                                    {visibleColumns.followers && (
                                        <td className="px-3 py-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {formatNumber(influencer.total_followers)}
                        </span>
                                        </td>
                                    )}
                                    {visibleColumns.engagement && (
                                        <td className="px-3 py-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {(typeof influencer.engagement_rate === 'number' ? influencer.engagement_rate.toFixed(1) : null) ||
                              (typeof influencer.avg_engagement === 'number' ? influencer.avg_engagement.toFixed(1) : null) ||
                              "N/A"}%
                        </span>
                                        </td>
                                    )}
                                    {visibleColumns.posts && (
                                        <td className="px-3 py-2">
                        <span className="font-medium text-gray-900 text-sm">
                          {formatNumber(influencer.posts_count || 0)}
                        </span>
                                        </td>
                                    )}
                                    {visibleColumns.location && (
                                        <td className="px-3 py-2">
                                            <span
                                                className="text-gray-600 text-sm">{influencer.location || "N/A"}</span>
                                        </td>
                                    )}
                                    {visibleColumns.categories && (
                                        <td className="px-3 py-2">
                                            <span
                                                className="text-gray-700 text-sm">{influencer.industry || 'N/A'}</span>
                                        </td>
                                    )}
                                    {/* Platform-specific cells */}
                                    {primaryPlatform === 'instagram' && (
                                        <>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.avg_likes || '0'}</span>
                                            </td>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.avg_comments || '0'}</span>
                                            </td>
                                        </>
                                    )}
                                    {primaryPlatform === 'youtube' && (
                                        <>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.youtube_subscribers ?? '0'}</span>
                                            </td>
                                            <td className="px-3 py-2"><span
                                                className="text-gray-700 text-sm">{influencer.avg_views || '0'}</span>
                                            </td>
                                        </>
                                    )}
                                    {primaryPlatform === 'twitter' && (
                                        <td className="px-3 py-2"><span
                                            className="text-gray-700 text-sm">{influencer.twitter_followers ?? '0'}</span>
                                        </td>
                                    )}
                                    {primaryPlatform === 'facebook' && (
                                        <td className="px-3 py-2"><span
                                            className="text-gray-700 text-sm">{influencer.facebook_page_likes ?? '0'}</span>
                                        </td>
                                    )}
                                    {visibleColumns.actions && (
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-1">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedInfluencer(influencer)}
                                                            className="h-6 px-2 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                                        >
                                                            <HiEye className="w-3 h-3 mr-1"/>
                                                            View
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl">
                                                        <DialogHeader>
                                                            <DialogTitle className="text-2xl font-bold text-gray-900">
                                                                Creator Profile
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        {selectedInfluencer && (
                                                            <div className="space-y-6">
                                                                {/* Profile Header */}
                                                                <div className="flex items-start gap-6">
                                                                    <div className="relative">
                                                                        <div
                                                                            className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden border-4 border-white shadow-xl">
                                                                            {selectedInfluencer.profile_image ? (
                                                                                <img
                                                                                    src={selectedInfluencer.profile_image}
                                                                                    alt={selectedInfluencer.full_name}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div
                                                                                    className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
                                                                                    {selectedInfluencer.full_name.charAt(0)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {selectedInfluencer.is_verified && (
                                                                            <div
                                                                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 border-4 border-white rounded-full flex items-center justify-center">
                                                                                <HiCheckBadge
                                                                                    className="w-4 h-4 text-white"/>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-3 mb-3">
                                                                            <h2 className="text-2xl font-bold text-gray-900">{selectedInfluencer.full_name}</h2>
                                                                        </div>
                                                                        <p className="text-gray-600 mb-3">{getDisplayUsername(selectedInfluencer) ? `@${getDisplayUsername(selectedInfluencer)}` : ''}</p>
                                                                        <p className="text-gray-700 mb-4">{selectedInfluencer.bio || "No bio available"}</p>
                                                                        <div className="flex items-center gap-3">
                                                                            {selectedInfluencer.platforms.map(platform => (
                                                                                <PlatformIcon key={platform}
                                                                                              platform={platform}/>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-3">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => selectedInfluencer.is_bookmarked ? handleRemoveBookmark(selectedInfluencer.id) : handleBookmark(selectedInfluencer.id)}
                                                                            className={selectedInfluencer.is_bookmarked ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
                                                                        >
                                                                            <HiBookmark
                                                                                className={`w-4 h-4 mr-1 ${selectedInfluencer.is_bookmarked ? "fill-current" : ""}`}/>
                                                                            {selectedInfluencer.is_bookmarked ? "Bookmarked" : "Bookmark"}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                // Open individual campaign dialog without affecting bulk selection
                                                                                openIndividualCampaignDialog(selectedInfluencer.id);
                                                                            }}
                                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                                                        >
                                                                            <HiPlus className="w-4 h-4 mr-1"/>
                                                                            Add to Campaign
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Stats Grid */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    <div
                                                                        className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiUsers className="w-5 h-5 text-blue-600"/>
                                                                            <span
                                                                                className="text-sm font-medium text-blue-700">Followers</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-blue-900">
                                                                            {formatNumber(selectedInfluencer.total_followers)}
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiHeart
                                                                                className="w-5 h-5 text-green-600"/>
                                                                            <span
                                                                                className="text-sm font-medium text-green-700">Engagement</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-green-900">
                                                                            {(typeof selectedInfluencer.engagement_rate === 'number' ? selectedInfluencer.engagement_rate.toFixed(1) : null) ||
                                                                                (typeof selectedInfluencer.avg_engagement === 'number' ? selectedInfluencer.avg_engagement.toFixed(1) : null) ||
                                                                                "N/A"}%
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiPlay
                                                                                className="w-5 h-5 text-purple-600"/>
                                                                            <span
                                                                                className="text-sm font-medium text-purple-700">Posts</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-purple-900">
                                                                            {formatNumber(selectedInfluencer.posts_count || 0)}
                                                                        </p>
                                                                    </div>
                                                                    <div
                                                                        className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <HiStar
                                                                                className="w-5 h-5 text-yellow-600 fill-current"/>
                                                                            <span
                                                                                className="text-sm font-medium text-yellow-700">Rating</span>
                                                                        </div>
                                                                        <p className="text-2xl font-bold text-yellow-900">
                                                                            {typeof selectedInfluencer.avg_rating === 'number' ? selectedInfluencer.avg_rating.toFixed(1) : "N/A"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Contact Actions */}
                                                                <div
                                                                    className="flex gap-3 pt-6 border-t border-gray-200">
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            // Open individual campaign dialog without affecting bulk selection
                                                                            openIndividualCampaignDialog(selectedInfluencer.id);
                                                                        }}
                                                                        className="flex-1 border-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                                                    >
                                                                        <HiPlus className="w-4 h-4 mr-2"/>
                                                                        Add to Campaign
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            window.open(`/influencer/${selectedInfluencer.id}`, '_blank', 'noopener,noreferrer');
                                                                        }}
                                                                        className="flex-1 border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                                                                    >
                                                                        <HiGlobeAlt className="w-4 h-4 mr-2"/>
                                                                        View Profile
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </DialogContent>
                                                </Dialog>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => influencer.is_bookmarked ? handleRemoveBookmark(influencer.id) : handleBookmark(influencer.id)}
                                                    className={`h-6 w-6 p-0 ${influencer.is_bookmarked ? "text-blue-600" : "text-gray-400 hover:text-blue-600"}`}
                                                >
                                                    <HiBookmark
                                                        className={`w-3 h-3 ${influencer.is_bookmarked ? "fill-current" : ""}`}/>
                                                </Button>


                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        // Open individual campaign dialog without affecting bulk selection
                                                        openIndividualCampaignDialog(influencer.id);
                                                    }}
                                                    className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700"
                                                    title="Add to campaigns"
                                                >
                                                    <HiPlus className="w-3 h-3"/>
                                                </Button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center py-4">
                        <GlobalLoader/>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && influencers.length === 0 && (
                    <Card className="p-8 text-center bg-white border border-gray-200 shadow-sm">
                        <div
                            className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <HiSparkles className="w-8 h-8 text-indigo-600"/>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No creators found</h3>
                        <p className="text-gray-600 mb-4 max-w-md mx-auto">
                            Try adjusting your search criteria or filters to discover amazing creators for your
                            campaigns.
                        </p>
                        <Button
                            variant="outline"
                            onClick={clearAllFilters}
                            className="border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        >
                            <HiArrowPath className="w-4 h-4 mr-2"/>
                            Reset All Filters
                        </Button>
                    </Card>
                )}

                {/* Load More Button - Only show when there are results and more pages available */}
                {!isLoading && influencers.length > 0 && hasMore && (
                    <div className="flex flex-col items-center mt-6 mb-4 space-y-3">
                        <div className="text-sm text-gray-600">
                            Showing {influencers.length} of {totalCount} creators (Page {page} of {totalPages})
                        </div>
                        <Button
                            onClick={handleLoadMore}
                            size="lg"
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
                        >
                            <HiArrowPath className="w-5 h-5 mr-2"/>
                            Load More Creators
                        </Button>
                    </div>
                )}

                {/* Campaign Selection Dialog */}
                <CampaignSelectionDialog
                    trigger={<div style={{display: 'none'}}/>}
                    influencerIds={individualInfluencer ? [individualInfluencer] : Array.from(selectedInfluencers)}
                    title={individualInfluencer ? 'Add to Campaigns' : (selectedInfluencers.size === 1 ? 'Add to Campaigns' : `Add ${selectedInfluencers.size} Influencers to Campaigns`)}
                    open={showCampaignDialog}
                    onOpenChange={(open) => {
                        setShowCampaignDialog(open);
                        if (!open) setIndividualInfluencer(null);
                    }}
                    onSuccess={() => {
                        setShowCampaignDialog(false);
                        setIndividualInfluencer(null);
                        setSelectedInfluencers(new Set());
                        fetchInfluencers(1, false);
                    }}
                />

                {/* Import Filters Dialog */}
                <CampaignSelectionDialog
                    trigger={<div style={{display: 'none'}}/>}
                    influencerIds={[]}
                    title={'Import Filters from Campaign'}
                    open={showImportDialog}
                    onOpenChange={setShowImportDialog}
                    confirmLabel={'Import Filters'}
                    onConfirm={async (selected) => {
                        try {
                            const id = Array.isArray(selected) ? selected[0] : selected;
                            if (!id) return;
                            const resp = await api.get(`/brands/campaigns/${id}/`);
                            const c = resp?.data?.campaign || {};
                            const ages = Array.isArray(c.target_influencer_age_ranges) ? c.target_influencer_age_ranges : [];
                            const prefs = Array.isArray(c.target_influencer_collaboration_preferences) ? c.target_influencer_collaboration_preferences : [];
                            const maxAmt = c.target_influencer_max_collab_amount;
                            setAgeRangesFilter(ages);
                            setCollabPrefsFilter(prefs);
                            setMaxCollabAmountFilter(maxAmt ? String(maxAmt) : "");
                            // Set preferred filters based on campaign
                            if (Array.isArray(c.platforms_required)) setSelectedPlatforms(c.platforms_required);
                            const inds = Array.isArray(c.industries) && c.industries.length > 0 ? c.industries : (c.industry ? [c.industry] : []);
                            setSelectedIndustries(inds);
                            if (Array.isArray(c.content_categories)) setSelectedCategories(c.content_categories);
                            if (Array.isArray(c.target_influencer_genders)) setGenderFilters(c.target_influencer_genders);
                            if (Array.isArray(c.target_influencer_locations)) {
                                const locs: string[] = c.target_influencer_locations;
                                setPendingCampaignLocations(locs);
                                if (locationOptions.length > 0) {
                                    setSelectedLocations(normalizeCampaignLocations(locs, locationOptions));
                                    setPendingCampaignLocations([]);
                                }
                            }
                            setSelectedCampaign(c);
                            setCampaignFilter(String(c.id));
                            toast.success('Filters imported from campaign');
                            setShowFilters(true);
                            // Build params from selected campaign directly to avoid state sync timing
                            const plat = Array.isArray(c.platforms_required) ? c.platforms_required : [];
                            const industriesCsv = inds;
                            const cats = Array.isArray(c.content_categories) ? c.content_categories : [];
                            const gendersCsv = Array.isArray(c.target_influencer_genders) ? c.target_influencer_genders : [];
                            const locationsCsv = Array.isArray(c.target_influencer_locations) ? c.target_influencer_locations : [];

                            const baseParams = {
                                search: searchTerm,
                                platforms: plat.length > 0 ? plat.join(',') : undefined,
                                locations: locationsCsv.length > 0 ? locationsCsv.join(',') : undefined,
                                genders: gendersCsv.length > 0 ? gendersCsv.join(',') : undefined,
                                follower_range: followerRange !== 'All Followers' ? followerRange : undefined,
                                categories: cats.length > 0 ? cats.join(',') : undefined,
                                industries: industriesCsv.length > 0 ? industriesCsv.join(',') : undefined,
                                sort_by: sortBy,
                                sort_order: sortOrder,
                                age_range: ages.length === 1 ? ages[0] : undefined,
                                collaboration_preferences: prefs.length > 0 ? prefs.join(',') : undefined,
                                max_collab_amount: maxAmt ? String(maxAmt) : undefined,
                            } as any;

                            // Initial fetch page 1
                            let currentPage = 1;
                            const firstResp = await api.get('/influencers/search/', {
                                params: {
                                    ...baseParams,
                                    page: currentPage
                                }
                            });
                            const firstResults = firstResp.data.results || [];
                            const firstPagination = firstResp.data.pagination || {};
                            setInfluencers(firstResults);
                            setHasMore(firstPagination.has_next || false);
                            setPage(firstPagination.page || currentPage);
                            setTotalPages(firstPagination.total_pages || 1);
                            setTotalCount(firstPagination.total_count || 0);

                            // Auto-fetch until target influencers (soft cap)
                            const target = Number(c.target_influencers) || 0;
                            // Avoid tight loop; cap at 50 pages
                            while (target > 0 && firstResults.length + (currentPage - 1) * (firstPagination.page_size || 0) < target && (currentPage < (firstPagination.total_pages || 1))) {
                                currentPage += 1;
                                try {
                                    const response = await api.get('/influencers/search/', {
                                        params: {...baseParams, page: currentPage}
                                    });
                                    const newInfluencers = response.data.results || [];
                                    if (newInfluencers.length === 0) break;
                                    setInfluencers(prev => [...prev, ...newInfluencers]);
                                    const pagination = response.data.pagination || {};
                                    setHasMore(pagination.has_next || false);
                                    setPage(pagination.page || currentPage);
                                    setTotalPages(pagination.total_pages || 1);
                                    setTotalCount(pagination.total_count || 0);
                                } catch {
                                    break;
                                }
                            }
                        } catch (e: any) {
                            toast.error('Failed to import filters');
                        }
                    }}
                />

                {/* Message Dialog */}
                <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                Send Message
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {messageInfluencer && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div
                                        className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full overflow-hidden">
                                        {messageInfluencer.profile_image ? (
                                            <img
                                                src={messageInfluencer.profile_image}
                                                alt={messageInfluencer.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                                {messageInfluencer.full_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{messageInfluencer.full_name}</p>
                                        <p className="text-sm text-gray-500">@{messageInfluencer.username}</p>
                                    </div>
                                </div>
                            )}

                            {showCampaignSelectionInMessage && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 mb-2">
                                        This influencer needs to be added to a campaign first to send messages.
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowMessageDialog(false);
                                            setShowCampaignSelectionInMessage(false);
                                            setSelectedInfluencers(new Set([messageInfluencer?.id || 0]));
                                            setShowCampaignDialog(true);
                                        }}
                                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                                    >
                                        <HiPlus className="w-4 h-4 mr-1"/>
                                        Add to Campaign First
                                    </Button>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message
                                </label>
                                <Textarea
                                    value={messageContent}
                                    onChange={(e) => setMessageContent(e.target.value)}
                                    placeholder="Type your message here..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowMessageDialog(false);
                                        setShowCampaignSelectionInMessage(false);
                                    }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                {!showCampaignSelectionInMessage && (
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!messageContent.trim() || isLoadingActions}
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                    >
                                        {isLoadingActions ? (
                                            <>
                                                <HiArrowPath className="w-4 h-4 mr-2 animate-spin"/>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <HiEnvelope className="w-4 h-4 mr-2"/>
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
} 