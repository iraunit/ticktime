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

  // API endpoints based on user type
  const getApiEndpoints = () => {
    return {
      conversations: userType === 'brand' ? '/brands/conversations/' : '/conversations/',
      // Use unified conversation-based endpoint for both roles
      messagesByConversation: (conversationId: number) => `/conversations/${conversationId}/messages/`,
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
      const response = await api.get(endpoints.conversations, {
        params: {
          search: searchTerm || undefined,
        },
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
    setIsLoadingMessages(true);
    try {
      console.log('Fetching messages for conversation:', conversation.id);
      const response = await api.get(endpoints.messagesByConversation(conversation.id));
      console.log('Messages response:', response.data);
      const messages = Array.isArray(response.data?.messages) ? response.data.messages : [];
      console.log('Setting messages:', messages);
      setMessages(messages);
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
      const response = await api.post(endpoints.messagesByConversation(selectedConversation.id), {
        content: newMessage.trim()
      });
      
      const created = response.data?.message_data;
      if (created && typeof created === 'object') {
        setMessages(prev => [...prev, created]);
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
    if (!newMessage.trim() || !targetParam || userType !== 'brand') return;
    
    try {
      const response = await api.post(endpoints.firstMessage!(targetParam), {
        content: newMessage.trim(),
      });
      setNewMessage("");
      
      // Refresh conversations and select newly created one
      await fetchConversations();
      const convId = response.data?.conversation_id;
      const created = (convId && (conversations.find(c => c.id === convId) || null)) || null;
      if (created) setSelectedConversation(created);
      else {
        // fallback: pick first matching influencer if appears after refresh
        const match = conversations.find((c: any) => (c as any).influencer_id?.toString() === targetParam);
        if (match) setSelectedConversation(match as any);
      }
      toast.success('Message sent. Conversation created.');
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast.error(error?.response?.data?.message || 'Failed to start conversation.');
    }
  };

  // Initial load of conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-select conversation based on target parameter
  useEffect(() => {
    if (!targetParam || conversations.length === 0) return;
    
    let match;
    if (userType === 'brand') {
      match = conversations.find((c: any) => (c as any).influencer_id?.toString() === targetParam);
    } else {
      match = conversations.find((c: any) => (c as any).brand_id?.toString() === targetParam);
    }
    
    if (match) {
      setSelectedConversation(match as any);
    }
  }, [conversations, targetParam]);

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
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
      const diffInHours = diffInMinutes / 60;
      const diffInDays = diffInHours / 24;
      
      if (diffInMinutes < 1) {
        return 'now';
      } else if (diffInMinutes < 60) {
        return `${Math.floor(diffInMinutes)}m`;
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      } else if (diffInDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
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
              Messages
            </h1>
            <p className="text-sm text-gray-500">
              {conversations.length} conversations
            </p>
          </div>
          
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

      <div className="flex-1 flex overflow-hidden">
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
                    console.log('Rendering conversation:', conversation);
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
                              {conversation.deal_title}
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
                          {selectedConversation.deal_title}
                        </p>
                        {/* Deal identifier: show human-friendly title only */}
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
                    {targetParam && userType === 'brand'
                      ? `Start a new conversation`
                      : 'Select a conversation'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {targetParam && userType === 'brand'
                      ? `Send the first message to create a conversation with this influencer.`
                      : 'Choose a conversation from the list to start messaging.'}
                  </p>
                  {targetParam && userType === 'brand' && (
                    <div className="flex items-center gap-3 max-w-md">
                      <div className="flex-1 bg-gray-100 rounded-full px-4 py-3 flex items-center">
                        <Input
                          placeholder="Type your message..."
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
                      console.log('Rendering mobile conversation:', conversation);
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
                                {conversation.deal_title}
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
                          {selectedConversation.deal_title}
                        </p>
                        {/* Deal identifier: show human-friendly title only */}
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
      </div>
    </div>
  );
}
