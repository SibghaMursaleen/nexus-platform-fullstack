import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Save, Building2, MapPin, ArrowLeft, Image as ImageIcon, Briefcase, Info } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export const BrandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    bio: '',
    startupName: '',
    industry: '',
    location: '',
    foundedYear: '',
    teamSize: 1,
    pitchSummary: '',
    isTwoFactorEnabled: false,
  });

  const [files, setFiles] = useState<{ logo: File | null; banner: File | null }>({
    logo: null,
    banner: null
  });

  const [previews, setPreviews] = useState<{ logo: string; banner: string }>({
    logo: '',
    banner: ''
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/profile');
        if (response.data.success) {
          const user = response.data.user;
          setFormData({
            name: user.name || '',
            bio: user.bio || '',
            startupName: user.startupName || '',
            industry: user.industry || '',
            location: user.location || '',
            foundedYear: user.foundedYear || '',
            teamSize: user.teamSize || 1,
            pitchSummary: user.pitchSummary || '',
            isTwoFactorEnabled: user.isTwoFactorEnabled || false,
          });
          setPreviews({
            logo: user.startupLogoUrl || '',
            banner: user.bannerUrl || ''
          });
        }
      } catch (err) {
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev: any) => ({ ...prev, [type]: file }));
      setPreviews((prev: any) => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleToggle2FA = async () => {
    try {
      const response = await api.put('/auth/toggle-2fa');
      if (response.data.success) {
        setFormData((prev: any) => ({ ...prev, isTwoFactorEnabled: response.data.isTwoFactorEnabled }));
        toast.success(response.data.message);
      }
    } catch (err) {
      toast.error('Failed to update 2FA status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const data = new FormData();
    // Exclude security fields from branding update
    const brandingData = { ...formData };
    delete brandingData.isTwoFactorEnabled;

    Object.entries(brandingData).forEach(([key, value]) => {
      data.append(key, String(value));
    });
    
    if (files.logo) data.append('logo', files.logo);
    if (files.banner) data.append('banner', files.banner);

    try {
      const response = await api.put('/users/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        toast.success('Brand identity updated successfully!');
        navigate(-1);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header bar */}
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Brand Identity Hub</h1>
              <p className="text-sm text-gray-500 font-medium">Harden your visual presence for the investment network.</p>
            </div>
          </div>
          <Badge variant="primary" className="bg-primary-50 text-primary-700 border border-primary-100 font-bold px-4 py-2">
            Status: Live
          </Badge>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
        {/* Visual Identity Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-l-4 border-primary-600 pl-4 py-1">
            <ImageIcon className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Visual Assets</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-center sm:text-left">
            {/* Banner Preview & Upload */}
            <div className="lg:col-span-2 space-y-4">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest ml-1">Hero Banner Overlay</label>
              <div 
                className="relative h-64 rounded-3xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 hover:border-primary-500 transition-all cursor-pointer group shadow-2xl"
                onClick={() => bannerInputRef.current?.click()}
              >
                {previews.banner ? (
                  <img src={getImageUrl(previews.banner)} className="w-full h-full object-cover brightness-90 group-hover:brightness-75 transition-all" alt="Banner Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ImageIcon size={48} className="mb-2 opacity-20" />
                    <span className="text-sm font-bold">Upload HD Hero Banner</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-primary-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                  <Upload size={32} className="text-white mb-2" />
                  <span className="text-white font-extrabold shadow-sm">Change Architectural Banner</span>
                </div>
              </div>
              <input type="file" ref={bannerInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'banner')} accept="image/*" />
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <Info size={14} />
                Suggested size: 1920x480px. High-quality architecture or tech themes recommended.
              </p>
            </div>

            {/* Logo Preview & Upload */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-widest ml-1">Professional Logo</label>
              <div 
                className="aspect-square rounded-3xl overflow-hidden bg-white border-2 border-dashed border-gray-200 hover:border-primary-500 transition-all cursor-pointer flex items-center justify-center group shadow-xl p-8"
                onClick={() => logoInputRef.current?.click()}
              >
                {previews.logo ? (
                  <img src={getImageUrl(previews.logo)} className="w-full h-full object-contain filter group-hover:scale-110 transition-transform" alt="Logo Preview" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-300">
                    <Building2 size={48} className="opacity-10" />
                    <span className="text-xs font-bold mt-2">Upload Logo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" />
               <Button type="button" variant="outline" className="w-full border-gray-200" onClick={() => logoInputRef.current?.click()}>
                 Update Logo Asset
               </Button>
            </div>
          </div>
        </section>

        {/* Business Context Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-l-4 border-primary-600 pl-4 py-1">
            <Briefcase className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Founding & Business Details</h2>
          </div>
          
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardBody className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Startup/Firm Name</label>
                    <div className="relative group">
                        <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600" />
                        <input name="startupName" value={formData.startupName} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none font-bold text-gray-900 transition-all" placeholder="e.g. Nexus AI Solutions" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Industry focus</label>
                      <input name="industry" value={formData.industry} onChange={handleInputChange} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Hq Location</label>
                      <div className="relative">
                          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input name="location" value={formData.location} onChange={handleInputChange} className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none font-bold" />
                      </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Executive Bio (Short)</label>
                       <textarea 
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none font-medium resize-none leading-relaxed"
                        placeholder="Briefly introduce yourself to investors..."
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4 h-fit">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Founded Year</label>
                        <input name="foundedYear" value={formData.foundedYear} onChange={handleInputChange} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none font-bold text-center" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Team Size</label>
                        <input type="number" name="teamSize" value={formData.teamSize} onChange={handleInputChange} className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-500/20 outline-none font-bold text-center" />
                    </div>
                  </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Security & Privacy Hub */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-l-4 border-error-600 pl-4 py-1">
            <div className="bg-error-50 p-2 rounded-lg">
                <Save className="text-error-600" size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900">Security & Privacy Hub</h2>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Nexus Shield Perimeter</p>
            </div>
          </div>
          
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
            <CardBody className="p-8">
               <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center sm:text-left">
                     <h3 className="text-lg font-bold text-gray-900">Nexus Guard (2FA)</h3>
                     <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                        Authorize logins and critical actions with a secondary 6-digit secure code. Recommended for high-stakes investor verification.
                     </p>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className={`text-sm font-bold ${formData.isTwoFactorEnabled ? 'text-primary-600' : 'text-gray-400'}`}>
                        {formData.isTwoFactorEnabled ? 'SHIELD ACTIVE' : 'SHIELD DISABLED'}
                     </span>
                     <button
                        onClick={handleToggle2FA}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                            formData.isTwoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                        >
                        <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                                formData.isTwoFactorEnabled ? 'translate-x-7' : 'translate-x-1'
                            }`}
                        />
                     </button>
                  </div>
               </div>
            </CardBody>
          </Card>
        </section>

        {/* Executive Pitch Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-l-4 border-primary-600 pl-4 py-1">
            <Save className="text-primary-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Executive Pitch Hub</h2>
          </div>
          
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardBody className="p-10 space-y-4">
               <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">The Problem, the Solution, & your Impact</label>
               <textarea 
                  name="pitchSummary"
                  value={formData.pitchSummary}
                  onChange={handleInputChange}
                  rows={20}
                  className="w-full px-6 py-8 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-primary-500/20 outline-none font-medium resize-none leading-relaxed text-lg text-gray-800"
                  placeholder="Draft your executive pitch summary here. Focus on the core problem your startup solves and the scale of the opportunity..."
                />
                <p className="text-sm text-gray-400 font-medium italic">
                  Tip: Investors spend an average of 4 minutes on a pitch. Keep it impactful.
                </p>
            </CardBody>
          </Card>
        </section>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 py-6 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-gray-500">Unsaved Changes</p>
            <p className="text-xs text-gray-400">Click save to push updates to the live network.</p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
                variant="outline" 
                onClick={() => navigate(-1)} 
                className="flex-1 sm:flex-none px-10 border-gray-200 font-bold hover:bg-gray-50"
            >
                Discard
            </Button>
            <Button 
                onClick={handleSubmit} 
                className="flex-1 sm:flex-none px-12 font-extrabold shadow-2xl shadow-primary-500/20 bg-primary-600 hover:bg-primary-700 text-white"
                isLoading={isSaving}
                leftIcon={<Save size={20} />}
            >
                Save Brand Identity
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
