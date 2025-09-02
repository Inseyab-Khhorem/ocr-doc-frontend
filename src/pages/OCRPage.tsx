import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Download, Loader2, CheckCircle, X } from 'lucide-react';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

export const OCRPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<{docx?: string, pdf?: string}>({});

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedText('');
      setProcessed(false);
      setDownloadUrls({});
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handleConvert = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.ocrConvert(file);
      setExtractedText(result.text || 'No text extracted');
      setDownloadUrls(result.files || {});
      setProcessed(true);
      toast.success('Text extracted successfully!');
    } catch (error: any) {
      toast.error(error.message || 'OCR conversion failed');
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

  const removeFile = () => {
    setFile(null);
    setExtractedText('');
    setProcessed(false);
    setDownloadUrls({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">OCR Document Converter</h1>
        <p className="mt-2 text-gray-600">Upload images or PDFs to extract text content</p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}>
          <input {...getInputProps()} />
          
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-green-600">
                <CheckCircle className="h-8 w-8" />
                <File className="h-8 w-8" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragActive ? 'Drop the file here' : 'Drop files here or click to upload'}
                </p>
                <p className="text-sm text-gray-500">Supports PNG, JPG, JPEG, and PDF files</p>
              </div>
            </div>
          )}
        </div>

        {file && !processed && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleConvert}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Extract Text
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Extracted Text Display */}
      {extractedText && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Extracted Text</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => handleDownload('docx')}
                disabled={!downloadUrls.docx}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                Word
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                disabled={!downloadUrls.pdf}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
              {extractedText}
            </pre>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {loading && (
        <div className="bg-blue-50 rounded-xl p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-blue-800 font-medium">Processing your document...</p>
          <p className="text-blue-600 text-sm mt-1">This may take a few moments</p>
        </div>
      )}

      {/* Success Message */}
      {processed && downloadUrls.docx && (
        <div className="bg-green-50 rounded-xl p-6 text-center">
          <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-4" />
          <p className="text-green-800 font-medium">Text extracted successfully!</p>
          <p className="text-green-600 text-sm mt-1">Download your files using the buttons above</p>
        </div>
      )}
    </div>
  );
};