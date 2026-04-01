import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { SignaturePad } from './SignaturePad';
import { X, ChevronLeft, ChevronRight, PenTool, Download, CheckCircle } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';


interface DocumentViewerProps {
  documentId: string;
  documentUrl: string;
  documentName: string;
  isSigned: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documentId, 
  documentUrl, 
  documentName,
  isSigned,
  onClose, 
  onRefresh 
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(documentUrl, { responseType: 'blob' });
        
        // Check if the response is actually a PDF
        if (response.data.type !== 'application/pdf') {
          // If it's not a PDF, it's likely a JSON error disguised as a blob
          const text = await response.data.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || 'Server returned an invalid file format');
          } catch (e: any) {
            throw new Error(e.message || 'Server returned an invalid file format');
          }
        }

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        setBlobUrl(url);
      } catch (error: any) {
        console.error('Error loading PDF:', error);
        const errorMessage = error.message || 'Failed to load PDF file';
        toast.error(errorMessage);
        // We could also show this error in the UI
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [documentUrl]);


  const handleSign = async (signatureData: string) => {
    try {
      setIsSigning(true);
      console.log(`[Frontend] Sending signature for document ${documentId} with length ${signatureData.length}`);
      const response = await api.put(`/documents/${documentId}/sign`, { signatureData });
      console.log(`[Frontend] Server response for sign:`, response.data);
      if (response.data.success) {
        toast.success('Document signed successfully!');
        setShowSignaturePad(false);
        onRefresh();
      }
    } catch (error: any) {
      console.error('Sign error detail:', error);
      const msg = error.response?.data?.error || 'Failed to sign document';
      toast.error(msg);
      // Fallback alert if toast fails
      alert('Error: ' + msg);
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/documents/${documentId}/view`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documentName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {!showSignaturePad ? (
        <div className="bg-white rounded-xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{documentName}</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                {isSigned ? (
                  <>
                    <CheckCircle size={14} className="text-success-500" />
                    <span className="text-success-600">This document has been signed</span>
                  </>
                ) : (
                  <span>Ready for review and signature</span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={handleDownload}
              >
                Download
              </Button>
              {!isSigned && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PenTool size={16} />}
                  onClick={() => setShowSignaturePad(true)}
                >
                  Sign Document
                </Button>
              )}
              <button
                onClick={onClose}
                className="ml-2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-y-auto bg-gray-200 flex justify-center p-6 custom-scrollbar">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            )}
            <div className="w-full h-full bg-white shadow-2xl border border-gray-300">
              {blobUrl ? (
                <iframe
                  src={`${blobUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none"
                  title="PDF Document Viewer"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Initializing document viewer...
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <SignaturePad 
          onSave={handleSign} 
          onCancel={() => setShowSignaturePad(false)} 
          isLoading={isSigning}
        />
      )}
    </div>
  );
};
