import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Building2, MapPin, UserCircle, BarChart3, Briefcase, Calendar } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { ScheduleMeetingModal } from '../../components/chat/ScheduleMeetingModal';
import api from '../../lib/axios';

export const InvestorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [investor, setInvestor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/users/profile/${id}`);
      if (response.data.success) {
        setInvestor(response.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch investor profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!investor || investor.role !== 'investor') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Investor not found</h2>
        <p className="text-gray-600 mt-2">The investor profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard/entrepreneur">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const isCurrentUser = currentUser?.id === investor._id;

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:5000${url}`;
  };
  
  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Hero Banner Section */}
      <div className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden shadow-2xl">
        <img 
          src={getImageUrl(investor.bannerUrl)} 
          alt="Branding Banner" 
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Firm Logo Overlay */}
        {investor.startupLogoUrl && (
          <div className="absolute bottom-6 right-8 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl transition-transform hover:scale-105">
            <img 
              src={getImageUrl(investor.startupLogoUrl)} 
              alt="Firm Logo" 
              className="h-10 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
            />
          </div>
        )}
      </div>

      {/* Profile header */}
      <Card className="-mt-16 sm:-mt-24 bg-white/80 backdrop-blur-xl border-none shadow-2xl relative z-10">
        <CardBody className="sm:flex sm:items-start sm:justify-between p-8">
          <div className="sm:flex sm:space-x-8">
             <div className="relative -mt-20 sm:-mt-24 ml-4 sm:ml-0">
               <Avatar
                src={investor.profilePicture || investor.avatarUrl}
                alt={investor.name}
                size="xl"
                status={investor.isOnline ? 'online' : 'offline'}
                className="border-4 border-white shadow-2xl ring-4 ring-primary-500/20"
              />
            </div>
            
            <div className="mt-6 sm:mt-0 text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{investor.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-2 font-medium">
                <Building2 size={18} className="mr-2 text-primary-600" />
                Invesor • <span className="text-primary-700 ml-1 font-bold italic">{investor.startupName || 'Nexus Capital'}</span>
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-4">
                <Badge variant="primary" className="bg-primary-600 text-white font-bold px-3 py-1">
                  <MapPin size={14} className="mr-1" />
                  {investor.location || 'New York, NY'}
                </Badge>
                {(investor.investmentStage || ['Seed', 'Series A']).map((stage: string, index: number) => (
                  <Badge key={index} variant="secondary" className="font-semibold">{stage}</Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 sm:mt-0 flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
            {!isCurrentUser && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link to={`/chat/${investor._id}`}>
                  <Button
                    variant="outline"
                    className="border-gray-200 hover:bg-gray-50 font-bold"
                    leftIcon={<MessageCircle size={18} />}
                  >
                    Message
                  </Button>
                </Link>
                <Button
                  leftIcon={<Calendar size={18} />}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-500/20"
                  onClick={() => setIsModalOpen(true)}
                >
                  Schedule Meeting
                </Button>
              </div>
            )}
            
            <ScheduleMeetingModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              receiverId={investor._id}
              receiverName={investor.name}
            />

            <ScheduleMeetingModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              receiverId={investor._id}
              receiverName={investor.name}
            />
            
            {isCurrentUser && (
              <Button
                variant="outline"
                className="border-primary-500 text-primary-700 hover:bg-primary-50 px-8 font-bold"
                leftIcon={<UserCircle size={18} />}
                onClick={() => navigate('/dashboard/branding')}
              >
                Edit Brand Identity
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">{investor.bio}</p>
            </CardBody>
          </Card>
          
          {/* Investment Interests */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Interests</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Industries</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(investor.investmentInterests || []).map((interest: string, index: number) => (
                      <Badge key={index} variant="primary" size="md">{interest}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Investment Stages</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(investor.investmentStage || []).map((stage: string, index: number) => (
                      <Badge key={index} variant="secondary" size="md">{stage}</Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Investment Criteria</h3>
                  <ul className="mt-2 space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
                      Strong founding team with domain expertise
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
                      Clear market opportunity and product-market fit
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
                      Scalable business model with strong unit economics
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-2 h-2 bg-primary-600 rounded-full mt-1.5 mr-2"></span>
                      Potential for significant growth and market impact
                    </li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Portfolio Companies */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Portfolio Companies</h2>
              <span className="text-sm text-gray-500">{investor.portfolioCompanies.length} companies</span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(investor.portfolioCompanies || []).map((company: string, index: number) => (
                  <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                    <div className="p-3 bg-primary-50 rounded-md mr-3">
                      <Briefcase size={18} className="text-primary-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{company}</h3>
                      <p className="text-xs text-gray-500">Invested in 2022</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Investment Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Details</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Investment Range</span>
                  <p className="text-lg font-semibold text-gray-900">
                    {investor.minimumInvestment} - {investor.maximumInvestment}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Total Investments</span>
                  <p className="text-md font-medium text-gray-900">{investor.totalInvestments} companies</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Typical Investment Timeline</span>
                  <p className="text-md font-medium text-gray-900">3-5 years</p>
                </div>
                
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Investment Focus</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">SaaS & B2B</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">FinTech</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">HealthTech</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Investment Stats</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Successful Exits</h3>
                      <p className="text-xl font-semibold text-primary-700 mt-1">4</p>
                    </div>
                    <BarChart3 size={24} className="text-primary-600" />
                  </div>
                </div>
                
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Avg. ROI</h3>
                      <p className="text-xl font-semibold text-primary-700 mt-1">3.2x</p>
                    </div>
                    <BarChart3 size={24} className="text-primary-600" />
                  </div>
                </div>
                
                <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Active Investments</h3>
                      <p className="text-xl font-semibold text-primary-700 mt-1">{investor.portfolioCompanies.length}</p>
                    </div>
                    <BarChart3 size={24} className="text-primary-600" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};