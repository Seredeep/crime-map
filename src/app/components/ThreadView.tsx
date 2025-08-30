'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FiArrowLeft, FiSend } from 'react-icons/fi';
import { Message } from '@/lib/services/chat/types';
import { formatHoursMinutes } from '@/lib/utils/formatting/dateTime';
import LazyImage from './LazyImage';

interface ThreadViewProps {
  threadId: string;
  messages: Message[];
  onClose: () => void;
  onSendMessage: (message: string, threadId: string) => void;
  currentUserId: string;
  threadStarter: Message;
}

export default function ThreadView({
  threadId,
  messages,
  onClose,
  onSendMessage,
  currentUserId,
  threadStarter,
}: ThreadViewProps) {
  const t = useTranslations('Chat');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage, threadId);
      setNewMessage('');
      setReplyingTo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (date: Date | string) => formatHoursMinutes(date, 'es-ES');

  return (
    <div className="flex flex-col h-full  text-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-800 mr-2"
          aria-label={t('closeThread')}
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">{t('thread')}</h2>
      </div>

      {/* Thread Starter */}
      <div className="p-4 border-b border-gray-800 bg-gray-800/30">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {(
              (threadStarter as any).senderProfileImage ||
              threadStarter.metadata?.userImage
            ) ? (
              <LazyImage
                src={(threadStarter as any).senderProfileImage || threadStarter.metadata?.userImage}
                alt={`${threadStarter.userName}'s profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                {threadStarter.userName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {threadStarter.userName}
              </span>
              <span className="text-xs text-gray-400">
                {formatMessageTime(threadStarter.timestamp)}
              </span>
            </div>
            <p className="text-sm mt-1">{threadStarter.message}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isOwn ? 'justify-end' : ''}`}
          >
            {!message.isOwn && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                {((message as any).senderProfileImage || message.metadata?.userImage) ? (
                  <LazyImage
                    src={(message as any).senderProfileImage || message.metadata?.userImage}
                    alt={`${message.userName}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                    {message.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                message.isOwn
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-800 text-white rounded-bl-none'
              }`}
            >
              {!message.isOwn && (
                <div className="text-xs font-medium text-blue-300">
                  {message.userName}
                </div>
              )}
              <div className="text-sm">{message.message}</div>
              <div
                className={`text-xs mt-1 ${
                  message.isOwn ? 'text-blue-200' : 'text-gray-400'
                }`}
              >
                {formatMessageTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-gray-800 rounded-full px-4 py-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('writeMessage')}
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-gray-400 text-sm"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="p-2 rounded-full bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={t('send')}
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
