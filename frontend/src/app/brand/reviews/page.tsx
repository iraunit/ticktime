"use client";

import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {GlobalLoader} from "@/components/ui/global-loader";
import {toast} from "@/lib/toast";
import {api} from "@/lib/api";
import {
    HiArrowPath,
    HiChatBubbleLeftRight,
    HiCheckCircle,
    HiEye,
    HiHandThumbUp,
    HiMagnifyingGlass,
    HiStar,
    HiUsers
} from "react-icons/hi2";

interface Review {
    id: number;
    deal: {
        id: number;
        campaign_title: string;
        status: string;
        value: number;
    };
    reviewer: {
        id: number;
        name: string;
        username: string;
        account_type: 'brand' | 'influencer';
        profile_image?: string;
    };
    reviewee: {
        id: number;
        name: string;
        username: string;
        account_type: 'brand' | 'influencer';
        profile_image?: string;
    };
    rating: number;
    review_text: string;
    created_at: string;
    is_public: boolean;
    response?: string;
    responded_at?: string;
}

interface ReviewStats {
    total_reviews_given: number;
    total_reviews_received: number;
    avg_rating_given: number;
    avg_rating_received: number;
    five_star_count: number;
    four_star_count: number;
    three_star_count: number;
    two_star_count: number;
    one_star_count: number;
}

