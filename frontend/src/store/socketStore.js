import { create } from 'zustand';
import io from 'socket.io-client';

export const useSocketStore = create((set) => {
  let socket = null;

  return {
    socket: null,
    messages: [],
    isTyping: null,
    onlineUsers: [],

    // Auth cookie is sent automatically — no token parameter needed
    initializeSocket: () => {
      if (socket?.connected) return;

      socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true // sends httpOnly access_token cookie on WS upgrade
      });

      socket.on('connect', () => {
        console.log('Socket connected');
        set({ socket });
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        set({ socket: null });
      });

      socket.on('receive-message', (data) => {
        set((state) => ({ messages: [...state.messages, data] }));
      });

      socket.on('user-typing', (data) => {
        set({ isTyping: data.senderId });
        // Auto-clear typing indicator after 2 s
        setTimeout(() => set({ isTyping: null }), 2000);
      });

      const addOnlineUser = (userId) =>
        set((state) => ({
          onlineUsers: state.onlineUsers.includes(userId)
            ? state.onlineUsers
            : [...state.onlineUsers, userId]
        }));

      const removeOnlineUser = (userId) =>
        set((state) => ({
          onlineUsers: state.onlineUsers.filter((id) => id !== userId)
        }));

      socket.on('user-online', addOnlineUser);
      socket.on('user-offline', removeOnlineUser);

      socket.on('error', (data) => {
        console.warn('Socket error:', data.message);
      });
    },

    sendMessage: (receiverId, content) => {
      if (socket) socket.emit('send-message', { receiverId, content, timestamp: new Date() });
    },

    emitTyping: (receiverId) => {
      if (socket) socket.emit('typing', { receiverId });
    },

    markAsRead: (senderId) => {
      if (socket) socket.emit('mark-as-read', { senderId });
    },

    disconnectSocket: () => {
      if (socket) {
        socket.disconnect();
        socket = null;
        set({ socket: null });
      }
    }
  };
});
