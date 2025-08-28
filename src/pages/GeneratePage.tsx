import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Download, Loader2, Sparkles } from 'lucide-react';
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GenerateForm>({
    resolver: zodResolver(generateSchema),
  });

  const onSubmit = async (data: GenerateForm) => {
    setLoading(true);
    setProcessed(false);
    try {
      const result = await apiClient.generateDocument(data.prompt);
      setGeneratedDocument(result.content || 'No content generated');
      setProcessed(true);
      toast.success('Document generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Document generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!generatedDocument) {
      toast.error('No document to download');
      return;
    }

    try {
      const blob = new Blob([generatedDocument], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-document.${format === 'docx' ? 'txt' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Download failed');
    }
  };

  const handleNewDocument = () => {
    setGeneratedDocument('');
    setProcessed(false);
    reset();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">AI Document Generator</h1>
        <p className="mt-2 text-gray-600">
          Create professional documents from your prompts using AI
        </p>
      </div>

      {/* Prompt Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              Document Prompt
            </label>
            <textarea
              {...register('prompt')}
              rows={6}
              className={`w-full px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.prompt ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Describe the document you want to generate... For example: 'Write a professional business proposal for a new mobile app development project, including executive summary, project scope, timeline, and budget considerations.'"
            />
            {errors.prompt && (
              <p className="mt-2 text-sm text-red-600">{errors.prompt.message}</p>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Word
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
              <button
                onClick={handleNewDocument}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
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