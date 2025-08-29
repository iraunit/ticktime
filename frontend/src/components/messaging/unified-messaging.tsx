"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GlobalLoader } from "@/components/ui/global-loader";
import { toast } from "@/lib/toast";
import { api } from "@/lib/api";
import { 
  HiChatBubbleLeftRight, 
  HiMagnifyingGlass,
  HiPaperAirplane,
  HiArrowPath,
  HiEllipsisVertical,
  HiArrowLeft,
  HiCheck
} from "react-icons/hi2";

interface Message {
  id: number;
  content: string;
  sender_type: 'brand' | 'influencer';
  created_at: string;
  read: boolean;
  is_read?: boolean;
}

interface Conversation {
  id: number;
  deal?: number; // For influencers (deal ID)
  deal_title: string;
  brand_name?: string; // For influencers
  brand_logo?: string | null; // Brand logo URL
  influencer_name?: string; // For brands
  influencer_username?: string; // For brands
  influencer_avatar?: string;
  influencer_id?: number; // For brands
  last_message?: {
    content: string;
    created_at?: string;
    timestamp?: string;
    sender_type: 'brand' | 'influencer';
  } | null;
  unread_count: number;
  messages_count?: number;
  created_at: string;
  updated_at?: string;
  status?: string;
}

type UserType = 'brand' | 'influencer';

interface UnifiedMessagingProps {
  userType: UserType;
  targetParam?: string; // influencer ID for brands, brand ID for influencers
}

