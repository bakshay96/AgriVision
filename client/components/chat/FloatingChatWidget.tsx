'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Minimize2, Maximize2, Image as ImageIcon, Loader2, Smile, Paperclip, File, GripVertical } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, uploadApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cn, resolveUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { showErrorToast } from '@/lib/errorHandler';
import type { FloatingChatSession } from '@/store/useChatStore';

// Emoji picker data
const EMOJI_CATEGORIES = {
  'Faces': ['😀', '😊', '😎', '🤝', '👍', '👎', '🙏', '💪', '🎉', '✅', '❌', '⚠️', '📦', '🚚', '🌾', '🌱'],
  'Hands': ['👋', '🤝', '👍', '👎', '👏', '🙌', '🤲', '🙏', '✌️', '🤟', '👌', '🤏'],
  'Objects': ['📦', '🚚', '📱', '💰', '📋', '📝', '🗓️', '⏰', '🔒', '🔑', '💡', '🎯'],
};

interface FloatingChatWidgetProps {
  session: FloatingChatSession;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onFocus: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
}

export default function FloatingChatWidget({
  session,
  onClose,
  onMinimize,
  onRestore,
  onFocus,
  onPositionChange,
}: FloatingChatWidgetProps) {
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{ url: string; type: 'image' | 'file'; name?: string; preview?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const widgetStartPos = useRef({ x: 0, y: 0 });

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current && !session.isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.messages, session.isMinimized]);

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    dragStartPos.current = { x: clientX, y: clientY };
    widgetStartPos.current = session.position;
    
    onFocus();
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - dragStartPos.current.x;
      const deltaY = clientY - dragStartPos.current.y;
      
      const newX = Math.max(0, Math.min(window.innerWidth - 360, widgetStartPos.current.x + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 100, widgetStartPos.current.y + deltaY));
      
      onPositionChange({ x: newX, y: newY });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, onPositionChange]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) => ordersApi.sendMessage(session.orderId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-orders'] });
      setNewMessage('');
      setPendingMedia([]);
      toast.success('Message sent');
    },
    onError: (error) => showErrorToast(error, 'Send Failed'),
  });

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (pendingMedia.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setUploadingMedia(true);
    const newMedia: { url: string; type: 'image' | 'file'; name?: string; preview?: string }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImage = file.type.startsWith('image/');
        
        if (!isImage && !file.type.startsWith('video/') && !file.type.startsWith('application/')) {
          continue;
        }

        if (file.size > (isImage ? 5 : 20) * 1024 * 1024) {
          toast.error(`${file.name} exceeds size limit`);
          continue;
        }

        let preview: string | undefined;
        if (isImage) {
          preview = URL.createObjectURL(file);
        }

        const response = await uploadApi.uploadImage(file, 'chat');
        newMedia.push({
          url: response.data.data.url,
          type: isImage ? 'image' : 'file',
          name: file.name,
          preview,
        });
      }

      setPendingMedia(prev => [...prev, ...newMedia]);
      toast.success(`${newMedia.length} file(s) ready`);
    } catch (error) {
      showErrorToast(error, 'Upload Failed');
    } finally {
      setUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() && pendingMedia.length === 0) return;
    
    let messageToSend = newMessage.trim();
    pendingMedia.forEach(media => {
      const tag = media.type === 'image' ? `[Image: ${media.url}]` : `[File: ${media.url}:${media.name || 'file'}]`;
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

  // Parse message content
  const parseMessageContent = (message: string) => {
    const images: string[] = [];
    const files: { url: string; name: string }[] = [];
    
    const imageRegex = /\[Image:\s*(https?:\/\/[^\]\s]+)\]/g;
    let match;
    while ((match = imageRegex.exec(message)) !== null) {
      images.push(match[1]);
    }
    
    const fileRegex = /\[File:\s*(https?:\/\/[^\]\s]+):([^\]]+)\]/g;
    while ((match = fileRegex.exec(message)) !== null) {
      files.push({ url: match[1], name: match[2] });
    }
    
    const text = message.replace(imageRegex, '').replace(fileRegex, '').trim();
    return { text, images, files };
  };

  return (
    <motion.div
      ref={widgetRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed',
        left: session.position.x,
        top: session.position.y,
        zIndex: session.zIndex,
      }}
      className={cn(
        "w-[350px] rounded-2xl shadow-2xl overflow-hidden",
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700",
        session.isMinimized ? "h-auto" : "h-[480px]",
        "flex flex-col"
      )}
      onClick={onFocus}
    >
      {/* Drag Handle Header */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={cn(
          "flex items-center justify-between px-3 py-2 cursor-move select-none",
          "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
          "rounded-t-2xl"
        )}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 opacity-70" />
          <div className="p-1.5 bg-white/20 rounded-lg">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate max-w-[150px]">
              {session.otherPartyName || (session.otherPartyRole === 'FARMER' ? 'Farmer' : 'Buyer')}
            </p>
            <p className="text-xs opacity-80 truncate">#{session.orderNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onMinimize(); }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Minimize"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Minimized View */}
      {session.isMinimized ? (
        <div 
          onClick={(e) => { e.stopPropagation(); onRestore(); }}
          className="p-3 text-center text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="flex items-center justify-center gap-2">
            <Maximize2 className="h-4 w-4" />
            <span>Click to expand</span>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs">
              {session.messages.length} messages
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-800"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}
          >
            {session.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Start a conversation</p>
              </div>
            ) : (
              session.messages.map((msg, idx) => {
                const senderId = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;
                const isCurrentUser = senderId === currentUserId;
                const { text, images, files } = parseMessageContent(msg.message);

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      isCurrentUser ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "px-3 py-1.5 rounded-2xl text-sm",
                      isCurrentUser
                        ? "bg-emerald-500 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-sm shadow-sm"
                    )}>
                      {text && <p className="break-words">{text}</p>}
                      {images.length > 0 && (
                        <div className="mt-1 grid gap-1">
                          {images.map((img, imgIdx) => (
                            <img
                              key={imgIdx}
                              src={img}
                              alt=""
                              className="max-w-full h-auto max-h-32 rounded-lg object-cover"
                              onError={() => setImageErrors(prev => new Set(prev).add(img))}
                            />
                          ))}
                        </div>
                      )}
                      {files.length > 0 && files.map((f, fIdx) => (
                        <a key={fIdx} href={f.url} target="_blank" rel="noopener noreferrer" 
                          className="flex items-center gap-1 mt-1 text-xs underline opacity-80">
                          <File className="h-3 w-3" /> {f.name}
                        </a>
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Pending Media */}
          {pendingMedia.length > 0 && (
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600">
              <div className="flex flex-wrap gap-1">
                {pendingMedia.map((m, idx) => (
                  <div key={idx} className="relative">
                    {m.type === 'image' ? (
                      <img src={m.preview || m.url} alt="" className="h-12 w-12 object-cover rounded border border-emerald-500" />
                    ) : (
                      <div className="h-12 w-12 bg-slate-200 dark:bg-slate-600 rounded flex items-center justify-center">
                        <File className="h-4 w-4" />
                      </div>
                    )}
                    <button
                      onClick={() => setPendingMedia(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute bottom-full left-0 right-0 mb-1 p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg"
                >
                  {Object.entries(EMOJI_CATEGORIES).map(([cat, emojis]) => (
                    <div key={cat} className="mb-1">
                      <p className="text-[9px] font-semibold text-slate-400 mb-0.5">{cat}</p>
                      <div className="flex flex-wrap gap-0.5">
                        {emojis.map(e => (
                          <button key={e} onClick={() => addEmoji(e)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-base">
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={cn("p-1.5 rounded-full", showEmojiPicker ? "text-amber-500" : "text-slate-400")}
              >
                <Smile className="h-4 w-4" />
              </button>

              <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc" multiple onChange={handleFileUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingMedia}
                className="p-1.5 text-slate-400 hover:text-blue-500 rounded-full"
              >
                {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message..."
                className="flex-1 px-3 py-1.5 text-sm rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={sendMessageMutation.isPending}
              />

              <button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && pendingMedia.length === 0) || sendMessageMutation.isPending}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  (newMessage.trim() || pendingMedia.length > 0)
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                )}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
