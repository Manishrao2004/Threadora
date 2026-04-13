import axiosInstance from './axiosConfig';

export const getCategories = async () => {
  const response = await axiosInstance.get('/categories');
  return response.data;
};

export const createCategory = async (categoryData) => {
  const response = await axiosInstance.post('/categories', categoryData);
  return response.data;
};

export const updateCategory = async (id, categoryData) => {
  const response = await axiosInstance.put(`/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await axiosInstance.delete(`/categories/${id}`);
  return response.data;
};
