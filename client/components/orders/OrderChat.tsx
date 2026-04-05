'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Image as ImageIcon, Loader2, ChevronDown, ChevronUp, X, Smile, Paperclip, Film, File, Check, CheckCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, uploadApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cn, resolveUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';

// Emoji picker data
const EMOJI_CATEGORIES = {
  'Faces': ['😀', '😊', '😎', '🤝', '👍', '👎', '🙏', '💪', '🎉', '✅', '❌', '⚠️', '📦', '🚚', '🌾', '🌱'],
  'Hands': ['👋', '🤝', '👍', '👎', '👏', '🙌', '🤲', '🙏', '✌️', '🤟', '👌', '🤏'],
  'Objects': ['📦', '🚚', '📱', '💰', '📋', '📝', '🗓️', '⏰', '🔒', '🔑', '💡', '🎯'],
};

interface Message {
  senderId: string | { _id: string };
  senderName?: string;
  senderRole?: string;
  message: string;
  timestamp: string;
  imageUrl?: string;
}

interface OrderChatProps {
  orderId: string;
  orderNumber: string;
  messages: Message[];
  otherPartyName?: string;
  otherPartyRole: 'FARMER' | 'BUYER';
  isExpanded?: boolean;
  onToggle?: () => void;
}

interface PendingMedia {
  url: string;
  type: 'image' | 'video' | 'file';
  name?: string;
  preview?: string;
}

