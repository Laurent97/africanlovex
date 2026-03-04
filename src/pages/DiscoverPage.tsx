import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal,
  X,
  ChevronDown
} from 'lucide-react';
import { ResponsiveProfileCard } from '@/components/profile/ResponsiveProfileCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useKeyboard } from '@/hooks/useKeyboard';

interface UserProfile {
  id: string;
  full_name: string;
  age: number;
  location: string;
  bio: string;
  avatar_url?: string;
  photos?: string[];
  occupation?: string;
  interests?: string[];
  is_verified?: boolean;
  vip_tier?: string;
  distance?: number;
}

const mockProfiles: UserProfile[] = [
  {
    id: '1',
    full_name: 'Sarah Johnson',
    age: 28,
    location: 'Kigali, Rwanda',
    bio: 'Passionate about photography and exploring new cultures. Looking for someone who loves adventure!',
    avatar_url: '/placeholder.svg',
    photos: ['/placeholder.svg'],
    occupation: 'Photographer',
    interests: ['Photography', 'Travel', 'Cooking', 'Music'],
    is_verified: true,
    vip_tier: 'premium',
    distance: 5
  },
  {
    id: '2',
    full_name: 'Michael Chen',
    age: 32,
    location: 'Nairobi, Kenya',
    bio: 'Tech entrepreneur who enjoys hiking and trying new restaurants. Let\'s explore the city together!',
    avatar_url: '/placeholder.svg',
    photos: ['/placeholder.svg'],
    occupation: 'Software Engineer',
    interests: ['Technology', 'Hiking', 'Food', 'Startups'],
    is_verified: true,
    distance: 12
  },
  {
    id: '3',
    full_name: 'Amina Hassan',
    age: 26,
    location: 'Dar es Salaam, Tanzania',
    bio: 'Artist and yoga instructor. Seeking meaningful connections with creative souls.',
    avatar_url: '/placeholder.svg',
    photos: ['/placeholder.svg'],
    occupation: 'Artist',
    interests: ['Art', 'Yoga', 'Meditation', 'Dance'],
    is_verified: false,
    distance: 8
  }
];

