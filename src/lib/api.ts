import axios from "axios";
import { createClient } from '@supabase/supabase-js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// Supabase client for getting current user
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// Get current user ID
const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
};

// -------- DOCUMENT GENERATION --------
export const generateDocument = async (userId: string, prompt: string) => {
  const res = await api.post("/document/generate", {
    user_id: userId,
    prompt,
  });
  return res.data;
};

// -------- OCR CONVERSION --------
export const convertOCR = async (userId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_id", userId);

  const res = await api.post("/ocr/convert", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// -------- RECORDS --------
export const getRecords = async (userId: string) => {
  const res = await api.get(`/records/${userId}`);
  return res.data;
};

// Export apiClient object for OCRPage
export const apiClient = {
  ocrConvert: async (file: File) => {
    const userId = await getCurrentUserId();
    return convertOCR(userId, file);
  },
  generateDocument: async (prompt: string) => {
    const userId = await getCurrentUserId();
    return generateDocument(userId, prompt);
  },
  getRecords: async () => {
    const userId = await getCurrentUserId();
    return getRecords(userId);
  },
};

// Attach Supabase JWT automatically to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});