export default function OrderChat({
  orderId,
  orderNumber,
  messages,
  otherPartyName,
  otherPartyRole,
  isExpanded = true,
  onToggle,
}: OrderChatProps) {
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [internalExpanded, setInternalExpanded] = useState(isExpanded);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use external control if provided, otherwise use internal state
  const expanded = onToggle ? isExpanded : internalExpanded;
  const handleToggle = onToggle || (() => setInternalExpanded(prev => !prev));

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (expanded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, expanded]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => ordersApi.sendMessage(orderId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-orders'] });
      setNewMessage('');
      setPendingMedia([]);
      toast.success('Message sent');
    },
    onError: (error) => showErrorToast(error, 'Send Failed'),
  });

  // Handle file upload (images, videos, documents)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validate total files (max 5 at once)
    if (pendingMedia.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setUploadingMedia(true);
    const newMedia: PendingMedia[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type and size
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const isFile = !isImage && !isVideo;

        if (!isImage && !isVideo && !isFile) {
          toast.error(`${file.name} is not a supported file type`);
          continue;
        }

        // Max sizes: 5MB for images, 20MB for videos, 10MB for files
        const maxSize = isImage ? 5 : isVideo ? 20 : 10;
        if (file.size > maxSize * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${maxSize}MB limit`);
          continue;
        }

        // Create preview for images
        let preview: string | undefined;
        if (isImage) {
          preview = URL.createObjectURL(file);
        }

        // Upload to S3
        const response = await uploadApi.uploadImage(file, 'chat');
        const url = response.data.data.url;

        newMedia.push({
          url,
          type: isImage ? 'image' : isVideo ? 'video' : 'file',
          name: file.name,
          preview,
        });
      }

      setPendingMedia(prev => [...prev, ...newMedia]);
      toast.success(`${newMedia.length} file(s) ready to send`);
    } catch (error) {
      showErrorToast(error, 'Upload Failed');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove pending media
  const removePendingMedia = (index: number) => {
    setPendingMedia(prev => {
      const newMedia = [...prev];
      if (newMedia[index].preview) {
        URL.revokeObjectURL(newMedia[index].preview!);
      }
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && pendingMedia.length === 0) return;
    
    // Build message with all media
    let messageToSend = newMessage.trim();
    
    pendingMedia.forEach(media => {
      const tag = media.type === 'image' 
        ? `[Image: ${media.url}]` 
        : media.type === 'video'
        ? `[Video: ${media.url}]`
        : `[File: ${media.url}:${media.name || 'file'}]`;
      
      messageToSend = messageToSend ? `${messageToSend}\n${tag}` : tag;
    });

    sendMessageMutation.mutate(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
    setShowEmojiPicker(false);
  };

  const currentUserId = user?._id?.toString();
  const otherPartyLabel = otherPartyRole === 'FARMER' ? 'Farmer' : 'Buyer';

  // Parse message content - extracts all media URLs and text
  const parseMessageContent = (message: string) => {
    const images: string[] = [];
    const videos: string[] = [];
    const files: { url: string; name: string }[] = [];
    
    // Extract images: [Image: url]
    const imageRegex = /\[Image:\s*(https?:\/\/[^\]\s]+)\]/g;
    let match;
    while ((match = imageRegex.exec(message)) !== null) {
      images.push(match[1]);
    }
    
    // Extract videos: [Video: url]
    const videoRegex = /\[Video:\s*(https?:\/\/[^\]\s]+)\]/g;
    while ((match = videoRegex.exec(message)) !== null) {
      videos.push(match[1]);
    }
    
    // Extract files: [File: url:name]
    const fileRegex = /\[File:\s*(https?:\/\/[^\]\s]+):([^\]]+)\]/g;
    while ((match = fileRegex.exec(message)) !== null) {
      files.push({ url: match[1], name: match[2] });
    }
    
    // Get text without media tags
    let text = message
      .replace(imageRegex, '')
      .replace(videoRegex, '')
      .replace(fileRegex, '')
      .trim();
    
    return { text, images, videos, files };
  };

  // Handle image load error
  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      {/* Header */}
      <div
        onClick={handleToggle}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 cursor-pointer hover:from-emerald-100 hover:to-blue-100 dark:hover:from-emerald-900/30 dark:hover:to-blue-900/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">
            <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 dark:text-white text-sm">Order Chat</span>
            {messages.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Chat with {otherPartyName || otherPartyLabel}
            </span>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-green-600 dark:text-green-400">Online</span>
            </div>
          </div>
          <div className="p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-sm">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Chat Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Messages */}
            <div className="h-72 sm:h-80 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-800/50 dark:to-slate-900"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                  <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-3">
                    <MessageSquare className="h-8 w-8 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs mt-1 text-center px-4">Start a conversation with the {otherPartyLabel.toLowerCase()}</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const senderId = typeof msg.senderId === 'string' 
                    ? msg.senderId 
                    : msg.senderId._id;
                  const isCurrentUser = senderId === currentUserId;
                  const senderLabel = msg.senderRole
                    ? (msg.senderRole === 'FARMER' ? '🌾 Farmer' : '🛒 Buyer')
                    : (isCurrentUser ? 'You' : otherPartyLabel);
                  const displayName = msg.senderName || (isCurrentUser ? user?.name : otherPartyName) || senderLabel;
                  const { text, images, videos, files } = parseMessageContent(msg.message);
                  const hasMedia = images.length > 0 || videos.length > 0 || files.length > 0;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex flex-col max-w-[90%] sm:max-w-[75%]",
                        isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      {/* Sender info */}
                      <div className={cn(
                        "flex items-center gap-2 mb-1",
                        isCurrentUser ? "flex-row-reverse" : ""
                      )}>
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                          isCurrentUser 
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        )}>
                          {displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className={cn(
                          "text-xs font-medium",
                          isCurrentUser 
                            ? "text-emerald-600 dark:text-emerald-400" 
                            : "text-blue-600 dark:text-blue-400"
                        )}>
                          {displayName}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString('en-IN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      {/* Message bubble - WhatsApp style */}
                      <div className={cn(
                        "relative rounded-2xl text-sm max-w-full overflow-hidden",
                        isCurrentUser
                          ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-sm"
                          : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm shadow-md border border-slate-100 dark:border-slate-600"
                      )}>
                        {/* Image Grid - WhatsApp style */}
                        {images.length > 0 && (
                          <div className={cn(
                            "grid gap-1 p-1",
                            images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                          )}>
                            {images.map((imgUrl, imgIdx) => (
                              <div 
                                key={imgIdx} 
                                className={cn(
                                  "relative overflow-hidden",
                                  images.length === 1 ? "max-w-[280px]" : ""
                                )}
                              >
                                {imageErrors.has(imgUrl) ? (
                                  <div className="h-32 flex items-center justify-center bg-slate-200 dark:bg-slate-600 rounded-lg">
                                    <div className="text-center">
                                      <ImageIcon className="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500 mb-1" />
                                      <span className="text-xs text-slate-500 dark:text-slate-400">Image unavailable</span>
                                    </div>
                                  </div>
                                ) : (
                                  <img 
                                    src={imgUrl} 
                                    alt="Shared image" 
                                    className={cn(
                                      "w-full object-cover rounded-lg",
                                      images.length === 1 ? "max-h-64" : "h-32"
                                    )}
                                    onError={() => handleImageError(imgUrl)}
                                    loading="lazy"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Videos */}
                        {videos.length > 0 && (
                          <div className="p-1 space-y-1">
                            {videos.map((videoUrl, vidIdx) => (
                              <div key={vidIdx} className="relative rounded-lg overflow-hidden bg-black">
                                <video 
                                  src={videoUrl} 
                                  controls 
                                  className="w-full max-h-48 rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Files */}
                        {files.length > 0 && (
                          <div className="p-2 space-y-1">
                            {files.map((file, fileIdx) => (
                              <a
                                key={fileIdx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg border",
                                  isCurrentUser 
                                    ? "bg-emerald-600/50 border-emerald-400 text-white"
                                    : "bg-slate-100 dark:bg-slate-600 border-slate-200 dark:border-slate-500"
                                )}
                              >
                                <File className="h-5 w-5 shrink-0" />
                                <span className="text-sm truncate flex-1">{file.name}</span>
                                <ExternalLinkIcon className="h-4 w-4 shrink-0 opacity-60" />
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Text message */}
                        {text && (
                          <div className={cn(
                            "px-3 py-2",
                            hasMedia ? "pt-2" : ""
                          )}>
                            <p className="break-words whitespace-pre-wrap">{text}</p>
                          </div>
                        )}

                        {/* Message tail - WhatsApp style */}
                        <div className={cn(
                          "absolute bottom-0 w-3 h-3",
                          isCurrentUser 
                            ? "right-0 translate-x-1 bg-emerald-600"
                            : "left-0 -translate-x-1 bg-white dark:bg-slate-700"
                        )}
                        style={{
                          clipPath: isCurrentUser 
                            ? 'polygon(0 0, 100% 0, 100% 100%)' 
                            : 'polygon(0 0, 100% 0, 0 100%)'
                        }}
                        />
                      </div>

                      {/* Read receipts */}
                      {isCurrentUser && (
                        <div className="flex items-center justify-end mt-0.5 gap-1">
                          <CheckCheck className="h-3 w-3 text-emerald-500" />
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Pending Media Preview - WhatsApp style */}
            {pendingMedia.length > 0 && (
              <div className="px-3 sm:px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {pendingMedia.map((media, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      {media.type === 'image' ? (
                        <div className="relative">
                          <img 
                            src={media.preview || media.url} 
                            alt="Pending"
                            className="h-20 w-20 object-cover rounded-lg border-2 border-emerald-500"
                          />
                          <button
                            onClick={() => removePendingMedia(idx)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : media.type === 'video' ? (
                        <div className="relative h-20 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center border-2 border-purple-500">
                          <Film className="h-6 w-6 text-purple-500" />
                          <button
                            onClick={() => removePendingMedia(idx)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="relative h-20 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center border-2 border-blue-500 p-2">
                          <File className="h-5 w-5 text-blue-500 mb-1" />
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 truncate w-full text-center">
                            {media.name}
                          </span>
                          <button
                            onClick={() => removePendingMedia(idx)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {pendingMedia.length} file(s) ready to send
                </p>
              </div>
            )}

            {/* Input Area - WhatsApp style */}
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-2 p-3 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-lg"
                  >
                    {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                      <div key={category} className="mb-2 last:mb-0">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">{category}</p>
                        <div className="flex flex-wrap gap-1">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addEmoji(emoji)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-xl transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Row - WhatsApp style */}
              <div className="flex items-end gap-1 sm:gap-2">
                {/* Emoji Button */}
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    showEmojiPicker 
                      ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20" 
                      : "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  )}
                  title="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>

                {/* Attachment Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingMedia}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors disabled:opacity-50"
                  title="Attach file"
                >
                  {uploadingMedia ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </button>

                {/* Text Input - WhatsApp style rounded input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={pendingMedia.length > 0 ? "Add a message (optional)..." : "Type a message..."}
                    className="w-full px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                    disabled={sendMessageMutation.isPending}
                  />
                </div>

                {/* Send Button - WhatsApp style */}
                <button
                  onClick={handleSendMessage}
                  disabled={(newMessage.trim() === '' && pendingMedia.length === 0) || sendMessageMutation.isPending}
                  className={cn(
                    "p-2.5 rounded-full transition-all shadow-sm",
                    (newMessage.trim() || pendingMedia.length > 0)
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                  )}
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Security Notice */}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center flex items-center justify-center gap-1">
                <span>🔒</span> End-to-end encrypted • Messages are private
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// External link icon component
function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
