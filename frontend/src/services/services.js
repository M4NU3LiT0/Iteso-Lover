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

const services = {
  authServices,
  userServices,
  dateServices
};

export default services;
