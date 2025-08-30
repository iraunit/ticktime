"use client";

import { useState, useEffect, useRef } from "react";
import { Deal, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { HiPaperAirplane } from "react-icons/hi2";
import { MessageBubble } from "./message-bubble";
import { ConversationHeader } from "./conversation-header";
import { TypingIndicator } from "./typing-indicator";
import { ScrollToBottom } from "./scroll-to-bottom";

interface MessagingInterfaceProps {
  deal: Deal;
  className?: string;
}

export function MessagingInterface({ deal, className }: MessagingInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load messages for this deal
    loadMessages();
  }, [deal.id]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API call
      // const response = await api.get(`/deals/${deal.id}/messages/`);
      // setMessages(response.data);
      
      // Mock data for now
      setMessages([
        {
          id: 1,
          conversation: deal.id,
          sender: 'influencer',
          message: "Hi! I'm interested in your collaboration offer. Could you provide more details about the campaign requirements?",
          sent_at: new Date(Date.now() - 86400000).toISOString(),
          read_at: new Date(Date.now() - 86300000).toISOString()
        },
        {
          id: 2,
          conversation: deal.id,
          sender: 'brand',
          message: "Hello! Thanks for your interest. We'd love to have you create content showcasing our latest product line. The campaign focuses on authentic lifestyle content.",
          sent_at: new Date(Date.now() - 43200000).toISOString(),
          read_at: new Date(Date.now() - 43100000).toISOString()
        },
        {
          id: 3,
          conversation: deal.id,
          sender: 'influencer',
          message: "That sounds great! What's the timeline for content delivery?",
          sent_at: new Date(Date.now() - 21600000).toISOString(),
          read_at: undefined
        }
      ]);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      
      // TODO: Replace with actual API call
      // const response = await api.post(`/deals/${deal.id}/messages/`, {
      //   content: newMessage.trim()
      // });

      // Mock sending message
      const mockMessage: Message = {
        id: messages.length + 1,
        conversation: deal.id,
        sender: 'influencer', // This should be determined by current user role
        message: newMessage.trim(),
        sent_at: new Date().toISOString(),
        read_at: undefined
      };

      setMessages(prev => [...prev, mockMessage]);
      setNewMessage("");
      
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender === 'influencer'} // This should be based on current user role
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
            disabled={isSending}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <HiPaperAirplane className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <ScrollToBottom show={true} onClick={scrollToBottom} />
    </div>
  );
}
