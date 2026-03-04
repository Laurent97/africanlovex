import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Users, 
  Heart, 
  MessageCircle, 
  Star, 
  MapPin, 
  Calendar,
  Settings,
  ChevronRight,
  Grid,
  List,
  User,
  Camera,
  Music,
  Coffee,
  Briefcase,
  Globe,
  Shield,
  Sparkles,
  TrendingUp,
  Clock,
  Eye,
  ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  bio: string;
  avatar_url: string;
  interests: string[];
  relationship_intention: string;
  verification_level: string;
  last_seen: string;
  is_online: boolean;
  photos_count: number;
  premium: boolean;
}

interface SystemStats {
  total_users: number;
  online_users: number;
  new_users_today: number;
  active_chats: number;
  matches_made: number;
  premium_users: number;
}

const SystemBrowser: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('recent');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');

  // Mock data for demonstration
  useEffect(() => {
    const mockProfiles: Profile[] = [
      {
        id: '1',
        username: 'sarah_25',
        full_name: 'Sarah Johnson',
        age: 25,
        gender: 'female',
        city: 'Kigali',
        country: 'Rwanda',
        bio: 'Love hiking, coffee, and deep conversations. Looking for someone who shares my passion for adventure!',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b5c6?w=150&h=150&fit=crop&crop=face',
        interests: ['Travel', 'Coffee', 'Nature', 'Photography'],
        relationship_intention: 'looking_for_love',
        verification_level: 'verified',
        last_seen: '2 minutes ago',
        is_online: true,
        photos_count: 5,
        premium: true
      },
      {
        id: '2',
        username: 'mike_30',
        full_name: 'Michael Chen',
        age: 30,
        gender: 'male',
        city: 'Nairobi',
        country: 'Kenya',
        bio: 'Tech enthusiast who loves exploring new restaurants and weekend getaways. Let\'s create some memories!',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        interests: ['Technology', 'Food', 'Travel', 'Music'],
        relationship_intention: 'serious_only',
        verification_level: 'verified',
        last_seen: '5 minutes ago',
        is_online: true,
        photos_count: 8,
        premium: false
      },
      {
        id: '3',
        username: 'amina_28',
        full_name: 'Amina Hassan',
        age: 28,
        gender: 'female',
        city: 'Kampala',
        country: 'Uganda',
        bio: 'Artist and dreamer. Love painting, poetry, and quiet evenings. Seeking a genuine connection.',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        interests: ['Art', 'Music', 'Reading', 'Nature'],
        relationship_intention: 'friends_first',
        verification_level: 'basic',
        last_seen: '1 hour ago',
        is_online: false,
        photos_count: 3,
        premium: false
      },
      {
        id: '4',
        username: 'david_32',
        full_name: 'David Mwangi',
        age: 32,
        gender: 'male',
        city: 'Dar es Salaam',
        country: 'Tanzania',
        bio: 'Entrepreneur with a passion for life. Enjoy sports, travel, and meaningful conversations.',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        interests: ['Sports', 'Business', 'Travel', 'Cooking'],
        relationship_intention: 'looking_for_love',
        verification_level: 'verified',
        last_seen: '30 minutes ago',
        is_online: true,
        photos_count: 6,
        premium: true
      },
      {
        id: '5',
        username: 'grace_26',
        full_name: 'Grace Nakato',
        age: 26,
        gender: 'female',
        city: 'Bujumbura',
        country: 'Burundi',
        bio: 'Teacher and mother. Love reading, nature walks, and quality time with loved ones.',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        interests: ['Reading', 'Nature', 'Education', 'Family'],
        relationship_intention: 'serious_only',
        verification_level: 'verified',
        last_seen: '3 hours ago',
        is_online: false,
        photos_count: 4,
        premium: false
      }
    ];

    const mockStats: SystemStats = {
      total_users: 15420,
      online_users: 3421,
      new_users_today: 127,
      active_chats: 892,
      matches_made: 3421,
      premium_users: 892
    };

    setTimeout(() => {
      setProfiles(mockProfiles);
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         profile.bio.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'online' && profile.is_online) ||
                         (selectedFilter === 'verified' && profile.verification_level === 'verified') ||
                         (selectedFilter === 'premium' && profile.premium);
    
    return matchesSearch && matchesFilter;
  });

  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    switch (selectedSort) {
      case 'recent':
        return 0; // Keep original order
      case 'name':
        return a.full_name.localeCompare(b.full_name);
      case 'age':
        return a.age - b.age;
      case 'popular':
        return b.photos_count - a.photos_count;
      default:
        return 0;
    }
  });

  const handleProfileClick = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  const handleSendMessage = (profileId: string) => {
    navigate(`/chat?user=${profileId}`);
  };

  const renderProfileCard = (profile: Profile) => (
    <Card key={profile.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardHeader className="p-0">
        <div className="relative">
          <img
            src={profile.avatar_url}
            alt={profile.full_name}
            className="w-full h-48 object-cover rounded-t-lg"
            onClick={() => handleProfileClick(profile.id)}
          />
          <div className="absolute top-2 right-2 flex gap-1">
            {profile.is_online && (
              <Badge className="bg-green-500 text-white">
                <div className="w-2 h-2 bg-white rounded-full mr-1" />
                Online
              </Badge>
            )}
            {profile.verification_level === 'verified' && (
              <Badge className="bg-blue-500 text-white">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            {profile.premium && (
              <Badge className="bg-purple-500 text-white">
                <Star className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
            {profile.age}, {profile.gender}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-purple-600 transition-colors">
              {profile.full_name}
            </h3>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              {profile.city}
            </div>
            <div className="text-xs text-gray-400">
              {profile.last_seen}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {profile.bio}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {profile.interests.slice(0, 3).map((interest, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
          {profile.interests.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{profile.interests.length - 3}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center">
              <Camera className="w-3 h-3 mr-1" />
              {profile.photos_count}
            </span>
            <span className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              {profile.relationship_intention.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => handleProfileClick(profile.id)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View Profile
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendMessage(profile.id)}
          >
            <MessageCircle className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderProfileList = (profile: Profile) => (
    <Card key={profile.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              className="w-16 h-16 rounded-full object-cover"
              onClick={() => handleProfileClick(profile.id)}
            />
            {profile.is_online && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{profile.full_name}</h3>
              {profile.verification_level === 'verified' && (
                <Shield className="w-4 h-4 text-blue-500" />
              )}
              {profile.premium && (
                <Star className="w-4 h-4 text-purple-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">@{profile.username} • {profile.age}, {profile.gender}</p>
            <p className="text-sm text-gray-600 mb-2 line-clamp-1">{profile.bio}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {profile.city}, {profile.country}
              </span>
              <span className="flex items-center">
                <Camera className="w-3 h-3 mr-1" />
                {profile.photos_count} photos
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {profile.last_seen}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={() => handleProfileClick(profile.id)}
            >
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSendMessage(profile.id)}
            >
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system browser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">System Browser</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.total_users.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total Users</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.online_users.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Online Now</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.new_users_today}</div>
                <div className="text-xs text-gray-600">New Today</div>
              </div>
              <div className="text-center p-2 bg-pink-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">{stats.active_chats}</div>
                <div className="text-xs text-gray-600">Active Chats</div>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.matches_made.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Matches Made</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.premium_users}</div>
                <div className="text-xs text-gray-600">Premium Users</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="nearby">Nearby</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search profiles by name, username, or bio..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Profiles</SelectItem>
                    <SelectItem value="online">Online Only</SelectItem>
                    <SelectItem value="verified">Verified Only</SelectItem>
                    <SelectItem value="premium">Premium Only</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={selectedSort} onValueChange={setSelectedSort}>
                  <SelectTrigger className="w-full md:w-40">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="age">Age</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {sortedProfiles.length} Profiles Found
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4" />
                <span>Updated 2 minutes ago</span>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProfiles.map(renderProfileCard)}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProfiles.map(renderProfileList)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Trending Profiles
              </h2>
              <p className="text-gray-600 mb-6">
                Most popular and active profiles this week
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProfiles.slice(0, 6).map(renderProfileCard)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nearby" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Profiles Near You
              </h2>
              <p className="text-gray-600 mb-6">
                Discover people in your area
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProfiles.slice(0, 3).map(renderProfileCard)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Recent Activity
              </h2>
              <p className="text-gray-600 mb-6">
                Latest updates from the community
              </p>
              <div className="space-y-4">
                {sortedProfiles.slice(0, 5).map(profile => (
                  <div key={profile.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{profile.full_name}</div>
                      <div className="text-sm text-gray-500">
                        Updated profile • {profile.last_seen}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SystemBrowser;
