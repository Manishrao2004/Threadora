import axiosInstance from './axiosConfig';

export const getThreads = async (params = {}) => {
  // params can include: page, limit, categoryId
  const response = await axiosInstance.get('/threads', { params });
  return response.data;
};

export const getThreadById = async (id) => {
  const response = await axiosInstance.get(`/threads/${id}`);
  return response.data;
};

export const createThread = async (data) => {
  const response = await axiosInstance.post('/threads', data);
  return response.data;
};

export const updateThread = async (id, data) => {
  const response = await axiosInstance.put(`/threads/${id}`, data);
  return response.data;
};

export const deleteThread = async (id) => {
  const response = await axiosInstance.delete(`/threads/${id}`);
  return response.data;
};

export const searchThreads = async (query, categoryId = null, authorId = null, page = 1, limit = 10) => {
  const response = await axiosInstance.get('/threads/search', {
    params: { q: query, categoryId, authorId, page, limit }
  });
  return response.data;
};

export const getSavedThreads = async (params = {}) => {
  const response = await axiosInstance.get('/threads/saved', { params });
  return response.data;
};

export const toggleSaveThread = async (id) => {
  const response = await axiosInstance.post(`/threads/${id}/save`);
  return response.data;
};
