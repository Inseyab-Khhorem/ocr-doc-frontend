import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, File, Download, Clock, User, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

interface Record {
  id: string;
  created_at?: string;
  user_id: string;
  action: string; // "OCR Conversion" | "Document Generation"
  output_file_url: string; // JSON string {docx, pdf}
  prompt?: string;
}

export const RecordsPage: React.FC = () => {
  const {
    data: records,
    isLoading,
    error,
    refetch
  } = useQuery<Record[]>({
    queryKey: ['records'],
    queryFn: () => apiClient.getRecords(),
    refetchInterval: 30000, // 30s refresh
  });

  const formatDate = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'OCR Conversion':
        return <File className="h-5 w-5 text-blue-600" />;
      case 'Document Generation':
        return <Download className="h-5 w-5 text-purple-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading records...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load records</h3>
            <p className="text-gray-600 mb-4">There was an error loading your document history.</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Document Records</h1>
        <p className="mt-2 text-gray-600">
          View and manage your document processing history
        </p>
      </div>

      {records && records.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {records.map((record) => {
              let urls: { docx?: string; pdf?: string } = {};
              try {
                urls = JSON.parse(record.output_file_url || "{}");
              } catch (e) {
                console.error("Invalid JSON in record.output_file_url", e);
              }

              return (
                <div key={record.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getActionIcon(record.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {record.action}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(record.created_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{record.user_id}</span>
                          </div>
                          {record.prompt && (
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              Prompt: {record.prompt}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {urls.docx && (
                        <a
                          href={urls.docx}
                          download
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          DOCX
                        </a>
                      )}
                      {urls.pdf && (
                        <a
                          href={urls.pdf}
                          download
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No records yet</h3>
            <p className="text-gray-600 mb-6">
              Start by converting documents or generating new ones to see your activity here.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.location.href = '/ocr'}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Convert Document
              </button>
              <button
                onClick={() => window.location.href = '/generate'}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Generate Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