export function UnifiedMessaging({ userType, targetParam }: UnifiedMessagingProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Get URL parameters for filtering
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const dealParam = searchParams.get('deal');
  const conversationParam = searchParams.get('conversation');
  const campaignParam = searchParams.get('campaign');

  // API endpoints based on user type
  const getApiEndpoints = () => {
    return {
      conversations: userType === 'brand' ? '/brands/conversations/' : '/messaging/conversations/',
      // Use unified conversation-based endpoint for both roles
      messagesByConversation: (conversationId: number) => `/messaging/conversations/${conversationId}/messages/`,
      // Keep first-message only for brand
      firstMessage: userType === 'brand' ? ((influencerId: string) => `/brands/influencers/${influencerId}/message/`) : null,
    };
  };

  const endpoints = getApiEndpoints();

  const fetchConversations = async () => {
    console.log('Fetching conversations...');
    setIsLoading(true);
    setError(null);
    try {
      // If we have a specific deal, fetch only that deal's conversation
      if (dealParam) {
        console.log('Fetching conversation for deal:', dealParam);
        const response = await api.get(`/deals/${dealParam}/messages/`, {
          timeout: 10000,
        });
        console.log('Deal conversation response:', response.data);
        
        // Create conversation object from deal data
        const dealConversation: Conversation = {
          id: parseInt(dealParam),
          deal: parseInt(dealParam),
          deal_title: response.data.deal_title || `Deal #${dealParam}`,
          brand_name: response.data.brand_name || 'Brand',
          brand_logo: response.data.brand_logo || null,
          influencer_name: response.data.influencer_name || 'Influencer',
          influencer_username: response.data.influencer_username || '',
          influencer_avatar: response.data.influencer_avatar || '',
          influencer_id: response.data.influencer_id || 0,
          last_message: response.data.messages && response.data.messages.length > 0 
            ? response.data.messages[response.data.messages.length - 1] 
            : null,
          unread_count: response.data.unread_count || 0,
          messages_count: response.data.messages?.length || 0,
          created_at: response.data.created_at || new Date().toISOString(),
          updated_at: response.data.updated_at || new Date().toISOString(),
          status: response.data.status || 'active'
        };
        

        
        setConversations([dealConversation]);
        setSelectedConversation(dealConversation);
        
        // Set messages directly from the response
        const received = Array.isArray(response.data?.messages) ? response.data.messages : [];
        const ordered = received
          .filter((m: any) => m && typeof m === 'object' && m.created_at)
          .slice()
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(ordered);
        
        return;
      }
      
      // Otherwise, fetch all conversations with filters
      const params: any = {
        search: searchTerm || undefined,
      };
      
      // Add campaign filtering if campaign parameter is present
      if (campaignParam) {
        params.campaign = campaignParam;
      }
      
      const response = await api.get(endpoints.conversations, {
        params,
        timeout: 10000,
      });
      console.log('Conversations response:', response.data);
      setConversations(response.data.conversations || []);
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error);
      const errorMessage = error.code === 'ECONNABORTED' 
        ? 'Request timed out. Please check your connection and try again.'
        : error.response?.data?.message || 'Failed to load conversations. Please try again.';
      
      setError(errorMessage);
      toast.error(errorMessage);
      setConversations([]);
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  };

  const getInfluencerDealId = (conversation: Conversation): number | null => {
    const raw = (conversation as any)?.deal;
    if (raw == null) return null;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'object' && typeof raw.id === 'number') return raw.id;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const fetchMessages = async (conversation: Conversation) => {
    // If we have a deal parameter, messages are already loaded in fetchConversations
    if (dealParam) {
      console.log('Messages already loaded for deal:', dealParam);
      return;
    }
    
    setIsLoadingMessages(true);
    try {
      console.log('Fetching messages for conversation:', conversation.id);
      
      // Use the general conversation endpoint
      const response = await api.get(endpoints.messagesByConversation(conversation.id));
      
      console.log('Messages response:', response.data);
      const received = Array.isArray(response.data?.messages) ? response.data.messages : [];
      // Ensure chronological order: oldest at top, newest at bottom
      const ordered = received
        .filter((m: any) => m && typeof m === 'object' && m.created_at)
        .slice()
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      console.log('Setting ordered messages:', ordered);
      setMessages(ordered);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      toast.error(error?.response?.data?.message || 'Failed to load messages.');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      let response;
      // If we have a deal parameter, use the deal-specific endpoint
      if (dealParam) {
        response = await api.post(`/deals/${dealParam}/messages/`, {
          content: newMessage.trim()
        });
      } else {
        // Use the general conversation endpoint
        response = await api.post(endpoints.messagesByConversation(selectedConversation.id), {
          content: newMessage.trim()
        });
      }
      
      const created = response.data?.message_data;
      if (created && typeof created === 'object') {
        // Append and keep ascending order by created_at
        setMessages(prev => {
          const next = [...prev, created];
          return next
            .filter((m: any) => m && typeof m === 'object' && m.created_at)
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        });
      } else {
        // Fallback: re-fetch thread if payload missing
        if (selectedConversation) await fetchMessages(selectedConversation);
      }
      setNewMessage("");
      
      // Update last message in conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: { content: newMessage.trim(), created_at: new Date().toISOString(), sender_type: userType } }
          : conv
      ));
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message.');
    }
  };

  const sendFirstMessage = async () => {
    if (!newMessage.trim() || userType !== 'brand') return;
    if (!dealParam && !targetParam) return;
    
    try {
      let response;
      
      if (dealParam) {
        // Create deal-specific conversation
        response = await api.post(`/deals/${dealParam}/messages/`, {
          content: newMessage.trim(),
        });
      } else if (targetParam) {
        // Create general influencer conversation
        response = await api.post(endpoints.firstMessage!(targetParam), {
          content: newMessage.trim(),
        });
      }
      
      setNewMessage("");
      
      // Refresh conversations and select newly created one
      await fetchConversations();
      const convId = response?.data?.conversation_id;
      
      if (convId) {
        const created = conversations.find(c => c.id === convId);
        if (created) {
          setSelectedConversation(created);
        }
      } else {
        // Fallback: find conversation by deal or influencer ID
        if (dealParam) {
          const match = conversations.find(c => {
            const dealId = getInfluencerDealId(c);
            return dealId?.toString() === dealParam;
          });
          if (match) setSelectedConversation(match);
        } else if (targetParam) {
          const match = conversations.find((c: any) => (c as any).influencer_id?.toString() === targetParam);
          if (match) setSelectedConversation(match as any);
        }
      }
      
      toast.success(dealParam ? 'Deal conversation started.' : 'Message sent. Conversation created.');
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast.error(error?.response?.data?.message || 'Failed to start conversation.');
    }
  };

  // Initial load of conversations
  useEffect(() => {
    fetchConversations();
  }, [dealParam, campaignParam]); // Refetch when deal or campaign parameter changes

  // Auto-select conversation based on target parameter, deal, or conversation ID
  useEffect(() => {
    if (conversations.length === 0) return;
    
    let match;
    
    // Priority 1: Specific conversation ID
    if (conversationParam) {
      match = conversations.find(c => c.id.toString() === conversationParam);
    }
    
    // Priority 2: Specific deal ID (HIGHEST PRIORITY for deal-based conversations)
    if (!match && dealParam) {
      match = conversations.find(c => {
        const dealId = getInfluencerDealId(c);
        return dealId?.toString() === dealParam;
      });
      
      // If we found a deal-specific conversation, select it immediately
      if (match) {
        setSelectedConversation(match as any);
        return;
      }
      
      // If no conversation exists for this deal, clear selection to show new conversation interface
      setSelectedConversation(null);
      return;
    }
    
    // Priority 3: Target parameter (influencer/brand ID) - only if no deal parameter
    if (!match && targetParam && !dealParam) {
      if (userType === 'brand') {
        match = conversations.find((c: any) => (c as any).influencer_id?.toString() === targetParam);
      } else {
        match = conversations.find((c: any) => (c as any).brand_id?.toString() === targetParam);
      }
    }
    
    if (match) {
      setSelectedConversation(match as any);
    } else {
      // If we have a targetParam but no match and no dealParam, clear selection to show new conversation interface
      if (targetParam && !dealParam) {
        setSelectedConversation(null);
      }
    }
  }, [conversations, targetParam, dealParam, conversationParam]);

  // Search with debounce
  useEffect(() => {
    if (searchTerm !== undefined) {
      const timeoutId = setTimeout(() => {
        fetchConversations();
      }, searchTerm ? 500 : 0);

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';

      const now = new Date();
      const isSameDay = now.toDateString() === date.toDateString();
      const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
      const diffInHours = diffInMinutes / 60;
      const diffInDays = diffInHours / 24;

      if (diffInMinutes < 1) return 'now';
      if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)}m`;
      if (isSameDay) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      if (diffInDays < 7) {
        // Show weekday + time for messages within the last week but not today
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
        const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${weekday} ${time}`;
      }
      // Older than a week: show date + time
      const md = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      return `${md}, ${time}`;
    } catch {
      return '';
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  };

  const handleNewConversationKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      sendFirstMessage();
    }
  };

  // Color schemes based on user type
  const colors = userType === 'brand' ? {
    primary: 'green',
    gradient: 'from-green-400 to-green-600',
    bg: 'bg-green-50',
    border: 'border-green-500',
    button: 'bg-green-500 hover:bg-green-600',
    focus: 'focus:border-green-500 focus:ring-green-500',
    unread: 'bg-green-500',
    message: 'bg-green-500',
    text: 'text-green-100',
    checkMark: 'text-green-200'
  } : {
    primary: 'purple',
    gradient: 'from-purple-400 to-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-500',
    button: 'bg-purple-500 hover:bg-purple-600',
    focus: 'focus:border-purple-500 focus:ring-purple-500',
    unread: 'bg-purple-500',
    message: 'bg-purple-500',
    text: 'text-purple-100',
    checkMark: 'text-purple-200'
  };

  const getDisplayName = (conversation: Conversation) => {
    if (!conversation) return 'Unknown';
    
    if (userType === 'brand') {
      return conversation.influencer_name || conversation.influencer_username || 'User';
    } else {
      return conversation.brand_name || 'Brand';
    }
  };

  const getDisplayAvatar = (conversation: Conversation) => {
    if (!conversation) return '?';
    
    const name = getDisplayName(conversation);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {dealParam ? (
                selectedConversation ? selectedConversation.deal_title : 'Deal Conversation'
              ) :
               campaignParam ? 'Campaign Messages' :
               targetParam && userType === 'brand' && !selectedConversation ? 'New Conversation' : 
               'Messages'}
            </h1>
            <p className="text-sm text-gray-500">
              {dealParam ? (
                selectedConversation ? (
                  <>
                    Collaboration with <span className="font-medium text-blue-600">{selectedConversation.brand_name}</span>
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Deal #{dealParam}
                    </span>
                  </>
                ) : `Start conversation for deal #${dealParam}`
              ) : campaignParam ? (
                conversations.length === 1 ? '1 conversation in this campaign' : `${conversations.length} conversations in this campaign`
              ) : targetParam && userType === 'brand' && !selectedConversation ? (
                `Start conversation with influencer #${targetParam}`
              ) : (
                `${conversations.length} conversations`
              )}
              {campaignParam && (
                <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Campaign #{campaignParam}
                </span>
              )}
              {targetParam && userType === 'brand' && !selectedConversation && !dealParam && !campaignParam && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  Influencer #{targetParam}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {(dealParam || campaignParam) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.close()}
                className="text-gray-600 hover:text-gray-900"
              >
                <HiArrowLeft className="h-4 w-4 mr-1" />
                Close
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={fetchConversations}
              disabled={isLoading}
              className="text-gray-600 hover:text-gray-900"
            >
              <HiArrowPath className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Deal-specific conversation: Show only the conversation without sidebar */}
        {dealParam && selectedConversation ? (
          <div className="w-full bg-white flex flex-col">
            {/* Conversation Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3">
                {selectedConversation.brand_logo ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
                    <img
                      src={selectedConversation.brand_logo}
                      alt={selectedConversation.brand_name || 'Brand'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
                    <span className="text-sm font-bold text-white">
                      {getDisplayAvatar(selectedConversation)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation.deal_title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    with <span className="font-medium text-blue-600">{getDisplayName(selectedConversation)}</span>
                    <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                      Deal #{dealParam}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-gray-500">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <HiChatBubbleLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
                  <p className="text-gray-500 text-sm">
                    Send your first message about <span className="font-medium">"{selectedConversation.deal_title}"</span> to <span className="font-medium text-blue-600">{selectedConversation.brand_name}</span>.
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === userType ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender_type === userType
                          ? `${colors.message} text-white`
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender_type === userType ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex space-x-2">
                <Input
                  placeholder={`Message ${selectedConversation.brand_name} about "${selectedConversation.deal_title}"...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className={colors.button}
                >
                  <HiPaperAirplane className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Standard layout for non-deal conversations */
          <>
        {/* Desktop: Two-column layout */}
        <div className="hidden lg:flex w-full">
          {/* Conversations List */}
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 border-gray-300 ${colors.focus}`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3 p-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <HiChatBubbleLeftRight className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">{error}</p>
                  </div>
                  <Button 
                    onClick={fetchConversations}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <HiChatBubbleLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {userType === 'brand' 
                      ? 'Start conversations by creating campaigns and sending deals to influencers.'
                      : 'Start conversations by accepting deals from brands.'
                    }
                  </p>
                  {searchTerm && (
                    <p className="text-gray-400 text-xs">
                      No conversations found for "{searchTerm}"
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  {conversations.map((conversation) => {
                    return (
                    <div
                      key={conversation.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                        selectedConversation?.id === conversation.id ? `${colors.bg} border-r-4 ${colors.border}` : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <div className={`w-12 h-12 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
                              <span className="text-sm font-bold text-white">
                                {getDisplayAvatar(conversation)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold text-gray-900 truncate text-sm">
                                {getDisplayName(conversation)}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {conversation.last_message?.created_at || conversation.last_message?.timestamp
                                  ? formatTime(conversation.last_message.created_at || conversation.last_message.timestamp!)
                                  : ''}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-2 truncate">
                              {dealParam && getInfluencerDealId(conversation)?.toString() === dealParam ? 
                                `🎯 Deal #${dealParam}: ${conversation.deal_title}` : 
                                conversation.deal_title
                              }
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-700 truncate flex-1">
                                {conversation.last_message?.sender_type === userType ? (
                                  <span className="text-gray-500">You: </span>
                                ) : ''}
                                {conversation.last_message?.content || 'No messages yet'}
                              </p>
                              {conversation.unread_count > 0 && (
                                <div className={`w-5 h-5 ${colors.unread} text-white text-xs rounded-full flex items-center justify-center ml-2 font-bold`}>
                                  {conversation.unread_count}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 bg-white flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
                          <span className="text-sm font-bold text-white">
                            {getDisplayAvatar(selectedConversation)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getDisplayName(selectedConversation)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dealParam ? `Deal #${dealParam}: ${selectedConversation.deal_title}` : selectedConversation.deal_title}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="p-2 h-auto text-gray-600 hover:text-gray-900">
                        <HiEllipsisVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <GlobalLoader />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <HiChatBubbleLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No messages yet</p>
                        <p className="text-sm text-gray-400">Start the conversation below</p>
                      </div>
                    </div>
                  ) : (
                    messages.filter(message => message && typeof message === 'object').map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === userType ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-xs lg:max-w-md">
                          <div
                            className={`px-4 py-2 rounded-2xl shadow-sm ${
                              message.sender_type === userType
                                ? `${colors.message} text-white rounded-br-md`
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content || 'No content'}</p>
                            <div className={`flex items-center mt-1 space-x-1 ${message.sender_type === userType ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-xs ${message.sender_type === userType ? colors.text : 'text-gray-500'}`}>
                                {formatTime(message.created_at)}
                              </span>
                              {message.sender_type === userType && (
                                <div className="flex items-center">
                                  {message.is_read ? (
                                    <div className="flex">
                                      <HiCheck className="w-3 h-3 text-blue-200" />
                                      <HiCheck className="w-3 h-3 text-blue-200 -ml-1" />
                                    </div>
                                  ) : (
                                    <HiCheck className={`w-3 h-3 ${colors.checkMark}`} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-3 bg-white border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-3 flex items-center">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleInputKeyPress}
                        className="flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none p-0"
                      />
                    </div>
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className={`${colors.button} text-white rounded-full p-3 h-auto`}
                    >
                      <HiPaperAirplane className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50">
                <div className="text-center max-w-md">
                  <HiChatBubbleLeftRight className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {dealParam && userType === 'brand'
                      ? `Start deal conversation`
                      : targetParam && userType === 'brand'
                      ? `Start a new conversation`
                      : 'Select a conversation'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {dealParam && userType === 'brand'
                      ? `Send the first message to start a conversation for deal #${dealParam}.`
                      : targetParam && userType === 'brand'
                      ? `Send the first message to create a conversation with influencer #${targetParam}.`
                      : 'Choose a conversation from the list to start messaging.'}
                  </p>
                  {(dealParam || targetParam) && userType === 'brand' && (
                    <div className="flex items-center gap-3 max-w-md">
                      <div className="flex-1 bg-gray-100 rounded-full px-4 py-3 flex items-center">
                        <Input
                          placeholder={dealParam ? "Start conversation for this deal..." : "Type your message..."}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleNewConversationKeyPress}
                          className="flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none p-0"
                        />
                      </div>
                      <Button 
                        onClick={sendFirstMessage}
                        disabled={!newMessage.trim()}
                        className={`${colors.button} text-white rounded-full p-3 h-auto`}
                      >
                        <HiPaperAirplane className="w-5 h-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile: Facebook Messenger-style layout */}
        <div className="lg:hidden w-full h-full">
          {/* Conversation List - Mobile (full screen when no conversation selected) */}
          <div className={`h-full ${selectedConversation ? 'hidden' : 'block'}`}>
            <div className="bg-white h-full flex flex-col">
              <div className="p-2 border-b border-gray-200">
                <div className="relative">
                  <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 border-gray-300 ${colors.focus}`}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-3 p-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <div className="text-red-500 mb-4">
                      <HiChatBubbleLeftRight className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">{error}</p>
                    </div>
                    <Button 
                      onClick={fetchConversations}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <HiChatBubbleLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-500 text-sm mb-4">
                      {userType === 'brand' 
                        ? 'Start conversations by creating campaigns and sending deals to influencers.'
                        : 'Start conversations by accepting deals from brands.'
                      }
                    </p>
                    {searchTerm && (
                      <p className="text-gray-400 text-xs">
                        No conversations found for "{searchTerm}"
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {conversations.map((conversation) => {
                      return (
                      <div
                        key={conversation.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                          selectedConversation?.id === conversation.id ? colors.bg : ''
                        }`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="relative">
                              <div className={`w-12 h-12 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
                                <span className="text-sm font-bold text-white">
                                  {getDisplayAvatar(conversation)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {getDisplayName(conversation)}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {conversation.last_message?.created_at || conversation.last_message?.timestamp
                                    ? formatTime(conversation.last_message.created_at || conversation.last_message.timestamp!)
                                    : ''}
                                </span>
                              </div>
                              
                              <p className="text-xs text-gray-500 mb-2 truncate">
                                {dealParam && getInfluencerDealId(conversation)?.toString() === dealParam ? 
                                  `🎯 Deal #${dealParam}: ${conversation.deal_title}` : 
                                  conversation.deal_title
                                }
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-700 truncate flex-1">
                                  {conversation.last_message?.sender_type === userType ? (
                                    <span className="text-gray-500">You: </span>
                                  ) : ''}
                                  {conversation.last_message?.content || 'No messages yet'}
                                </p>
                                {conversation.unread_count > 0 && (
                                  <div className={`w-5 h-5 ${colors.unread} text-white text-xs rounded-full flex items-center justify-center ml-2 font-bold`}>
                                    {conversation.unread_count}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messaging Interface - Mobile (full screen when conversation selected) */}
          <div className={`h-full ${selectedConversation ? 'block' : 'hidden'}`}>
            {selectedConversation && (
              <div className="h-full flex flex-col bg-white">
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="p-2 text-gray-600 hover:text-gray-900"
                      >
                        <HiArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="relative">
                        <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-full flex items-center justify-center`}>
                          <span className="text-sm font-bold text-white">
                            {getDisplayAvatar(selectedConversation)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getDisplayName(selectedConversation)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {dealParam ? `Deal #${dealParam}: ${selectedConversation.deal_title}` : selectedConversation.deal_title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f0f0f0' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}>
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <GlobalLoader />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <HiChatBubbleLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No messages yet</p>
                        <p className="text-sm text-gray-400">Start the conversation below</p>
                      </div>
                    </div>
                  ) : (
                    messages.filter(message => message && typeof message === 'object').map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender_type === userType ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-xs">
                          <div
                            className={`px-4 py-2 rounded-2xl shadow-sm ${
                              message.sender_type === userType
                                ? `${colors.message} text-white rounded-br-md`
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content || 'No content'}</p>
                            <div className={`flex items-center mt-1 space-x-1 ${message.sender_type === userType ? 'justify-end' : 'justify-start'}`}>
                              <span className={`text-xs ${message.sender_type === userType ? colors.text : 'text-gray-500'}`}>
                                {formatTime(message.created_at)}
                              </span>
                              {message.sender_type === userType && (
                                <div className="flex items-center">
                                  {message.is_read ? (
                                    <div className="flex">
                                      <HiCheck className="w-3 h-3 text-blue-200" />
                                      <HiCheck className="w-3 h-3 text-blue-200 -ml-1" />
                                    </div>
                                  ) : (
                                    <HiCheck className={`w-3 h-3 ${colors.checkMark}`} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-3 bg-white border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-3 flex items-center">
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleInputKeyPress}
                        className="flex-1 border-0 bg-transparent focus:ring-0 focus:outline-none p-0"
                      />
                    </div>
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className={`${colors.button} text-white rounded-full p-3 h-auto`}
                    >
                      <HiPaperAirplane className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
