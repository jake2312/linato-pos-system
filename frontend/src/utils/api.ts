import axios, { AxiosError } from "axios";
import { createToast, toastStore } from "../providers/toastStore";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("linato_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

const parseErrorMessage = (error: AxiosError<ApiErrorPayload>) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  const errors = error.response?.data?.errors;
  if (errors) {
    const firstKey = Object.keys(errors)[0];
    const firstMessage = errors[firstKey]?.[0];
    if (firstMessage) return firstMessage;
  }
  return "Something went wrong. Please try again.";
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => {
    const skipToast = (error.config as any)?.skipToast;
    if (!skipToast) {
      toastStore.addToast(
        createToast("error", "Request failed", parseErrorMessage(error), {
          duration: 5000,
        })
      );
    }
    return Promise.reject(error);
  }
);
