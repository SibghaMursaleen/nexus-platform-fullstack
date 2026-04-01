import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import { Entrepreneur } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ScheduleMeetingModal } from '../chat/ScheduleMeetingModal';

interface EntrepreneurCardProps {
  entrepreneur: Entrepreneur;
  showActions?: boolean;
}

export const EntrepreneurCard: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true
}) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handleViewProfile = () => {
    navigate(`/profile/entrepreneur/${entrepreneur.id}`);
  };
  
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/chat/${entrepreneur.id}`);
  };
  
  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };
  
  return (
    <>
      <Card 
        hoverable 
        className="transition-all duration-300 h-full shadow-sm hover:shadow-md"
        onClick={handleViewProfile}
      >
        <CardBody className="flex flex-col">
          <div className="flex items-start">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="lg"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mr-4 ring-2 ring-gray-100"
            />
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-0.5">{entrepreneur.name}</h3>
              <p className="text-sm font-medium text-primary-600 mb-2">{entrepreneur.startupName}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="primary" size="sm">{entrepreneur.industry}</Badge>
                <Badge variant="gray" size="sm" className="bg-gray-100">{entrepreneur.location}</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pitch Summary</h4>
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{entrepreneur.pitchSummary}</p>
          </div>
          
          <div className="mt-4 flex justify-between items-center bg-gray-50 p-2 rounded-lg">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Funding Need</span>
              <p className="text-sm font-bold text-gray-900">{entrepreneur.fundingNeeded}</p>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Team Size</span>
              <p className="text-sm font-bold text-gray-900">{entrepreneur.teamSize} people</p>
            </div>
          </div>
        </CardBody>
        
        {showActions && (
          <CardFooter className="border-t border-gray-100 bg-white flex flex-wrap gap-2 justify-between p-3">
            <div className="flex space-x-1 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                onClick={handleMessage}
                title="Send Message"
              >
                <MessageCircle size={18} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                onClick={handleSchedule}
                title="Schedule Meeting"
              >
                <Calendar size={18} />
              </Button>
            </div>
            
            <Button
              variant="primary"
              size="sm"
              className="h-9 px-4 rounded-lg shadow-sm"
              rightIcon={<ExternalLink size={16} />}
              onClick={handleViewProfile}
            >
              View Profile
            </Button>
          </CardFooter>
        )}
      </Card>

      <ScheduleMeetingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        receiverId={entrepreneur.id}
        receiverName={entrepreneur.name}
      />
    </>
  );
};