import axios from "axios";

const normalizeBaseUrl = (value) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

const getFallbackRenderApiUrl = () => {
  if (typeof window === "undefined") return null;

  const { protocol, hostname } = window.location;

  if (!hostname.endsWith(".onrender.com") || !hostname.includes("frontend")) {
    return null;
  }

  const backendHost = hostname.replace("frontend", "backend");
  return `${protocol}//${backendHost}/api`;
};

const getApiBaseUrl = () => {
  const envApiUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (envApiUrl) return envApiUrl;

  if (import.meta.env.PROD) {
    const renderFallback = getFallbackRenderApiUrl();
    if (renderFallback) return renderFallback;
  }

  return "/api";
};

let authTokenGetter = null;

export const setAxiosAuthTokenGetter = (getter) => {
  authTokenGetter = getter;
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // by adding this field browser will send the cookies to server automatically, on every single req
});

axiosInstance.interceptors.request.use(async (config) => {
  if (!authTokenGetter) return config;

  const token = await authTokenGetter();
  if (!token) return config;

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;

  return config;
});

export default axiosInstance;
