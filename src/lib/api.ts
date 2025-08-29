import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// -------- DOCUMENT GENERATION --------
export const generateDocument = async (userId: string, prompt: string) => {
  const res = await apiClient.post("/document/generate", {
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

  const res = await apiClient.post("/ocr/convert", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// -------- RECORDS --------
export const getRecords = async (userId: string) => {
  const res = await apiClient.get(`/records/${userId}`);
  return res.data;
};
