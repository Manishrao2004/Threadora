import axiosInstance from './axiosConfig';

export const upvoteThread = async (threadId) => {
  const response = await axiosInstance.post('/votes/upvote', { threadId });
  return response.data;
};

export const downvoteThread = async (threadId) => {
  const response = await axiosInstance.post('/votes/downvote', { threadId });
  return response.data;
};

export const upvoteComment = async (commentId) => {
  const response = await axiosInstance.post('/votes/comment/upvote', { commentId });
  return response.data;
};

export const downvoteComment = async (commentId) => {
  const response = await axiosInstance.post('/votes/comment/downvote', { commentId });
  return response.data;
};
