"use client";

import { useState, useEffect } from "react";
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
  HiArrowLeft
} from "react-icons/hi2";

interface Message {
  id: number;
  content: string;
  sender: 'brand' | 'influencer';
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: number;
  influencer_name: string;
  influencer_username: string;
  influencer_avatar?: string;
  deal: {
    id: number;
    campaign_title: string;
    status: string;
  };
  deal_title: string;
  last_message: {
    content: string;
    timestamp: string;
    sender: 'brand' | 'influencer';
  };
  unread_count: number;
  status: 'active' | 'archived';
  created_at: string;
}

export default function BrandMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    console.log('Fetching conversations...');
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/brands/conversations/', {
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

  const fetchMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await api.get(`/brands/conversations/${conversationId}/messages/`);
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
      const response = await api.post(`/brands/conversations/${selectedConversation.id}/messages/`, {
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, response.data.message_data]);
      setNewMessage("");
      
      // Update last message in conversations list
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: { content: newMessage.trim(), timestamp: new Date().toISOString(), sender: 'brand' } }
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
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      content_submitted: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };

    return (
      <Badge className={`${statusColors[status] || 'bg-gray-100 text-gray-800'} border-0 text-xs`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden p-3">
      <div className="h-full">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Messages
              </h1>
              <p className="text-sm text-gray-600">
                Communicate directly with influencers about your collaboration deals.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Total Conversations</p>
                <p className="text-xs font-medium text-gray-700">
                  {conversations.length} active
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchConversations}
                disabled={isLoading}
                className="border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 rounded-lg px-4 py-2"
              >
                <HiArrowPath className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>

        <div className="h-full flex gap-3">
          {/* Desktop: Two-column layout */}
          <div className="hidden lg:flex w-full gap-3">
            {/* Conversations List */}
            <div className="w-1/3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="overflow-y-auto h-full">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <GlobalLoader key={i} />
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
                  <p className="text-gray-500 mt-4 text-sm">
                    No conversations yet. Start conversations by sending deals to influencers.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {conversation.influencer_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-gray-900 truncate">
                                {conversation.influencer_name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.last_message.timestamp)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.influencer_username}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(conversation.deal.status)}
                              <span className="text-xs text-gray-500 truncate">
                                {conversation.deal_title}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-700 mt-2 truncate">
                              {conversation.last_message.sender === 'influencer' ? '' : 'You: '}
                              {conversation.last_message.content}
                            </p>
                          </div>
                        </div>
                        
                        {conversation.unread_count > 0 && (
                          <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ml-2">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

            {/* Messages Area */}
            <div className="w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {selectedConversation.influencer_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedConversation.influencer_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedConversation.deal_title}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedConversation.deal.status)}
                      <Button variant="ghost" size="sm">
                        <HiEllipsisVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        className={`flex ${message.sender === 'brand' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === 'brand'
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === 'brand' ? 'text-indigo-100' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                    >
                      <HiPaperAirplane className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <HiChatBubbleLeftRight className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
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
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="overflow-y-auto h-full">
                  {isLoading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <GlobalLoader key={i} />
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
                      <p className="text-gray-500 mt-4 text-sm">
                        No conversations yet. Start conversations by sending deals to influencers.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-white">
                                    {conversation.influencer_name.charAt(0)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-medium text-gray-900 truncate">
                                    {conversation.influencer_name}
                                  </h3>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(conversation.last_message.timestamp)}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-600 truncate">
                                  {conversation.influencer_username}
                                </p>
                                
                                <div className="flex items-center gap-2 mt-1">
                                  {getStatusBadge(conversation.deal.status)}
                                  <span className="text-xs text-gray-500 truncate">
                                    {conversation.deal_title}
                                  </span>
                                </div>
                                
                                <p className="text-sm text-gray-700 mt-2 truncate">
                                  {conversation.last_message.sender === 'influencer' ? '' : 'You: '}
                                  {conversation.last_message.content}
                                </p>
                              </div>
                            </div>
                            
                            {conversation.unread_count > 0 && (
                              <div className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center ml-2">
                                {conversation.unread_count}
                              </div>
                            )}
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
                <div className="relative h-full">
                  {/* Mobile back button */}
                  <div className="absolute top-3 left-3 z-10">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md border border-gray-200 hover:bg-white hover:shadow-lg transition-all duration-200"
                    >
                      <HiArrowLeft className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {selectedConversation.influencer_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {selectedConversation.influencer_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {selectedConversation.deal_title}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedConversation.deal.status)}
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                            className={`flex ${message.sender === 'brand' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.sender === 'brand'
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.sender === 'brand' ? 'text-indigo-100' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1"
                        />
                        <Button 
                          onClick={sendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
                        >
                          <HiPaperAirplane className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 