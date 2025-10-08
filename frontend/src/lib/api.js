import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  }
};

// Study Sessions API
export const sessionsAPI = {
  create: async (sessionData) => {
    const response = await api.post('/sessions', sessionData);
    return response.data;
  },
  
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`/sessions?page=${page}&limit=${limit}`);
    return response.data;
  },
  
  getById: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  },
  
  update: async (sessionId, sessionData) => {
    const response = await api.put(`/sessions/${sessionId}`, sessionData);
    return response.data;
  },
  
  delete: async (sessionId) => {
    const response = await api.delete(`/sessions/${sessionId}`);
    return response.data;
  },
  
  askQuestion: async (sessionId, question) => {
    const response = await api.post(`/sessions/${sessionId}/ask`, { question });
    return response.data;
  }
};

// Study aids API (flashcards and quizzes)
export const studyAidsAPI = {
  generateFlashcards: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/flashcards/generate`, {});
    return response.data;
  },
  generateQuiz: async (sessionId, count) => {
    const response = await api.post(`/sessions/${sessionId}/quiz/generate`, { count });
    return response.data;
  },
  assessQuiz: async (sessionId, quizId, answers) => {
    const response = await api.post(`/sessions/${sessionId}/quiz/${quizId}/assess`, { answers });
    return response.data;
  },
  listQuizzes: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/quizzes`);
    return response.data;
  }
};

// Upload API
export const uploadAPI = {
  uploadFile: async (file, sessionId, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    
    return response.data;
  }
};

export default api;