import axios from "axios";

const normalizeBaseUrl = (value) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  // return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api/`;
   return trimmed.endsWith("/api") ? `${trimmed}/` : `${trimmed}/api/`;
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
  console.log("VITE_API_URL raw:", import.meta.env.VITE_API_URL);
  console.log("Computed base URL:", envApiUrl);
  if (envApiUrl) return envApiUrl;


  
  if (import.meta.env.PROD) {
    const renderFallback = getFallbackRenderApiUrl();
    console.log("Render fallback:", renderFallback);
    if (renderFallback) return renderFallback;
  }

  console.log("Falling back to /api");
  return "/api/";

 
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // by adding this field browser will send the cookies to server automatically, on every single req
});

export default axiosInstance;
