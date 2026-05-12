import apiClient from './api';

// ============ AUTH SERVICES ============

export const authServices = {
  register: async (firstName, lastName, email, password, passwordConfirm, gender) => {
    const response = await apiClient.post('/auth/register', {
      firstName,
      lastName,
      email,
      password,
      passwordConfirm,
      gender
    });
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password
    });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password, passwordConfirm) => {
    const response = await apiClient.post(`/auth/reset-password/${token}`, {
      password,
      passwordConfirm
    });
    return response.data;
  }
};

// ============ USER SERVICES ============

export const userServices = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  searchUsers: async (query, interests, gender) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (interests) params.append('interests', interests);
    if (gender && gender !== 'all') params.append('gender', gender);
    
    const response = await apiClient.get(`/users/search?${params.toString()}`);
    return response.data;
  },

  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  getCompatibleUsers: async () => {
    const response = await apiClient.get('/users/compatible');
    return response.data;
  }
};

// ============ DATE SERVICES ============

export const dateServices = {
  createDateRequest: async (receiverId, preferredDate, preferredTime, location, customLocation, message) => {
    const response = await apiClient.post('/dates/request', {
      receiverId,
      preferredDate,
      preferredTime,
      location,
      customLocation,
      message
    });
    return response.data;
  },

  getPendingRequests: async () => {
    const response = await apiClient.get('/dates/requests');
    return response.data;
  },

  acceptDateRequest: async (requestId) => {
    const response = await apiClient.put(`/dates/request/${requestId}/accept`);
    return response.data;
  },

  rejectDateRequest: async (requestId, message) => {
    const response = await apiClient.put(`/dates/request/${requestId}/reject`, { message });
    return response.data;
  },

  getScheduledDates: async () => {
    const response = await apiClient.get('/dates/scheduled');
    return response.data;
  }
};

// ============ MESSAGE SERVICES ============

export const messageServices = {
  getConversations: async () => {
    const response = await apiClient.get('/messages/conversations');
    return response.data;
  },

  getConversation: async (userId) => {
    const response = await apiClient.get(`/messages/${userId}`);
    return response.data;
  },

  sendMessage: async (receiverId, content) => {
    const response = await apiClient.post('/messages/send', {
      receiverId,
      content
    });
    return response.data;
  },

  markAsRead: async (messageId) => {
    const response = await apiClient.put(`/messages/${messageId}/read`);
    return response.data;
  },

  deleteMessage: async (messageId) => {
    const response = await apiClient.delete(`/messages/${messageId}`);
    return response.data;
  }
};

// ============ UPLOAD SERVICES ============

export const uploadServices = {
  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiClient.post('/upload/profile-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteProfilePhoto: async () => {
    const response = await apiClient.delete('/upload/profile-photo');
    return response.data;
  },

  getPresignedUrl: async (filename, filetype) => {
    const response = await apiClient.post('/upload/presigned-url', {
      filename,
      filetype
    });
    return response.data;
  }
};

// ============ PHOTO SERVICES ============

export const photoServices = {
  getMyPhotos: async () => {
    const response = await apiClient.get('/photos');
    return response.data;
  },

  getUserPhotos: async (userId) => {
    const response = await apiClient.get(`/photos/${userId}`);
    return response.data;
  },

  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiClient.post('/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deletePhoto: async (photoId) => {
    const response = await apiClient.delete(`/photos/${photoId}`);
    return response.data;
  },

  reorderPhotos: async (photos) => {
    const response = await apiClient.put('/photos/reorder', { photos });
    return response.data;
  }
};

// ============ ADMIN SERVICES ============

export const adminServices = {
  getStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  listUsers: async (search = '', limit = 30) => {
    const response = await apiClient.get(`/admin/users?search=${encodeURIComponent(search)}&limit=${limit}`);
    return response.data;
  },

  verifyUser: async (id) => {
    const response = await apiClient.put(`/admin/users/${id}/verify`);
    return response.data;
  },

  unverifyUser: async (id) => {
    const response = await apiClient.put(`/admin/users/${id}/unverify`);
    return response.data;
  },

  deactivateUser: async (id) => {
    const response = await apiClient.put(`/admin/users/${id}/deactivate`);
    return response.data;
  },

  activateUser: async (id) => {
    const response = await apiClient.put(`/admin/users/${id}/activate`);
    return response.data;
  },

  getSecurityLogs: async (limit = 50) => {
    const response = await apiClient.get(`/admin/security-logs?limit=${limit}`);
    return response.data;
  },

  getReports: async (limit = 30) => {
    const response = await apiClient.get(`/admin/reports?limit=${limit}`);
    return response.data;
  }
};

const services = {
  authServices,
  userServices,
  dateServices,
  messageServices,
  uploadServices,
  photoServices,
  adminServices
};

export default services;
