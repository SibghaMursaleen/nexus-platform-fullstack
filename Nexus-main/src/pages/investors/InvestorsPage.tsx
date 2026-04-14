import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Loader2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { InvestorCard } from '../../components/investor/InvestorCard';
import api from '../../lib/axios';
import { Investor } from '../../types';

export const InvestorsPage: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/users?role=investor');
        if (response.data.success) {
          // Map MongoDB _id to id if missing
          const fetchedInvestors = response.data.users.map((u: any) => ({
            ...u,
            id: u._id || u.id
          }));
          setInvestors(fetchedInvestors);
        }
      } catch (err) {
        console.error('Failed to fetch investors:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvestors();
  }, []);

  // Get unique investment stages and interests
  const allStages = Array.from(new Set(investors.flatMap((i: Investor) => i.investmentStage || [])));
  const allInterests = Array.from(new Set(investors.flatMap((i: Investor) => i.investmentInterests || [])));
  
  // Filter investors based on search and filters
  const filteredInvestors = investors.filter((investor: Investor) => {
    const matchesSearch = searchQuery === '' || 
      (investor.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (investor.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (investor.investmentInterests || []).some(interest => 
        interest.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStages = selectedStages.length === 0 ||
      (investor.investmentStage || []).some((stage: string) => selectedStages.includes(stage));
    
    const matchesInterests = selectedInterests.length === 0 ||
      (investor.investmentInterests || []).some((interest: string) => selectedInterests.includes(interest));
    
    return matchesSearch && matchesStages && matchesInterests;
  });
  
  const toggleStage = (stage: string) => {
    setSelectedStages((prev: string[]) => 
      prev.includes(stage)
        ? prev.filter((s: string) => s !== stage)
        : [...prev, stage]
    );
  };
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev: string[]) => 
      prev.includes(interest)
        ? prev.filter((i: string) => i !== interest)
        : [...prev, interest]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            </CardHeader>
            <CardBody className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Stage</h3>
                <div className="space-y-2">
                  {allStages.map((stage: string) => (
                    <button
                      key={stage}
                      onClick={() => toggleStage(stage)}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm ${
                        selectedStages.includes(stage)
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {stage}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Investment Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {allInterests.map((interest: string) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? 'primary' : 'gray'}
                      className="cursor-pointer"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Location</h3>
                <div className="space-y-2">
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    San Francisco, CA
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    New York, NY
                  </button>
                  <button className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                    <MapPin size={16} className="mr-2" />
                    Boston, MA
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search investors by name, interests, or keywords..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredInvestors.length} results
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                <Loader2 size={48} className="text-primary-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading investors...</p>
              </div>
            ) : filteredInvestors.length > 0 ? (
              filteredInvestors.map((investor: Investor) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                />
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-xl shadow-sm border border-gray-100 text-center">
                <p className="text-gray-500 font-medium text-lg">No investors found matching your criteria</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};