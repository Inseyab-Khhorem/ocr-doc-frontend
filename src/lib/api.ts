import axios from "axios";
import { createClient } from '@supabase/supabase-js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://ocr-doc-backend.onrender.com",
});

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user.id;
};

// Attach JWT to requests
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const apiClient = {
  ocrConvert: async (file: File) => {
    const userId = await getCurrentUserId();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    
    const res = await api.post("/ocr/convert", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  generateDocument: async (prompt: string, file?: File) => {
    const userId = await getCurrentUserId();
    
    if (file) {
      // Send as FormData if file included
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("user_id", userId);
      formData.append("file", file);
      
      const res = await api.post("/document/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } else {
      // Send as JSON if no file
      const res = await api.post("/document/generate", {
        prompt,
        user_id: userId,
      });
      return res.data;
    }
  },

  getRecords: async () => {
    const res = await api.get("/records/");
    return res.data;
  },

  // Admin functions
  adminLogin: async (email: string, password: string) => {
    const res = await api.post("/auth/admin/login", { email, password });
    return res.data;
  },

  adminGetAllRecords: async () => {
    const adminToken = localStorage.getItem('admin_token');
    const res = await api.get("/records/admin/all", {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
    });
    return res.data;
  },

  adminDeleteRecord: async (recordId: string) => {
    const adminToken = localStorage.getItem('admin_token');
    const res = await api.delete(`/records/admin/record/${recordId}`, {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
    });
    return res.data;
  },
};