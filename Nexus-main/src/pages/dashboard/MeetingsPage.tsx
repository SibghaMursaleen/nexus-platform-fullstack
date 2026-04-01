import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, CheckCircle, XCircle, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/meetings');
      if (response.data.success) {
        setMeetings(response.data.meetings);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user]);

  const handleUpdateStatus = async (meetingId: string, status: 'accepted' | 'rejected') => {
    try {
      const response = await api.put(`/meetings/${meetingId}`, { status });
      if (response.data.success) {
        toast.success(`Meeting ${status}`);
        fetchMeetings(); // Refresh list
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Update failed');
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Delete this meeting request?')) return;
    try {
      const response = await api.delete(`/meetings/${meetingId}`);
      if (response.data.success) {
        toast.success('Meeting deleted');
        fetchMeetings();
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <CalendarDays className="mr-3 text-primary-600" size={32} />
            My Meetings
          </h1>
          <p className="text-gray-600 mt-1">Manage your consultations and discovery calls</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'pending' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter('accepted')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'accepted' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
          >
            Accepted
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-500 font-medium">Syncing your calendar...</p>
        </div>
      ) : filteredMeetings.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredMeetings.map((meeting) => {
            const isSender = meeting.sender._id === user?.id;
            const partner = isSender ? meeting.receiver : meeting.sender;
            const startTime = new Date(meeting.startTime);
            const isLive = new Date() >= startTime && meeting.status === 'accepted';
            
            return (
              <Card key={meeting._id} className={`hover:shadow-md transition-shadow relative overflow-hidden ${meeting.status === 'accepted' ? 'border-l-4 border-l-green-500' : meeting.status === 'pending' ? 'border-l-4 border-l-amber-500' : ''}`}>
                <CardBody className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center">
                        <Avatar 
                          src={partner.avatarUrl || partner.profilePicture} 
                          alt={partner.name}
                          size="lg"
                          className="mr-4 ring-2 ring-gray-100"
                        />
                        <div>
                          <Badge variant={meeting.status === 'accepted' ? 'success' : meeting.status === 'pending' ? 'warning' : 'gray'} className="mb-1">
                            {meeting.status.toUpperCase()}
                          </Badge>
                          <h3 className="text-lg font-bold text-gray-900">{meeting.title}</h3>
                          <p className="text-sm text-gray-500">with {partner.name}</p>
                        </div>
                      </div>
                      
                      {isSender && (
                        <button 
                          onClick={() => handleDeleteMeeting(meeting._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <Calendar className="mr-3 text-primary-500" size={18} />
                        {format(startTime, 'EEEE, MMMM do')}
                      </div>
                      <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">
                        <Clock className="mr-3 text-primary-500" size={18} />
                        {format(startTime, 'h:mm a')} - {format(new Date(meeting.endTime), 'h:mm a')}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6 line-clamp-2 italic">
                      "{meeting.description || 'No description provided.'}"
                    </p>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                       <div className="flex space-x-2">
                         {!isSender && meeting.status === 'pending' && (
                           <>
                             <Button 
                                size="sm" 
                                onClick={() => handleUpdateStatus(meeting._id, 'accepted')}
                                className="bg-green-600 hover:bg-green-700"
                                leftIcon={<CheckCircle size={16} />}
                             >
                               Accept
                             </Button>
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleUpdateStatus(meeting._id, 'rejected')}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                leftIcon={<XCircle size={16} />}
                             >
                               Decline
                             </Button>
                           </>
                         )}
                       </div>

                       {meeting.status === 'accepted' && meeting.meetingLink && (
                         <Button 
                           as="a" 
                           href={meeting.meetingLink}
                           className={`${isLive ? 'animate-pulse ring-4 ring-primary-100 bg-primary-700' : ''}`}
                           leftIcon={<Video size={18} />}
                         >
                           {isLive ? 'Join Call Now' : 'Join Room'}
                         </Button>
                       )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarDays className="text-gray-300" size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No {filter !== 'all' ? filter : ''} meetings found</h2>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            Your schedule is currently empty. Connect with others to start booking calls.
          </p>
        </div>
      )}
    </div>
  );
};
