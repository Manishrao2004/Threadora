import axiosInstance from './axiosConfig';

export const submitReport = async (reportData) => {
  const response = await axiosInstance.post('/reports', reportData);
  return response.data;
};

export const getReports = async () => {
  const response = await axiosInstance.get('/reports');
  return response.data;
};

export const resolveReport = async (reportId) => {
  const response = await axiosInstance.delete(`/reports/${reportId}`);
  return response.data;
};
