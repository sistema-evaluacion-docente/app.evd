import axios from "axios";

import { API_URL } from ".";
import { getToken } from "@/features/auth/api/AuthService";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.data && error.response.data.error) {
      return Promise.reject(new Error(error.response.data.error));
    }

    return Promise.reject(error);
  },
);

export default api;
