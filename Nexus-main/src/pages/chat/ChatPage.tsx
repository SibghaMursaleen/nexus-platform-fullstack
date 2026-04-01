import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile, MessageCircle } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../lib/socket';
import { getMessagesBetweenUsers, getConversationsForUser, sendMessage as sendMockMessage } from '../../data/messages';
import { findUserById } from '../../data/users';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [chatPartner, setChatPartner] = useState<any>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  // Real-time call listener
  useEffect(() => {
    if (!currentUser) return;
    socket.connect();
    // We keep the socket connection for signaling even in mock mode
    return () => {
      // socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      const mockConversations = getConversationsForUser(currentUser.id);
      setConversations(mockConversations);
    }
  }, [currentUser]);
  
  useEffect(() => {
    if (currentUser && userId) {
      // Load mock history
      const history = getMessagesBetweenUsers(currentUser.id, userId);
      setMessages(history);
      
      const partner = findUserById(userId);
      setChatPartner(partner);
    }
  }, [currentUser, userId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userId) return;
    
    // Use mock message sender
    const sentMsg = sendMockMessage({
      senderId: currentUser.id,
      receiverId: userId,
      content: newMessage
    });
    
    setMessages([...messages, sentMsg]);
    setNewMessage('');
    
    // Still emit via socket so real-time features work if the other user is online
    socket.emit('send-message', {
      ...sentMsg,
      receiverId: userId,
      senderId: currentUser.id
    });
  };

  const handleStartVideoCall = () => {
    if (!currentUser || !userId) return;
    
    // 1. Generate unique Room ID
    const time = Date.now().toString().slice(-6);
    const roomId = `nexus_${currentUser.id.slice(-4)}_${userId.slice(-4)}_${time}`;
    
    // 2. Alert the other user via Socket first (signaling they are being called)
    socket.emit('call-user', {
        to: userId,
        from: currentUser.id,
        fromName: currentUser.name,
        roomId
    });

    // 3. Move to the meeting room
    navigate(`/dashboard/meeting/${roomId}`);
  };
  
  if (!currentUser) return null;
  
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? 'online' : 'offline'}
                  className="mr-3"
                />
                
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{chatPartner.name}</h2>
                  <p className="text-sm text-gray-500">
                    {chatPartner.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50"
                  aria-label="Voice call"
                >
                  <Phone size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50"
                  aria-label="Video call"
                  onClick={handleStartVideoCall}
                >
                  <Video size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50"
                  aria-label="Chat info"
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>
            
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isCurrentUser={message.senderId === currentUser.id}
                  />
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
                  <p className="text-gray-500 max-w-xs mt-2">
                    Send a message to start the conversation with {chatPartner.name}
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2 text-gray-500"
                >
                  <Smile size={20} />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${chatPartner.name}...`}
                  className="flex-1 border-gray-200 focus:ring-primary-500 focus:border-primary-500"
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-primary-600 hover:bg-primary-700 shadow-sm"
                >
                  <Send size={18} className="text-white" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/30">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle size={32} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Select a conversation</h2>
            <p className="text-gray-500 mt-2 max-w-sm">
              Choose a contact from the list to see your message history or start a new talk.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};