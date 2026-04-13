import axiosInstance from './axiosConfig';

export const registerUser = async (userData) => {
  const response = await axiosInstance.post('/auth/register', userData);
  return response.data; // { message, email } — no token for unverified users
};

export const loginUser = async (credentials) => {
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data; // { token, user }
};

export const loginGoogle = async (idToken) => {
  const response = await axiosInstance.post('/auth/google', { idToken });
  return response.data; // { token, user }
};

export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

export const updateProfile = async (profile) => {
  const response = await axiosInstance.put('/auth/me', profile);
  return response.data;
};

export const changePassword = async (payload) => {
  const response = await axiosInstance.put('/auth/password', payload);
  return response.data;
};
