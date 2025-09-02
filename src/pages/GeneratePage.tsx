import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone } from 'react-dropzone';
import { PlusCircle, Download, Loader2, Sparkles, Upload, File, X } from 'lucide-react';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

const generateSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters long'),
});

type GenerateForm = z.infer<typeof generateSchema>;

export const GeneratePage: React.FC = () => {
  const [generatedDocument, setGeneratedDocument] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<{docx?: string, pdf?: string}>({});

  const { register, handleSubmit, formState: { errors }, reset } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0] || null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const onSubmit = async (data: GenerateForm) => {
    setLoading(true);
    setProcessed(false);
    try {
      const result = await apiClient.generateDocument(data.prompt, file);
      setGeneratedDocument(result.content || 'No content generated');
      setDownloadUrls(result.files || {});
      setProcessed(true);
      toast.success('Document generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Document generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (format: 'docx' | 'pdf') => {
    const url = downloadUrls[format];
    if (!url) {
      toast.error(`${format.toUpperCase()} file not available`);
      return;
    }
    
    const fullUrl = url.startsWith('http') ? url : `${import.meta.env.VITE_API_BASE_URL || 'https://ocr-doc-backend.onrender.com'}${url}`;
    window.open(fullUrl, '_blank');
    toast.success(`Opening ${format.toUpperCase()} file`);
  };

  const handleNewDocument = () => {
    setGeneratedDocument('');
    setProcessed(false);
    setFile(null);
    setDownloadUrls({});
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">AI Document Generator</h1>
        <p className="mt-2 text-gray-600">Create professional documents with optional file context</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Optional File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optional: Upload file for context
            </label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
            }`}>
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center space-x-2">
                  <File className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">Drop image/PDF for context (optional)</p>
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Document Prompt
            </label>
            <textarea
              {...register('prompt')}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.prompt ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the document you want to generate..."
            />
            {errors.prompt && <p className="mt-2 text-sm text-red-600">{errors.prompt.message}</p>}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-8 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Document Display */}
      {generatedDocument && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Generated Document</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDownload('docx')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Word
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
              <button
                onClick={handleNewDocument}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New Document
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {generatedDocument}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};