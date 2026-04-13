import axiosInstance from './axiosConfig';

export const getComments = async (threadId) => {
  const response = await axiosInstance.get(`/comments/${threadId}`);
  return response.data;
};

export const createComment = async (data) => {
  const response = await axiosInstance.post('/comments', data);
  return response.data;
};

export const updateComment = async (id, data) => {
  const response = await axiosInstance.put(`/comments/${id}`, data);
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await axiosInstance.delete(`/comments/${commentId}`);
  return response.data;
};
