"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  HiChatBubbleLeftRight, 
  HiMagnifyingGlass,
  HiPaperAirplane,
  HiUsers,
  HiCheckCircle,
  HiClock
} from "react-icons/hi2";

// Mock data for conversations
const mockConversations = [
  {
    id: 1,
    influencer: {
      name: "Sarah Johnson",
      username: "@sarahjohnson",
      avatar: null,
      isOnline: true
    },
    deal: "Summer Collection 2024",
    lastMessage: {
      content: "I've uploaded the content for review. Please let me know if you need any changes!",
      timestamp: "2024-01-20T14:30:00Z",
      sender: "influencer"
    },
    unreadCount: 2,
    status: "active"
  },
  {
    id: 2,
    influencer: {
      name: "Mike Chen",
      username: "@mikechenfit",
      avatar: null,
      isOnline: false
    },
    deal: "Fitness Equipment Launch",
    lastMessage: {
      content: "Thanks for the feedback! I'll make those adjustments and resubmit by tomorrow.",
      timestamp: "2024-01-20T10:15:00Z",
      sender: "influencer"
    },
    unreadCount: 0,
    status: "pending"
  },
  {
    id: 3,
    influencer: {
      name: "Emma Wilson",
      username: "@emmawilson",
      avatar: null,
      isOnline: true
    },
    deal: "Tech Review Series",
    lastMessage: {
      content: "Perfect! The content looks great. We'll proceed with the payment as discussed.",
      timestamp: "2024-01-19T16:45:00Z",
      sender: "brand"
    },
    unreadCount: 0,
    status: "completed"
  }
];

const mockMessages = [
  {
    id: 1,
    content: "Hi! I'm excited to work on this campaign. When would you like me to start creating the content?",
    timestamp: "2024-01-20T10:00:00Z",
    sender: "influencer"
  },
  {
    id: 2,
    content: "Hello Sarah! We're excited to work with you too. You can start creating content anytime. The deadline is February 15th.",
    timestamp: "2024-01-20T10:30:00Z",
    sender: "brand"
  },
  {
    id: 3,
    content: "Great! I'll have the first draft ready by next week. Should I send it for review before posting?",
    timestamp: "2024-01-20T11:00:00Z",
    sender: "influencer"
  },
  {
    id: 4,
    content: "Yes, please send everything for review first. We'll provide feedback within 24 hours.",
    timestamp: "2024-01-20T11:15:00Z",
    sender: "brand"
  },
  {
    id: 5,
    content: "I've uploaded the content for review. Please let me know if you need any changes!",
    timestamp: "2024-01-20T14:30:00Z",
    sender: "influencer"
  }
];

export default function BrandMessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConversations = mockConversations.filter(conv =>
    conv.influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.deal.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would send the message to the backend
      console.log("Sending message:", newMessage);
      setNewMessage("");
    }
  };

  const totalUnread = mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-2">
            Communicate with influencers about your campaigns
          </p>
        </div>
        {totalUnread > 0 && (
          <Badge className="bg-red-100 text-red-800">
            {totalUnread} unread message{totalUnread !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HiChatBubbleLeftRight className="w-5 h-5" />
              Conversations
            </CardTitle>
            <div className="relative">
              <HiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedConversation.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {conversation.influencer.avatar ? (
                          <img 
                            src={conversation.influencer.avatar} 
                            alt={conversation.influencer.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium text-sm">
                            {conversation.influencer.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      {conversation.influencer.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.influencer.name}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">{conversation.deal}</p>
                      <p className="text-xs text-gray-600 truncate">
                        {conversation.lastMessage.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(conversation.lastMessage.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {selectedConversation.influencer.avatar ? (
                        <img 
                          src={selectedConversation.influencer.avatar} 
                          alt={selectedConversation.influencer.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {selectedConversation.influencer.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    {selectedConversation.influencer.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.influencer.name}
                    </h3>
                    <p className="text-sm text-gray-500">{selectedConversation.deal}</p>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  {mockMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'brand' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'brand'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'brand' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <HiPaperAirplane className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <HiChatBubbleLeftRight className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
} 