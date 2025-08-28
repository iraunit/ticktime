"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  HiUsers,
  HiCheckCircle,
  HiClock,
  HiArrowPath,
  HiEllipsisVertical,
  HiArrowLeft,
  HiCheck
} from "react-icons/hi2";
import { MainLayout } from "@/components/layout/main-layout";
import { RequireInfluencerAuth } from "@/components/auth/require-influencer-auth";

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
  deal: number; // This is the deal ID directly
  deal_title: string;
  brand_name: string;
  influencer_name: string;
  influencer_username: string;
  influencer_avatar?: string;
  influencer_id: number;
  last_message: {
    content: string;
    created_at?: string;
    timestamp?: string;
    sender_type: 'brand' | 'influencer';
  };
  unread_count: number;
  messages_count: number;
  created_at: string;
  updated_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [brandData, setBrandData] = useState<any>(null);
  const [isLoadingBrand, setIsLoadingBrand] = useState(false);
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  
  // Note: Brand parameter functionality not implemented in backend yet
  const brandParam = null;

  const fetchConversations = async () => {
    console.log('Fetching conversations...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/conversations/', {
        params: {
          search: searchTerm || undefined,
        },
        timeout: 10000, // 10 second timeout
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

  const fetchMessages = async (dealId: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await api.get(`/deals/${dealId}/messages/`);
      setMessages(response.data.messages || []);
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages.');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await api.post(`/deals/${selectedConversation.deal}/messages/`, {
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, response.data.message_data]);
      setNewMessage("");
      
      // Update last message in conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: { content: newMessage.trim(), created_at: new Date().toISOString(), sender_type: 'influencer' } }
          : conv
      ));
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message.');
    }
  };

  // Initial load of conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Note: Auto-select conversation by brand ID not implemented in backend yet
  // useEffect(() => {
  //   const brandId = params?.get('brand');
  //   if (!brandId) return;
  //   if (conversations.length === 0) return;
  //   const match = conversations.find((c: any) => (c as any).brand_id?.toString() === brandId);
  //   if (match) {
  //     setSelectedConversation(match as any);
  //   }
  // }, [conversations]);

  // Note: First message functionality not implemented in backend yet
  const sendFirstMessageToBrand = async () => {
    toast.error('Starting new conversations is not yet implemented.');
  };

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
      fetchMessages(selectedConversation.deal);
    }
  }, [selectedConversation]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    
    try {
      const date = new Date(timestamp);
      
      // Check if date is valid
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

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      content_submitted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} border-0 text-xs`}>
        {status?.replace('_', ' ') || 'Unknown'}
      </Badge>
    );
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
      sendFirstMessageToBrand();
    }
  };

  return (
    <RequireInfluencerAuth>
      <MainLayout showFooter={false}>
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
                      className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                        Start conversations by accepting deals from brands.
                      </p>
                      {searchTerm && (
                        <p className="text-gray-400 text-xs">
                          No conversations found for "{searchTerm}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <div>
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-purple-50 border-r-4 border-purple-500' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {(conversation.brand_name || '?').charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                                                <h3 className="font-semibold text-gray-900 truncate text-sm">
                                {conversation.brand_name || 'Brand'}
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
                                    {conversation.last_message?.sender_type === 'brand' ? '' : (
                                      <span className="text-gray-500">You: </span>
                                    )}
                                    {conversation.last_message?.content || 'No messages yet'}
                                  </p>
                                  {conversation.unread_count > 0 && (
                                    <div className="w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center ml-2 font-bold">
                                      {conversation.unread_count}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
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
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {(selectedConversation.brand_name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                      </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {selectedConversation.brand_name || 'Brand'}
                      </h3>
                            <p className="text-sm text-gray-500">
                              {selectedConversation.deal_title}
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
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'influencer' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="max-w-xs lg:max-w-md">
                              <div
                                className={`px-4 py-2 rounded-2xl shadow-sm ${
                                  message.sender_type === 'influencer'
                                    ? 'bg-purple-500 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                                <div className={`flex items-center mt-1 space-x-1 ${message.sender_type === 'influencer' ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-xs ${message.sender_type === 'influencer' ? 'text-purple-100' : 'text-gray-500'}`}>
                                    {formatTime(message.created_at)}
                                  </span>
                                  {message.sender_type === 'influencer' && (
                                    <div className="flex items-center">
                                      {message.is_read ? (
                                        <div className="flex">
                                          <HiCheck className="w-3 h-3 text-blue-200" />
                                          <HiCheck className="w-3 h-3 text-blue-200 -ml-1" />
                                        </div>
                                      ) : (
                                        <HiCheck className="w-3 h-3 text-purple-200" />
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
                          className="bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 h-auto"
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
                        Select a conversation
                      </h3>
                                                                    <p className="text-gray-500 mb-4">
                        Choose a conversation from the list to start messaging.
                      </p>
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
                        className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                          Start conversations by accepting deals from brands.
                        </p>
                        {searchTerm && (
                          <p className="text-gray-400 text-xs">
                            No conversations found for "{searchTerm}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                              selectedConversation?.id === conversation.id ? 'bg-purple-50' : ''
                            }`}
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="relative">
                                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                                                                <span className="text-sm font-bold text-white">
                              {(conversation.brand_name || '?').charAt(0).toUpperCase()}
                            </span>
                                  </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                      {conversation.brand_name || 'Brand'}
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
                                      {conversation.last_message?.sender_type === 'brand' ? '' : (
                                        <span className="text-gray-500">You: </span>
                                      )}
                                      {conversation.last_message?.content || 'No messages yet'}
                                    </p>
                                    {conversation.unread_count > 0 && (
                                      <div className="w-5 h-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center ml-2 font-bold">
                                        {conversation.unread_count}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
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
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {(selectedConversation.brand_name || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {selectedConversation.brand_name || 'Brand'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {selectedConversation.deal_title}
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
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'influencer' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="max-w-xs">
                              <div
                                className={`px-4 py-2 rounded-2xl shadow-sm ${
                                  message.sender_type === 'influencer'
                                    ? 'bg-purple-500 text-white rounded-br-md'
                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{message.content}</p>
                                <div className={`flex items-center mt-1 space-x-1 ${message.sender_type === 'influencer' ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-xs ${message.sender_type === 'influencer' ? 'text-purple-100' : 'text-gray-500'}`}>
                                    {formatTime(message.created_at)}
                                  </span>
                                  {message.sender_type === 'influencer' && (
                                    <div className="flex items-center">
                                      {message.is_read ? (
                                        <div className="flex">
                                          <HiCheck className="w-3 h-3 text-blue-200" />
                                          <HiCheck className="w-3 h-3 text-blue-200 -ml-1" />
                                        </div>
                                      ) : (
                                        <HiCheck className="w-3 h-3 text-purple-200" />
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
                          className="bg-purple-500 hover:bg-purple-600 text-white rounded-full p-3 h-auto"
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
      </MainLayout>
    </RequireInfluencerAuth>
  );
}