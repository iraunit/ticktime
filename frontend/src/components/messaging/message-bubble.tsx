"use client";

import { Message } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Download, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const [imageError, setImageError] = useState(false);
  
  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <FileText className="w-4 h-4" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const isImage = (fileName?: string) => {
    if (!fileName) return false;
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs md:max-w-md lg:max-w-lg ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Sender Badge */}
        {!isOwn && (
          <Badge variant="secondary" className="mb-1 text-xs">
            Brand
          </Badge>
        )}
        
        {/* Message Bubble */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
          }`}
        >
          {/* Text Message */}
          {message.message && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.message}
            </p>
          )}
          
          {/* File Attachment */}
          {message.file_url && message.file_name && (
            <div className="mt-2">
              {isImage(message.file_name) && !imageError ? (
                <div className="relative">
                  <Image
                    src={message.file_url}
                    alt={message.file_name}
                    width={200}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                    onError={() => setImageError(true)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => handleDownload(message.file_url!, message.file_name!)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`flex items-center space-x-2 p-2 rounded border ${
                    isOwn
                      ? 'bg-blue-700 border-blue-500'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  {getFileIcon(message.file_name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {message.file_name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`p-1 ${
                      isOwn
                        ? 'hover:bg-blue-800 text-blue-100'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                    onClick={() => handleDownload(message.file_url!, message.file_name!)}
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Message Info */}
        <div className={`flex items-center mt-1 space-x-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500">
            {formatTime(message.sent_at)}
          </span>
          
          {/* Message Status (only for own messages) */}
          {isOwn && (
            <div className="flex items-center">
              {message.read_at ? (
                <CheckCheck className="w-3 h-3 text-blue-600" />
              ) : (
                <Check className="w-3 h-3 text-gray-400" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}