import axiosInstance from './axiosConfig';

export const getSystemStats = async () => {
  const response = await axiosInstance.get('/admin/stats');
  return response.data;
};

// System Config
export const getConfig = async () => {
  const response = await axiosInstance.get('/admin/config');
  return response.data;
};

export const updateConfig = async (config) => {
  const response = await axiosInstance.put('/admin/config', config);
  return response.data;
};

// User Management
export const getUsers = async () => {
  const response = await axiosInstance.get('/admin/users');
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axiosInstance.delete(`/admin/users/${userId}`);
  return response.data;
};

export const toggleUserSuspension = async (userId) => {
  const response = await axiosInstance.put(`/admin/users/${userId}/suspend`);
  return response.data;
};

// Moderation
export const getModerationQueue = async () => {
  const response = await axiosInstance.get('/admin/moderation-queue');
  return response.data;
};

export const approveModerationItem = async (id, itemType) => {
  const response = await axiosInstance.put(`/admin/moderation-queue/${id}/approve`, { itemType });
  return response.data;
};
