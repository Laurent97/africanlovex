import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal,
  X,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { ResponsiveProfileCard } from '@/components/profile/ResponsiveProfileCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useKeyboard } from '@/hooks/useKeyboard';
import { searchProfiles } from '@/lib/profile';
import { useAuth } from '@/hooks/use-auth';
import type { Database } from '@/lib/supabase';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  age: number | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  interests: string[] | null;
  languages: string[] | null;
  gender: 'male' | 'female' | 'other' | null;
  relationship_intention: 'looking_for_love' | 'serious_only' | 'friends_first' | 'sugar_daddy' | 'sugar_mommy' | null;
  is_verified: boolean;
  vip_tier: 'free' | 'basic' | 'premium' | 'platinum' | 'diamond';
  verification_level: 'basic' | 'standard' | 'premium';
  distance?: number;
}


export const DiscoverPage = () => {
  const navigate = useNavigate();
  const { isKeyboardVisible } = useKeyboard();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredResults, setFilteredResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  
  // Filter states
  const [ageRange, setAgeRange] = useState([25, 35]);
  const [maxDistance, setMaxDistance] = useState([50]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  // Fetch profiles with filters
  const fetchProfilesWithFilters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {
        limit: 100,
        age_min: ageRange[0],
        age_max: ageRange[1]
      };
      
      // Add interest filter if selected
      if (selectedInterests.length > 0) {
        filters.interests = selectedInterests;
      }
      
      // Add verified filter
      if (showVerifiedOnly) {
        // This would need to be implemented in the searchProfiles function
        // For now, we'll filter client-side
      }
      
      const { profiles } = await searchProfiles(filters);
      
      console.log('searchProfiles result:', profiles); // Debug log
      console.log('filters applied:', filters); // Debug log
      
      // If no profiles from database, add some mock data for testing
      let profilesData = profiles;
      if (!profiles || profiles.length === 0) {
        console.log('No profiles from database, using mock data');
        profilesData = [
          {
            id: 'mock-1',
            username: 'sarah_j',
            full_name: 'Sarah Johnson',
            avatar_url: null,
            bio: 'Passionate about photography and exploring new cultures. Looking for someone who loves adventure!',
            age: 28,
            gender: 'female' as const,
            country: 'Rwanda',
            city: 'Kigali',
            languages: ['English', 'Kinyarwanda'],
            interests: ['Photography', 'Travel', 'Cooking', 'Music'],
            relationship_intention: 'looking_for_love',
            verification_level: 'standard',
            is_verified: true,
            is_premium: true,
            vip_tier: 'premium',
            coins_balance: 1000,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-2',
            username: 'mike_c',
            full_name: 'Michael Chen',
            avatar_url: null,
            bio: 'Tech entrepreneur who enjoys hiking and trying new restaurants. Let\'s explore the city together!',
            age: 32,
            gender: 'male' as const,
            country: 'Kenya',
            city: 'Nairobi',
            languages: ['English', 'Swahili'],
            interests: ['Technology', 'Hiking', 'Food', 'Startups'],
            relationship_intention: 'serious_only',
            verification_level: 'premium',
            is_verified: true,
            is_premium: true,
            vip_tier: 'premium',
            coins_balance: 1500,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'mock-3',
            username: 'amina_h',
            full_name: 'Amina Hassan',
            avatar_url: null,
            bio: 'Artist and yoga instructor. Seeking meaningful connections with creative souls.',
            age: 26,
            gender: 'female' as const,
            country: 'Tanzania',
            city: 'Dar es Salaam',
            languages: ['English', 'Swahili'],
            interests: ['Art', 'Yoga', 'Meditation', 'Dance'],
            relationship_intention: 'friends_first',
            verification_level: 'basic',
            is_verified: false,
            is_premium: false,
            vip_tier: 'free',
            coins_balance: 500,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      }
      
      // Filter out current user and apply additional filters
      let filteredProfiles = profilesData
        .filter(profile => profile.id !== user?.id);
      
      // Apply verified filter (client-side for now)
      if (showVerifiedOnly) {
        filteredProfiles = filteredProfiles.filter(profile => profile.is_verified);
      }
      
      // Apply search query filter (client-side for now)
      if (searchQuery) {
        filteredProfiles = filteredProfiles.filter(profile => 
          profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.bio?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply distance filter (client-side)
      filteredProfiles = filteredProfiles.filter(profile => {
        const distance = calculateDistance(profile);
        return distance <= maxDistance[0];
      }).map(profile => ({
        ...profile,
        distance: calculateDistance(profile)
      }));
      
      setAllProfiles(filteredProfiles);
      setFilteredResults(filteredProfiles);
      
      console.log('final filtered profiles count:', filteredProfiles.length); // Debug log
      console.log('allProfiles set:', filteredProfiles.length); // Debug log
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all profiles on component mount and when filters change
  useEffect(() => {
    fetchProfilesWithFilters();
  }, [user, ageRange, selectedInterests, showVerifiedOnly, maxDistance]);
  
  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (allProfiles.length > 0) {
        const filtered = allProfiles.filter(profile => 
          !searchQuery || 
          profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.bio?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredResults(filtered);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, allProfiles]);

  // Simple distance calculation (placeholder - would need real geolocation data)
  const calculateDistance = (profile: UserProfile): number => {
    // This is a placeholder - in a real app, you'd calculate based on coordinates
    return Math.floor(Math.random() * 50) + 1; // Random distance 1-50km
  };

  const allInterests = Array.from(
    new Set(allProfiles.flatMap(profile => profile.interests || []))
  );


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
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-gray-500">Loading profiles...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading profiles</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try again
            </Button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
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
                    profile={{
                      ...profile,
                      location: profile.city && profile.country 
                        ? `${profile.city}, ${profile.country}`
                        : profile.country || 'Unknown location',
                      photos: profile.avatar_url ? [profile.avatar_url] : [`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username || profile.full_name || 'User')}&size=400&background=B11D2D&color=fff&format=png`],
                      occupation: undefined // Not in database schema
                    }}
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
          </>
        )}
      </div>
    </div>
  );
};
