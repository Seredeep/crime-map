'use client';

import { ChatWithParticipants } from '@/lib/types';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiArrowLeft, FiMapPin, FiSend, FiUsers } from 'react-icons/fi';

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'normal' | 'panic';
  isOwn: boolean;
  metadata?: {
    location?: { lat: number; lng: number; accuracy?: number; timestamp?: number; fallback?: boolean };
    address?: string;
  };
}

interface MobileChatViewProps {
  className?: string;
  onBack?: () => void;
}

const MobileChatView = ({ className = '', onBack }: MobileChatViewProps) => {
  const [chat, setChat] = useState<ChatWithParticipants | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);

  // Cargar el chat del usuario
  useEffect(() => {
    loadUserChat();
  }, []);

  const loadUserChat = async () => {
    try {
      const response = await fetch('/api/chat/mine');
      const result = await response.json();

      if (result.success && result.data) {
        setChat(result.data);
        // Cargar mensajes reales desde Firestore
        const messagesResponse = await fetch('/api/chat/firestore-messages');
        if (messagesResponse.ok) {
          const messagesResult = await messagesResponse.json();
          if (messagesResult.success && messagesResult.data && messagesResult.data.messages) {
            setMessages(messagesResult.data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
              isOwn: msg.userId === result.data._id
            })));
          } else {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar el chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        userId: 'current-user',
        userName: 'Tú',
        message: newMessage.trim(),
        timestamp: new Date(),
        type: 'normal',
        isOwn: true
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');

      // Aquí iría la lógica para enviar el mensaje al servidor
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center p-6">
          <FiUsers className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No tienes un chat asignado
          </h3>
          <p className="text-gray-500 mb-4">
            Completa tu perfil para unirte al chat de tu barrio
          </p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              Volver
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-900 flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
            )}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FiMapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">{chat.neighborhood}</h1>
              <p className="text-sm text-gray-400">
                {chat.participants.length} vecinos
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FiUsers className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Participants panel */}
      {showParticipants && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-800/30 border-b border-gray-700/50 p-4"
        >
          <h3 className="text-sm font-medium text-gray-300 mb-3">Participantes</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {chat.participants.map((participant) => (
              <div key={participant._id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {participant.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {participant.name} {participant.surname}
                  </p>
                  <p className="text-xs text-gray-400">
                    Manzana {participant.blockNumber}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-2">
                ¡Bienvenido al chat de {chat?.neighborhood}!
              </h3>
              <p className="text-gray-500 text-sm">
                Sé el primero en enviar un mensaje a tus vecinos
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => {
            const participant = chat.participants.find(p => p._id === message.userId);
            const participantProfileImage = participant?.profileImage;
            const participantNameInitial = participant?.name?.charAt(0) || 'U';

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'} items-end`}
              >
                {!message.isOwn && (
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-600 flex items-center justify-center flex-shrink-0">
                    {participantProfileImage ? (
                      <Image
                        src={participantProfileImage}
                        alt={message.userName}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-white">
                        {participantNameInitial}
                      </span>
                    )}
                  </div>
                )}
                <div className={`max-w-[80%] ${message.isOwn ? 'order-2' : 'order-1'}`}>
                  {!message.isOwn && (
                    <p className="text-xs text-gray-400 mb-1">
                      {message.userName}
                    </p>
                  )}
                  <div
                    className={`p-3 rounded-2xl ${
                      message.isOwn
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-700 text-gray-100 rounded-bl-md'
                    }`}
                  >
                    {message.type === 'panic' ? (
                      <div className="flex items-center space-x-2 text-red-100 mb-1">
                        <FiAlertTriangle className="w-4 h-4" />
                        <span className="font-semibold">¡ALERTA DE PÁNICO!</span>
                      </div>
                    ) : null}
                    <p className="text-sm">{message.message}</p>
                    {message.type === 'panic' && (
                      <p className="text-sm mt-1 text-red-200">
                        {message.metadata?.address || 'Ubicación GPS exacta no disponible'}
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${
                      message.isOwn ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Message input */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700/50 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full transition-all duration-200 ${
              newMessage.trim()
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileChatView;
