import React, { useState, useRef } from 'react';
import { X, Upload, Save, Building2, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onRefresh: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user, onRefresh }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    startupName: user?.startupName || '',
    industry: user?.industry || '',
    location: user?.location || '',
    foundedYear: user?.foundedYear || '',
    teamSize: user?.teamSize || 1,
    pitchSummary: user?.pitchSummary || '',
  });

  const [files, setFiles] = useState<{ logo: File | null; banner: File | null }>({
    logo: null,
    banner: null
  });

  const [previews, setPreviews] = useState<{ logo: string; banner: string }>({
    logo: user?.startupLogoUrl || '',
    banner: user?.bannerUrl || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.toString());
    });
    
    if (files.logo) data.append('logo', files.logo);
    if (files.banner) data.append('banner', files.banner);

    try {
      const response = await api.put('/users/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        toast.success('Brand identity updated successfully!');
        onRefresh();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center bg-primary-900 px-8 py-6 text-white text-center sm:text-left">
          <div>
            <h3 className="text-xl font-bold">Edit Brand Identity</h3>
            <p className="text-sm text-primary-200 mt-1">Harden your startup's visual presence for investors.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Scrollable Content Zone */}
          <div className="flex-1 overflow-y-auto p-8 border-b border-gray-100 pr-4 mr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Branding Uploads */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">Visual Assets</h4>
                
                {/* Banner Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Hero Banner</label>
                  <div 
                    className="relative h-32 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-primary-500 transition-colors cursor-pointer group"
                    onClick={() => bannerInputRef.current?.click()}
                  >
                    {previews.banner ? (
                      <img src={previews.banner.startsWith('http') ? previews.banner : `http://localhost:5000${previews.banner}`} className="w-full h-full object-cover" alt="Banner Preview" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <Upload size={24} />
                        <span className="text-xs mt-1">Upload Banner (HD)</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white text-xs font-bold">Change Banner</span>
                    </div>
                  </div>
                  <input type="file" ref={bannerInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" />
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Startup Logo</label>
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-500 transition-all"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {previews.logo ? (
                        <img src={previews.logo.startsWith('http') ? previews.logo : `http://localhost:5000${previews.logo}`} className="w-full h-full object-contain p-2" alt="Logo Preview" />
                      ) : (
                        <Upload size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>Change Logo</Button>
                      <p className="text-[10px] text-gray-400 mt-1">Recommended: PNG with transparent background.</p>
                    </div>
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" />
                </div>

                <div className="pt-4 space-y-4">
                   <h4 className="text-lg font-bold text-gray-900 border-b pb-2">Business Details</h4>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Startup Name</label>
                      <div className="relative">
                          <Building2 size={16} className="absolute left-3 top-3 text-gray-400" />
                          <input name="startupName" value={formData.startupName} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Nexus AI" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Industry</label>
                          <input name="industry" value={formData.industry} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                          <div className="relative">
                              <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                              <input name="location" value={formData.location} onChange={handleInputChange} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                          </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Content Details */}
              <div className="space-y-6">
                <h4 className="text-lg font-bold text-gray-900 border-b pb-2">The Pitch</h4>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Executive Bio</label>
                  <textarea 
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    placeholder="Describe yourself as a founder..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Pitch Deck Summary</label>
                  <textarea 
                    name="pitchSummary"
                    value={formData.pitchSummary}
                    onChange={handleInputChange}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    placeholder="What problem are you solving? How is your solution unique?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Founded Year</label>
                      <input name="foundedYear" value={formData.foundedYear} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Team Size</label>
                      <input type="number" name="teamSize" value={formData.teamSize} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="px-8 py-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 z-20">
             <Button type="button" variant="outline" onClick={onClose} className="font-bold">Cancel</Button>
             <Button 
                type="button"
                onClick={handleSubmit}
                className="px-8 font-extrabold shadow-xl shadow-primary-500/20 bg-primary-600 hover:bg-primary-700 text-white"
                isLoading={isSaving}
                leftIcon={<Save size={18} />}
             >
                Save Brand Identity
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
