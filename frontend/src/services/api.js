import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes timeout
});

export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const uploadDataset = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const sendChatMessage = async (sessionId, query) => {
  const payload = { query };
  if (sessionId) {
    payload.session_id = sessionId;
  }
  const response = await apiClient.post('/chat', payload);
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await apiClient.get(`/session/${sessionId}`);
  return response.data;
};

export default apiClient;