export const DiscoverPage = () => {
  const navigate = useNavigate();
  const { isKeyboardVisible } = useKeyboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredResults, setFilteredResults] = useState(mockProfiles);
  
  // Filter states
  const [ageRange, setAgeRange] = useState([25, 35]);
  const [maxDistance, setMaxDistance] = useState([50]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const allInterests = Array.from(
    new Set(mockProfiles.flatMap(profile => profile.interests || []))
  );

  useEffect(() => {
    let filtered = mockProfiles.filter(profile => {
      // Search filter
      const matchesSearch = !searchQuery || 
        profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.bio.toLowerCase().includes(searchQuery.toLowerCase());

      // Age filter
      const matchesAge = profile.age >= ageRange[0] && profile.age <= ageRange[1];

      // Distance filter
      const matchesDistance = !profile.distance || profile.distance <= maxDistance[0];

      // Interests filter
      const matchesInterests = selectedInterests.length === 0 ||
        (profile.interests && selectedInterests.some(interest => 
          profile.interests!.includes(interest)
        ));

      // Verified filter
      const matchesVerified = !showVerifiedOnly || profile.is_verified;

      return matchesSearch && matchesAge && matchesDistance && matchesInterests && matchesVerified;
    });

    setFilteredResults(filtered);
  }, [searchQuery, ageRange, maxDistance, selectedInterests, showVerifiedOnly]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const clearFilters = () => {
    setAgeRange([25, 35]);
    setMaxDistance([50]);
    setSelectedInterests([]);
    setShowVerifiedOnly(false);
  };

  const filterCount = [
    ageRange[0] !== 25 || ageRange[1] !== 35,
    maxDistance[0] !== 50,
    selectedInterests.length > 0,
    showVerifiedOnly
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className={`sticky top-0 z-40 bg-white border-b transition-all duration-300 ${
        isKeyboardVisible ? 'pt-2' : 'pt-4'
      }`}>
        <div className="container mx-auto px-4">
          {/* Title and Filter Button */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-fluid-xl font-bold">Discover</h1>
            <div className="flex items-center gap-2">
              {/* View Toggle - Hidden on mobile */}
              <Button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="hidden sm:flex"
                size="sm"
                variant="outline"
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              
              {/* Filter Button with Badge */}
              <Button
                onClick={() => setShowFilters(true)}
                size="sm"
                className="relative touch-target"
                variant="outline"
              >
                <Filter className="w-4 h-4" />
                {filterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {filterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search people, locations, interests..."
              className="pl-10 pr-4 touch-target"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Active Filters */}
          {filterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {ageRange[0] !== 25 || ageRange[1] !== 35 ? (
                <Badge variant="secondary" className="gap-1">
                  Age: {ageRange[0]}-{ageRange[1]}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setAgeRange([25, 35])} />
                </Badge>
              ) : null}
              {maxDistance[0] !== 50 ? (
                <Badge variant="secondary" className="gap-1">
                  Distance: ≤{maxDistance[0]}km
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setMaxDistance([50])} />
                </Badge>
              ) : null}
              {selectedInterests.map(interest => (
                <Badge key={interest} variant="secondary" className="gap-1">
                  {interest}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => handleInterestToggle(interest)} />
                </Badge>
              ))}
              {showVerifiedOnly && (
                <Badge variant="secondary" className="gap-1">
                  Verified only
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setShowVerifiedOnly(false)} />
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                Clear all
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Filters Bottom Sheet (Mobile) */}
      <BottomSheet 
        open={showFilters} 
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        <div className="p-4 space-y-6">
          {/* Age Range */}
          <div>
            <label className="text-sm font-medium mb-3 block">Age Range</label>
            <div className="px-2">
              <Slider
                value={ageRange}
                onValueChange={setAgeRange}
                min={18}
                max={80}
                step={1}
                className="mb-2"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{ageRange[0]}</span>
                <span>{ageRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <label className="text-sm font-medium mb-3 block">Maximum Distance</label>
            <div className="px-2">
              <Slider
                value={maxDistance}
                onValueChange={setMaxDistance}
                min={1}
                max={200}
                step={1}
                className="mb-2"
              />
              <div className="text-center text-sm text-gray-600">
                ≤{maxDistance[0]} km
              </div>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm font-medium mb-3 block">Interests</label>
            <div className="grid grid-cols-2 gap-2">
              {allInterests.map(interest => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={interest}
                    checked={selectedInterests.includes(interest)}
                    onCheckedChange={() => handleInterestToggle(interest)}
                  />
                  <label 
                    htmlFor={interest} 
                    className="text-sm cursor-pointer"
                  >
                    {interest}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Only */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verified"
              checked={showVerifiedOnly}
              onCheckedChange={(checked) => setShowVerifiedOnly(checked as boolean)}
            />
            <label htmlFor="verified" className="text-sm cursor-pointer">
              Show verified profiles only
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={clearFilters}>
              Clear
            </Button>
            <Button className="flex-1" onClick={() => setShowFilters(false)}>
              Apply Filters
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Results */}
      <div className="container mx-auto px-4 pb-24">
        {/* Results Count */}
        <div className="py-4">
          <p className="text-sm text-gray-500">
            {filteredResults.length} {filteredResults.length === 1 ? 'person' : 'people'} found
          </p>
        </div>

        {/* Responsive Grid */}
        {filteredResults.length > 0 ? (
          <div className={`
            grid gap-4
            ${viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1'
            }
          `}>
            {filteredResults.map(profile => (
              <ResponsiveProfileCard
                key={profile.id}
                profile={profile}
                variant={viewMode === 'list' ? 'horizontal' : 'vertical'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or search terms
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