export default function BrandReviewsPage() {
    const [reviewsGiven, setReviewsGiven] = useState<Review[]>([]);
    const [reviewsReceived, setReviewsReceived] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [ratingFilter, setRatingFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("received");

    // Response state
    const [responseText, setResponseText] = useState("");

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const [givenResponse, receivedResponse, statsResponse] = await Promise.all([
                api.get('/brands/reviews/given/', {
                    params: {
                        search: searchTerm || undefined,
                        rating: ratingFilter !== 'all' ? ratingFilter : undefined,
                    }
                }),
                api.get('/brands/reviews/received/', {
                    params: {
                        search: searchTerm || undefined,
                        rating: ratingFilter !== 'all' ? ratingFilter : undefined,
                    }
                }),
                api.get('/brands/reviews/stats/')
            ]);

            setReviewsGiven(givenResponse.data.reviews || []);
            setReviewsReceived(receivedResponse.data.reviews || []);
            setStats(statsResponse.data.stats || null);
        } catch (error: any) {
            console.error('Failed to fetch reviews:', error);
            toast.error('Failed to load reviews.');
        } finally {
            setIsLoading(false);
        }
    };

    const respondToReview = async (reviewId: number, response: string) => {
        try {
            await api.post(`/brands/reviews/${reviewId}/respond/`, {
                response: response.trim()
            });

            setResponseText("");
            setRespondingToId(null);
            await fetchReviews();
            toast.success('Response posted successfully');
        } catch (error: any) {
            console.error('Failed to respond to review:', error);
            toast.error('Failed to post response.');
        }
    };

    const updateReviewVisibility = async (reviewId: number, isPublic: boolean) => {
        try {
            await api.patch(`/brands/reviews/${reviewId}/visibility/`, {
                is_public: isPublic
            });

            await fetchReviews();
            toast.success(`Review made ${isPublic ? 'public' : 'private'}`);
        } catch (error: any) {
            console.error('Failed to update review visibility:', error);
            toast.error('Failed to update review visibility.');
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchReviews();
        }, searchTerm ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, ratingFilter]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
        const sizeClasses = {
            sm: 'w-3 h-3',
            md: 'w-4 h-4',
            lg: 'w-5 h-5'
        };

        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <HiStar
                        key={star}
                        className={`${sizeClasses[size]} ${
                            star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };


    return (
        <div className="min-h-screen">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                {/* Header */}
                <div className="relative mb-6">
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 rounded-xl -m-2"></div>

                    <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-1">
                                Reviews & Ratings
                            </h1>
                            <p className="text-sm text-gray-600 max-w-2xl">
                                Manage feedback from your collaborations and build your brand reputation.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs text-gray-500">Average Rating</p>
                                <p className="text-xs font-medium text-gray-700">
                                    {stats?.avg_rating_received.toFixed(1) || '0.0'}/5.0
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchReviews}
                                disabled={isLoading}
                                className="border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all duration-200 rounded-lg px-4 py-2"
                            >
                                <HiArrowPath className="h-4 w-4 mr-1"/>
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Reviews Received</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.total_reviews_received}</p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-lg">
                                        <HiStar className="w-6 h-6 text-yellow-600"/>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Reviews Given</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.total_reviews_given}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <HiUsers className="w-6 h-6 text-blue-600"/>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Avg. Rating Received</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-3xl font-bold text-gray-900">{stats.avg_rating_received.toFixed(1)}</p>
                                            {renderStars(Math.round(stats.avg_rating_received))}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <HiHandThumbUp className="w-6 h-6 text-green-600"/>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">5-Star Reviews</p>
                                        <p className="text-3xl font-bold text-gray-900">{stats.five_star_count}</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <HiCheckCircle className="w-6 h-6 text-purple-600"/>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Rating Distribution */}
                {stats && (
                    <Card className="mb-6 shadow-sm">
                        <CardHeader>
                            <CardTitle>Rating Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[5, 4, 3, 2, 1].map((rating) => {
                                    const count = rating === 5 ? stats.five_star_count :
                                        rating === 4 ? stats.four_star_count :
                                            rating === 3 ? stats.three_star_count :
                                                rating === 2 ? stats.two_star_count :
                                                    stats.one_star_count;
                                    const percentage = stats.total_reviews_received > 0 ? (count / stats.total_reviews_received) * 100 : 0;

                                    return (
                                        <div key={rating} className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 w-16">
                                                <span className="text-sm font-medium">{rating}</span>
                                                <HiStar className="w-4 h-4 text-yellow-400 fill-current"/>
                                            </div>
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-yellow-400 rounded-full transition-all duration-300"
                                                    style={{width: `${percentage}%`}}
                                                />
                                            </div>
                                            <div className="w-12 text-sm text-gray-600 text-right">
                                                {count}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search and Filters */}
                <Card className="shadow-sm border border-gray-200 mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="relative flex-1">
                                <HiMagnifyingGlass
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"/>
                                <Input
                                    placeholder="Search reviews by influencer name, campaign, or content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={ratingFilter} onValueChange={setRatingFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Filter by rating"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Ratings</SelectItem>
                                    <SelectItem value="5">5 Stars</SelectItem>
                                    <SelectItem value="4">4 Stars</SelectItem>
                                    <SelectItem value="3">3 Stars</SelectItem>
                                    <SelectItem value="2">2 Stars</SelectItem>
                                    <SelectItem value="1">1 Star</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Reviews Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                        <TabsTrigger value="received">Reviews Received ({reviewsReceived.length})</TabsTrigger>
                        <TabsTrigger value="given">Reviews Given ({reviewsGiven.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="received" className="space-y-4">
                        {isLoading ? (
                            <div className="grid gap-4">
                                {Array.from({length: 3}).map((_, i) => (
                                    <GlobalLoader key={i}/>
                                ))}
                            </div>
                        ) : reviewsReceived.length === 0 ? (
                            <Card
                                className="p-12 text-center bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
                                <GlobalLoader/>
                                <div className="mt-8">
                                    <p className="text-gray-500 mb-6">
                                        Complete deals with influencers to start receiving reviews.
                                    </p>
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {reviewsReceived.map((review) => (
                                    <Card key={review.id}
                                          className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {review.reviewer?.name?.charAt(0) || '?'}
                            </span>
                                                    </div>

                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{review.reviewer.name}</h3>
                                                        <p className="text-sm text-gray-600">{review.reviewer.username}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {renderStars(review.rating)}
                                                            <span className="text-sm text-gray-500">
                                {formatDate(review.created_at)}
                              </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <Badge variant={review.is_public ? "default" : "secondary"}
                                                           className="mb-2">
                                                        {review.is_public ? "Public" : "Private"}
                                                    </Badge>
                                                    <p className="text-sm text-gray-500">
                                                        Deal: {formatCurrency(review.deal.value)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="font-medium text-gray-900 mb-2">Campaign: {review.deal.campaign_title}</h4>
                                                <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                                            </div>

                                            {review.response && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <HiChatBubbleLeftRight className="w-4 h-4 text-blue-600"/>
                                                        <span className="font-medium text-blue-900">Your Response</span>
                                                        <span className="text-xs text-blue-600">
                              {formatDate(review.responded_at!)}
                            </span>
                                                    </div>
                                                    <p className="text-blue-800">{review.response}</p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {!review.response && (
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button size="sm" variant="outline">
                                                                    <HiChatBubbleLeftRight className="w-4 h-4 mr-2"/>
                                                                    Respond
                                                                </Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader>
                                                                    <DialogTitle>Respond to Review</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-4">
                                                                    <div className="bg-gray-50 p-3 rounded">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            {renderStars(review.rating)}
                                                                            <span
                                                                                className="font-medium">{review.reviewer.name}</span>
                                                                        </div>
                                                                        <p className="text-sm text-gray-700">{review.review_text}</p>
                                                                    </div>

                                                                    <Textarea
                                                                        placeholder="Write a professional response to this review..."
                                                                        value={responseText}
                                                                        onChange={(e) => setResponseText(e.target.value)}
                                                                        className="h-24"
                                                                    />

                                                                    <Button
                                                                        onClick={() => respondToReview(review.id, responseText)}
                                                                        disabled={!responseText.trim()}
                                                                        className="w-full"
                                                                    >
                                                                        Post Response
                                                                    </Button>
                                                                </div>
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateReviewVisibility(review.id, !review.is_public)}
                                                    >
                                                        Make {review.is_public ? "Private" : "Public"}
                                                    </Button>
                                                </div>

                                                <Button size="sm" variant="ghost">
                                                    <HiEye className="w-4 h-4 mr-2"/>
                                                    View Deal
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="given" className="space-y-4">
                        {isLoading ? (
                            <div className="grid gap-4">
                                {Array.from({length: 3}).map((_, i) => (
                                    <GlobalLoader key={i}/>
                                ))}
                            </div>
                        ) : reviewsGiven.length === 0 ? (
                            <Card
                                className="p-12 text-center bg-gradient-to-br from-white via-white to-gray-50 border border-gray-200 shadow-md">
                                <GlobalLoader/>
                                <div className="mt-8">
                                    <p className="text-gray-500 mb-6">
                                        Complete deals and rate influencers to build your review history.
                                    </p>
                                </div>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {reviewsGiven.map((review) => (
                                    <Card key={review.id}
                                          className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {review.reviewee?.name?.charAt(0) || '?'}
                            </span>
                                                    </div>

                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">{review.reviewee.name}</h3>
                                                        <p className="text-sm text-gray-600">{review.reviewee.username}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {renderStars(review.rating)}
                                                            <span className="text-sm text-gray-500">
                                {formatDate(review.created_at)}
                              </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">
                                                        Deal: {formatCurrency(review.deal.value)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h4 className="font-medium text-gray-900 mb-2">Campaign: {review.deal.campaign_title}</h4>
                                                <p className="text-gray-700 leading-relaxed">{review.review_text}</p>
                                            </div>

                                            {review.response && (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <HiChatBubbleLeftRight className="w-4 h-4 text-gray-600"/>
                                                        <span
                                                            className="font-medium text-gray-900">Influencer Response</span>
                                                        <span className="text-xs text-gray-500">
                              {formatDate(review.responded_at!)}
                            </span>
                                                    </div>
                                                    <p className="text-gray-700">{review.response}</p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-end">
                                                <Button size="sm" variant="ghost">
                                                    <HiEye className="w-4 h-4 mr-2"/>
                                                    View Deal
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
} 