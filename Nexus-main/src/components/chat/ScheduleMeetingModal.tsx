import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiverId: string;
  receiverName: string;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  receiverId,
  receiverName
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Combine date and time
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (start < new Date()) {
      setError('Meeting must be in the future.');
      return;
    }

    if (start >= end) {
      setError('End time must be after start time.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/meetings', {
        title,
        description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        receiverId
      });

      if (response.data.success) {
        toast.success('Meeting scheduled successfully!');
        onClose();
        // Redirect to meetings page
        window.location.href = '/dashboard/meetings';
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to schedule meeting.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="bg-primary-100 p-3 rounded-xl mr-4 text-primary-700">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Schedule Meeting</h2>
              <p className="text-sm text-gray-500">Booking with {receiverName}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Meeting Title</label>
              <Input
                placeholder="e.g., Discovery Call / Pitch Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                fullWidth
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  fullWidth
                  className="pl-10"
                />
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                <div className="relative">
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    fullWidth
                    className="pl-10"
                  />
                  <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                <div className="relative">
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    fullWidth
                    className="pl-10"
                  />
                  <Clock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Agenda / Description</label>
              <textarea
                className="w-full px-4 py-2 text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                rows={3}
                placeholder="Briefly describe what you'd like to discuss..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg animate-shake">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                fullWidth 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                fullWidth 
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 shadow-md"
              >
                {loading ? 'Checking Conflict...' : 'Send Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};
