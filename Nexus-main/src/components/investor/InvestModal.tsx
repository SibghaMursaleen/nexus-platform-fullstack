import React, { useState } from 'react';
import { DollarSign, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface InvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  entrepreneurId: string;
  entrepreneurName: string;
  startupName: string;
}

export const InvestModal: React.FC<InvestModalProps> = ({
  isOpen,
  onClose,
  entrepreneurId,
  entrepreneurName,
  startupName
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const investmentAmount = parseFloat(amount);
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      setError('Please enter a valid investment amount.');
      return;
    }

    if (user && user.walletBalance < investmentAmount * 100) {
      setError('Insufficient wallet balance. Please add funds first.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/payments/transfer', {
        recipientId: entrepreneurId,
        amount: investmentAmount * 100, // Convert to cents
        description: description || `Investment in ${startupName} (${entrepreneurName})`
      });

      if (response.data.success) {
        toast.success(`Successfully invested ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(investmentAmount)}!`);
        onClose();
        // Redirect to wallet to see the transaction
        window.location.href = '/dashboard/wallet';
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Investment failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative border border-gray-100">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex items-center mb-6">
            <div className="bg-primary-600 p-4 rounded-2xl mr-4 text-white shadow-lg shadow-primary-500/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Confirm Investment</h2>
              <p className="text-sm text-gray-500 font-medium">Funding <span className="text-primary-600 font-bold">{startupName}</span></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                <span>Your Wallet Balance</span>
                <span className="text-gray-900">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((user?.walletBalance || 0) / 100)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">Investment Amount (USD)</label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  fullWidth
                  className="pl-12 text-xl font-bold py-4 bg-white border-2 border-gray-100 focus:border-primary-500 rounded-xl"
                />
                <DollarSign className="absolute left-4 top-4 text-gray-400" size={24} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 tracking-wide uppercase">Investment Note (Optional)</label>
              <textarea
                className="w-full px-4 py-3 text-gray-700 border-2 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm font-medium"
                rows={3}
                placeholder="Message to the founder..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && (
              <div className="flex items-center p-4 text-sm text-error-700 bg-error-50 border border-error-100 rounded-xl animate-shake">
                <AlertCircle size={18} className="mr-3 flex-shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                fullWidth 
                onClick={onClose}
                disabled={loading}
                className="rounded-xl font-bold py-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                fullWidth 
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-500/30 rounded-xl font-bold py-6 text-lg"
              >
                {loading ? 'Processing...' : 'Invest Funds'}
              </Button>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-bold">
              Secure Transaction powered by Nexus Guard
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
