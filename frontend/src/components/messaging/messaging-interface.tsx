"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDealMessages } from "@/hooks/use-deals";
import { MessageBubble } from "./message-bubble";
import { MessageInput } from "./message-input";
import { ConversationHeader } from "./conversation-header";
import { TypingIndicator } from "./typing-indicator";
import { LoadingSpinner } from "./loading-spinner";
import { ScrollToBottom } from "./scroll-to-bottom";
import { Message, Deal } from "@/types";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HiExclamationTriangle } from "react-icons/hi2";

interface MessagingInterfaceProps {
  deal: Deal;
  className?: string;
}

export function MessagingInterface({ deal, className = "" }: MessagingInterfaceProps) {
  const { messages, sendMessage } = useDealMessages(deal.id);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // Auto-scroll to bottom when new messages arrive (only for initial load)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const messageList = Array.isArray(messages.data) ? messages.data : messages.data?.data;
    if (messageList && messageList.length > 0 && !hasScrolledToBottom) {
      scrollToBottom();
      setHasScrolledToBottom(true);
    }
  }, [messages.data, hasScrolledToBottom]);

  // Handle infinite scroll and scroll to bottom button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Show/hide scroll to bottom button
    setShowScrollToBottom(!isNearBottom);
    
    // Reset new messages count when scrolled to bottom
    if (isNearBottom && newMessagesCount > 0) {
      setNewMessagesCount(0);
    }

    // Check if scrolled to top for loading more messages
    const messageList = Array.isArray(messages.data) ? messages.data : messages.data?.data;
    if (scrollTop === 0 && !isLoadingMore && messageList && messageList.length > 0) {
      setIsLoadingMore(true);
      // In a real app, this would trigger loading more messages
      // For now, we'll just simulate loading
      setTimeout(() => {
        setIsLoadingMore(false);
      }, 1000);
    }
  }, [messages.data, isLoadingMore, newMessagesCount]);

  const handleScrollToBottom = () => {
    scrollToBottom();
    setShowScrollToBottom(false);
    setNewMessagesCount(0);
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handle sending messages
  const handleSendMessage = async (messageText: string, file?: File) => {
    try {
      await sendMessage.mutateAsync({
        message: messageText,
        file,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle typing indicators
  const handleTypingStart = () => {
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    const timeout = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
    
    setTypingTimeout(timeout);
  };

  const handleTypingStop = () => {
    setIsTyping(false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  if (messages.isLoading) {
    return (
      <Card className={`flex items-center justify-center h-96 ${className}`}>
        <LoadingSpinner />
      </Card>
    );
  }

  if (messages.isError) {
    return (
      <Card className={`p-6 ${className}`}>
        <Alert className="border-red-200 bg-red-50">
          <HiExclamationTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Failed to load messages. Please try again.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-[500px] md:h-[600px] relative ${className}`}>
      {/* Conversation Header */}
      <ConversationHeader deal={deal} />
      
      {/* Messages Container */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 relative"
      >
        {(() => {
          const messageList = Array.isArray(messages.data) ? messages.data : messages.data?.data;
          return messageList && messageList.length > 0 ? (
            <>
              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
              
              {messageList.map((message: Message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender === 'influencer'}
                />
              ))}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm">Start a conversation with the brand</p>
              </div>
            </div>
          );
        })()}
            
        
        {/* Typing Indicator */}
        {isTyping && (
          <TypingIndicator />
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <ScrollToBottom
        show={showScrollToBottom}
        onClick={handleScrollToBottom}
        unreadCount={newMessagesCount}
      />
      
      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        isLoading={sendMessage.isPending}
        disabled={deal.status === 'completed' || deal.status === 'cancelled'}
      />
    </Card>
  );
}