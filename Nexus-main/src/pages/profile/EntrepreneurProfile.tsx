import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { createCollaborationRequest, getRequestsFromInvestor } from '../../data/collaborationRequests';
import { ScheduleMeetingModal } from '../../components/chat/ScheduleMeetingModal';
import api from '../../lib/axios';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [entrepreneur, setEntrepreneur] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/users/profile/${id}`);
      if (response.data.success) {
        setEntrepreneur(response.data.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
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
  
  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The entrepreneur profile you're looking for doesn't exist or has been removed.</p>
        <Link to="/dashboard/investor">
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const isCurrentUser = currentUser?.id === entrepreneur._id; // Using _id from MongoDB
  const isInvestor = currentUser?.role === 'investor';
  
  // Check if the current investor has already sent a request to this entrepreneur
  const hasRequestedCollaboration = isInvestor && id 
    ? getRequestsFromInvestor(currentUser.id).some(req => req.entrepreneurId === id)
    : false;
  
  const handleSendRequest = () => {
    if (isInvestor && currentUser && id) {
      createCollaborationRequest(
        currentUser.id,
        id,
        `I'm interested in learning more about ${entrepreneur.startupName} and would like to explore potential investment opportunities.`
      );
      
      window.location.reload();
    }
  };
  
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
          src={getImageUrl(entrepreneur.bannerUrl)} 
          alt="Branding Banner" 
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        
        {/* Startup Logo Overlay */}
        {entrepreneur.startupLogoUrl && (
          <div className="absolute bottom-6 right-8 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-2xl transition-transform hover:scale-105">
            <img 
              src={getImageUrl(entrepreneur.startupLogoUrl)} 
              alt="Startup Logo" 
              className="h-12 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
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
                src={entrepreneur.profilePicture || entrepreneur.avatarUrl}
                alt={entrepreneur.name}
                size="xl"
                status={entrepreneur.isOnline ? 'online' : 'offline'}
                className="border-4 border-white shadow-2xl ring-4 ring-primary-500/20"
              />
            </div>
            
            <div className="mt-6 sm:mt-0 text-center sm:text-left">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-2 font-medium">
                <Building2 size={18} className="mr-2 text-primary-600" />
                Founder at <span className="text-primary-700 ml-1 font-bold italic">{entrepreneur.startupName}</span>
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-4">
                <Badge variant="primary" className="bg-primary-600 text-white font-bold px-3 py-1">{entrepreneur.industry}</Badge>
                <Badge variant="gray" className="font-semibold">
                  <MapPin size={14} className="mr-1" />
                  {entrepreneur.location}
                </Badge>
                <Badge variant="accent" className="font-semibold">
                  <Calendar size={14} className="mr-1" />
                  Founded {entrepreneur.foundedYear}
                </Badge>
                <Badge variant="secondary" className="font-semibold">
                  <Users size={14} className="mr-1" />
                  {entrepreneur.teamSize} team members
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-8 sm:mt-0 flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                <Link to={`/chat/${entrepreneur._id}`}>
                  <Button
                    variant="outline"
                    className="border-gray-200 hover:bg-gray-50 font-bold"
                    leftIcon={<MessageCircle size={18} />}
                  >
                    Message
                  </Button>
                </Link>
                
                {isInvestor && (
                  <>
                    <Button
                      variant="outline"
                      className="border-primary-200 text-primary-700 hover:bg-primary-50 font-bold"
                      leftIcon={<Calendar size={18} />}
                      onClick={() => setIsModalOpen(true)}
                    >
                      Schedule Meeting
                    </Button>
                    <Button
                      leftIcon={<Send size={18} />}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-500/20"
                      disabled={hasRequestedCollaboration}
                      onClick={handleSendRequest}
                    >
                      {hasRequestedCollaboration ? 'Request Sent' : 'Request Collaboration'}
                    </Button>
                  </>
                )}
              </>
            )}
            
            <ScheduleMeetingModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              receiverId={entrepreneur._id}
              receiverName={entrepreneur.name}
            />

            <ScheduleMeetingModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              receiverId={entrepreneur._id}
              receiverName={entrepreneur.name}
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
              <p className="text-gray-700">{entrepreneur.bio}</p>
            </CardBody>
          </Card>
          
          {/* Startup Description */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900">Problem Statement</h3>
                  <p className="text-gray-700 mt-1">
                    {entrepreneur?.pitchSummary?.split('.')[0]}.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Solution</h3>
                  <p className="text-gray-700 mt-1">
                    {entrepreneur.pitchSummary}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Market Opportunity</h3>
                  <p className="text-gray-700 mt-1">
                    The {entrepreneur.industry} market is experiencing significant growth, with a projected CAGR of 14.5% through 2027. Our solution addresses key pain points in this expanding market.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-900">Competitive Advantage</h3>
                  <p className="text-gray-700 mt-1">
                    Unlike our competitors, we offer a unique approach that combines innovative technology with deep industry expertise, resulting in superior outcomes for our customers.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Team */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              <span className="text-sm text-gray-500">{entrepreneur.teamSize} members</span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src={entrepreneur.avatarUrl}
                    alt={entrepreneur.name}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{entrepreneur.name}</h3>
                    <p className="text-xs text-gray-500">Founder & CEO</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src="https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg"
                    alt="Team Member"
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Alex Johnson</h3>
                    <p className="text-xs text-gray-500">CTO</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src="https://images.pexels.com/photos/773371/pexels-photo-773371.jpeg"
                    alt="Team Member"
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Jessica Chen</h3>
                    <p className="text-xs text-gray-500">Head of Product</p>
                  </div>
                </div>
                
                {entrepreneur.teamSize > 3 && (
                  <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">+ {entrepreneur.teamSize - 3} more team members</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Funding Details */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Funding</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Current Round</span>
                  <div className="flex items-center mt-1">
                    <DollarSign size={18} className="text-accent-600 mr-1" />
                    <p className="text-lg font-semibold text-gray-900">{entrepreneur.fundingNeeded}</p>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Valuation</span>
                  <p className="text-md font-medium text-gray-900">$8M - $12M</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Previous Funding</span>
                  <p className="text-md font-medium text-gray-900">$750K Seed (2022)</p>
                </div>
                
                <div className="pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Funding Timeline</span>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Pre-seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Seed</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Series A</span>
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">In Progress</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Documents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Pitch Deck</h3>
                    <p className="text-xs text-gray-500">Updated 2 months ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Business Plan</h3>
                    <p className="text-xs text-gray-500">Updated 1 month ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                
                <div className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-primary-50 rounded-md mr-3">
                    <FileText size={18} className="text-primary-700" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">Financial Projections</h3>
                    <p className="text-xs text-gray-500">Updated 2 weeks ago</p>
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </div>
              
              {!isCurrentUser && isInvestor && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Request access to detailed documents and financials by sending a collaboration request.
                  </p>
                  
                  {!hasRequestedCollaboration ? (
                    <Button
                      className="mt-3 w-full"
                      onClick={handleSendRequest}
                    >
                      Request Collaboration
                    </Button>
                  ) : (
                    <Button
                      className="mt-3 w-full"
                      disabled
                    >
                      Request Sent
                    </Button>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};