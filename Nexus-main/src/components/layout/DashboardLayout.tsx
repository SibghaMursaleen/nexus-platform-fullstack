import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { socket } from '../../lib/socket';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const DashboardLayout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  React.useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('join-chat', user.id);

      socket.on('incoming-call', (data: { fromName: string, roomId: string }) => {
        console.log('Incoming call from:', data.fromName);
        toast((t) => (
          <div className="flex flex-col items-center">
            <span className="font-bold text-gray-900 mb-2">Incoming Call from {data.fromName}</span>
            <div className="flex space-x-3">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm"
              >
                Decline
              </button>
              <Link
                to={`/dashboard/meeting/${data.roomId}`}
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 bg-primary-600 text-white rounded-md text-sm font-medium"
              >
                Join Call
              </Link>
            </div>
          </div>
        ), { duration: 8000, position: 'top-center' });
      });
    }

    return () => {
      socket.off('incoming-call');
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};