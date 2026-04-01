import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Share2, Eye, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { DocumentViewer } from '../../components/documents/DocumentViewer';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/documents');
      if (response.data.success) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', file.name);

    const uploadToast = toast.loading('Uploading document...');
    try {
      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Document uploaded successfully!', { id: uploadToast });
        fetchDocuments();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Upload failed', { id: uploadToast });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fullDocUrl = (id: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/documents/${id}/view`;
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Locker</h1>
          <p className="text-gray-600">Secure storage for pitch decks, business plans, and legal contracts</p>
        </div>
        
        <div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
          />
          <Button 
            leftIcon={<Upload size={18} />}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Document
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage / Quick Stats */}
        <Card className="lg:col-span-1 shadow-2xl border-none bg-gradient-to-br from-primary-900 to-primary-700 text-white">
          <CardHeader>
            <h2 className="text-lg font-bold">Storage Insights</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm uppercase tracking-widest font-bold opacity-80">
                <span>Total Documents</span>
                <span>{documents.length}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full">
                <div 
                  className="h-2 bg-accent-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
                  style={{ width: `${Math.min(documents.length * 10, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] opacity-60">You have unlimited dev storage for current milestone.</p>
            </div>
            
            <div className="pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-3 group cursor-pointer hover:translate-x-1 transition-transform">
                <div className="p-2 bg-white/10 rounded-lg group-hover:bg-primary-500 transition-colors">
                  <CheckCircle size={16} />
                </div>
                <span className="text-sm font-medium">Signed Docs: {documents.filter(d => d.status === 'signed').length}</span>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Share2 size={16} />
                </div>
                <span className="text-sm font-medium">Shared: 0</span>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Document list */}
        <div className="lg:col-span-3">
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-white/50 backdrop-blur-md flex justify-between items-center border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Your Files</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="xs">Sort</Button>
                <Button variant="outline" size="xs">Filter</Button>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  <p className="text-gray-500 font-medium tracking-widest text-xs uppercase">Scanning vault...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {documents.map(doc => (
                    <div
                      key={doc._id}
                      className="group flex items-center p-5 hover:bg-primary-100 transition-all duration-300 relative cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <div className="p-3 bg-white shadow-sm rounded-xl mr-4 group-hover:bg-primary-600 group-hover:rotate-6 transition-all duration-300">
                        <FileText size={28} className="text-primary-600 group-hover:text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          {doc.status === 'signed' ? (
                            <Badge variant="success" size="sm">
                              <CheckCircle size={10} className="mr-1" />
                              Signed
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Draft</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          <span>{doc.fileType}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="xs"
                          className="p-1 px-3"
                          leftIcon={<Share2 size={16} />}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const partnerEmail = user?.role === 'entrepreneur' ? 'investor@nexus.com' : 'entrepreneur@nexus.com';
                            const confirmShare = window.confirm(`Share "${doc.name}" with ${partnerEmail}?`);
                            if (confirmShare) {
                                try {
                                    // 1. First find the partner user ID (or we can use a dedicated email-based share endpoint)
                                    await api.put(`/documents/${doc._id}/share`, { recipientEmail: partnerEmail });
                                    toast.success('Document shared with partner!');
                                    fetchDocuments();
                                } catch (error: any) {
                                    toast.error(error.response?.data?.error || 'Sharing failed');
                                }
                            }
                          }}
                        >
                          Share
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          className="p-1 px-3"
                          leftIcon={<Eye size={16} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoc(doc);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 text-error-600 hover:text-error-700 hover:bg-error-50"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this document?')) {
                                try {
                                    await api.delete(`/documents/${doc._id}`);
                                    toast.success('Document deleted');
                                    fetchDocuments();
                                } catch (error) {
                                    toast.error('Failed to delete document');
                                }
                            }
                          }}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                    <FileText size={40} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">No documents found</h3>
                  <p className="text-gray-500 text-sm max-w-xs mt-1">Upload your first startup document to get started with the Nexus vault.</p>
                  <Button 
                    variant="outline" 
                    className="mt-6 border-primary-500 text-primary-600"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Quick Upload
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Viewer Modal */}
      {selectedDoc && (
        <DocumentViewer
          documentId={selectedDoc._id}
          documentUrl={fullDocUrl(selectedDoc._id)}
          documentName={selectedDoc.name}
          isSigned={selectedDoc.status === 'signed'}
          onClose={() => setSelectedDoc(null)}
          onRefresh={() => {
            fetchDocuments();
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
};