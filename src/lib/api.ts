import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      ...(session && { 'Authorization': `Bearer ${session.access_token}` }),
    };
  }

  async ocrConvert(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${this.baseURL}/ocr/convert`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`OCR conversion failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generateDocument(prompt: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/document/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Document generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getRecords() {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/records/list`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadFile(fileId: string, filename: string) {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/files/download/${fileId}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`File download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

export const apiClient = new APIClient();