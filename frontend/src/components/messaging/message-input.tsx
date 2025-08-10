"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X, FileText, Image as ImageIcon } from "@/lib/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MessageInputProps {
  onSendMessage: (message: string, file?: File) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  isLoading,
  disabled = false,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const handleSend = async () => {
    if ((!message.trim() && !attachedFile) || isLoading || disabled) return;

    try {
      setError(null);
      await onSendMessage(message.trim(), attachedFile || undefined);
      setMessage("");
      setAttachedFile(null);
      onTypingStop();
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      setError("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("File type not supported. Please upload images, PDFs, or documents.");
      return;
    }

    setError(null);
    setAttachedFile(file);
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicators
    if (value.trim()) {
      onTypingStart();
    } else {
      onTypingStop();
    }

    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  if (disabled) {
    return (
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-500 text-center">
          This conversation is no longer active
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Error Message */}
      {error && (
        <div className="p-2">
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* File Attachment Preview */}
      {attachedFile && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center space-x-2">
            {getFileIcon(attachedFile)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(attachedFile.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeAttachment}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 md:p-4">
        <div className="flex items-end space-x-2">
          {/* File Attachment Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-2 h-auto flex-shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_FILE_TYPES.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Message Textarea */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isLoading}
              className="min-h-[40px] max-h-[120px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !attachedFile) || isLoading}
            size="sm"
            className="p-2 h-auto flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Character Count - Hidden on mobile */}
        <div className="hidden md:flex justify-between items-center mt-2">
          <div className="text-xs text-gray-500">
            {message.length > 0 && `${message.length} characters`}
          </div>
          <div className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}