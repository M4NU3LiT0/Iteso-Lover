import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { messageServices } from '../services/services';
import useAuthStore from '../store/authStore';

const Messages = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const user = useAuthStore((state) => state.user);
  
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) navigate('/login');
    else loadConversations();
  }, [user, navigate]);

  useEffect(() => {
    if (userId) {
      loadConversation(userId);
    }
  }, [userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await messageServices.getConversations();
      setConversations(response.conversations || []);
      setError('');
    } catch (err) {
      setError('Error loading conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (otherUserId) => {
    try {
      setLoading(true);
      const response = await messageServices.getConversation(otherUserId);
      setMessages(response.messages || []);
      setCurrentConversation(otherUserId);
      setError('');
    } catch (err) {
      setError('Error loading messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentConversation) return;

    setSending(true);
    try {
      const response = await messageServices.sendMessage(currentConversation, newMessage);
      setMessages([...messages, response.message]);
      setNewMessage('');
      setError('');
    } catch (err) {
      setError('Error sending message');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await messageServices.deleteMessage(messageId);
      setMessages(messages.filter(m => m._id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Error deleting message');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div 
              onClick={() => navigate('/dashboard')}
              className="flex items-center cursor-pointer"
            >
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">
                ITESO-Lover
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-700 hover:text-pink-500"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex w-full mt-16">
        {/* Conversations List */}
        <div className="w-1/3 bg-white border-r border-gray-200 max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Mensajes</h2>
            {loading ? (
              <div className="text-gray-600">Cargando...</div>
            ) : conversations.length === 0 ? (
              <div className="text-gray-600">No tienes conversaciones aún</div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv._id._id}
                    onClick={() => loadConversation(conv._id._id)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      currentConversation === conv._id._id
                        ? 'bg-pink-100 border-l-4 border-pink-500'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {conv._id.firstName} {conv._id.lastName}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col max-h-[calc(100vh-64px)]">
          {currentConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    Inicia una conversación
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`flex ${
                          msg.sender._id === user._id ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.sender._id === user._id
                              ? 'bg-pink-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        {msg.sender._id === user._id && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {error && (
                <div className="mx-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-200 p-4 flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  disabled={sending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 disabled:opacity-50"
                >
                  {sending ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600">
              Selecciona una conversación
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
