import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  History, 
  DollarSign, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    fetchWalletData();
    
    // Check for success/cancel redirects from Stripe
    const query = new URLSearchParams(window.location.search);
    if (query.get('success')) {
      toast.success('Funds added successfully!');
      // In real app, we'd verify session_id here
    }
    if (query.get('mock_success') && query.get('tx')) {
        handleConfirmMockDeposit(query.get('tx')!);
    }
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const [userRes, historyRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/payments/history')
      ]);
      
      setBalance(userRes.data.user.walletBalance / 100); // Storage is in cents
      setTransactions(historyRes.data.history);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmMockDeposit = async (txId: string) => {
      try {
          await api.post('/payments/confirm-deposit', { transactionId: txId });
          toast.success('Deposit confirmed! Refreshing balance...');
          fetchWalletData();
          // Clean URL
          window.history.replaceState({}, '', '/dashboard/wallet');
      } catch (err) {
          toast.error('Failed to confirm mock deposit');
      }
  };

  const handleAddFunds = async () => {
    try {
      setIsDepositing(true);
      const amount = 50000; // $500.00 default for demo
      const response = await api.post('/payments/create-checkout-session', { amount });
      
      if (response.data.checkoutUrl) {
         window.location.href = response.data.checkoutUrl;
      }
    } catch (err) {
      toast.error('Could not initiate deposit');
    } finally {
      setIsDepositing(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amt);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nexus Wallet</h1>
          <p className="text-gray-600">Manage your investment funds and track transactions.</p>
        </div>
        <Button 
          leftIcon={<Plus size={18} />}
          onClick={handleAddFunds}
          isLoading={isDepositing}
        >
          Add Funds
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Card */}
        <Card className="md:col-span-2 overflow-hidden bg-gradient-to-br from-primary-700 to-primary-900 border-none shadow-xl">
          <CardBody className="p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-8 -translate-y-8">
              <CreditCard size={200} />
            </div>
            
            <div className="flex justify-between items-start mb-12">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl">
                <DollarSign size={24} className="text-white" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-primary-100 text-sm font-medium tracking-wider uppercase">Available Balance</p>
              <h2 className="text-5xl font-bold tracking-tight">
                {isLoading ? '...' : formatCurrency(balance)}
              </h2>
            </div>

            <div className="mt-12 flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-primary-200 text-xs uppercase font-semibold">Account Holder</p>
                <p className="text-lg font-medium">{user?.name}</p>
              </div>
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-white/10 backdrop-blur-sm" />
                <div className="w-10 h-10 rounded-full border-2 border-white/30 bg-primary-500/50 backdrop-blur-sm" />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-0 border-none">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Insights</h3>
            </CardHeader>
            <CardBody className="pt-4 space-y-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg mr-4 text-green-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Monthly Growth</p>
                  <p className="text-sm font-bold text-gray-900">+12.5%</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg mr-4 text-blue-600">
                  <ArrowUpRight size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Funds Transferred</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(1250)}</p>
                </div>
              </div>

              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <p className="text-xs text-primary-800 font-medium leading-relaxed">
                  Investors typically see a 3x return when funding early-stage SaaS within our ecosystem.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center">
            <History size={20} className="text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
          </div>
        </CardHeader>
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Transaction</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          tx.type === 'deposit' ? 'bg-green-50 text-green-600' : 
                          tx.type === 'transfer_sent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {tx.type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                          <p className="text-xs text-gray-400">
                            {tx.type === 'transfer_received' && tx.sender ? `From ${tx.sender.name}` : ''}
                            {tx.type === 'transfer_sent' && tx.receiver ? `To ${tx.receiver.name}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(tx.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={tx.status === 'completed' ? 'primary' : tx.status === 'pending' ? 'secondary' : 'danger'}
                        className="capitalize"
                      >
                        {tx.status}
                      </Badge>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${
                      tx.amount > 0 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount / 100)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};
