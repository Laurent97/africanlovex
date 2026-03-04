import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Briefcase, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

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

interface ResponsiveProfileCardProps {
  profile: UserProfile;
  variant?: 'vertical' | 'horizontal' | 'compact';
  showActions?: boolean;
}

export const ResponsiveProfileCard: React.FC<ResponsiveProfileCardProps> = ({ 
  profile, 
  variant = 'vertical',
  showActions = true
}) => {
  const navigate = useNavigate();
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleProfileClick = () => {
    navigate(`/profile/${profile.id}`);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle like action
  };

  const handlePass = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle pass action
  };

  // Compact variant for mobile lists
  if (variant === 'compact') {
    return (
      <Card className="hover-lift cursor-pointer" onClick={handleProfileClick}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={profile.avatar_url} 
                  onLoad={() => setIsImageLoading(false)}
                />
                <AvatarFallback className="text-lg">
                  {profile.full_name[0]}
                </AvatarFallback>
              </Avatar>
              {profile.is_verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg truncate">
                  {profile.full_name}, {profile.age}
                </h3>
                {profile.vip_tier && profile.vip_tier !== 'free' && (
                  <Badge variant="secondary" className="text-xs">
                    {profile.vip_tier}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
                {profile.distance && (
                  <span>• {profile.distance} km</span>
                )}
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2">
                {profile.bio}
              </p>
            </div>

            {showActions && (
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="touch-target"
                  onClick={handlePass}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  className="touch-target bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={handleLike}
                >
                  <Heart className="w-4 h-4 fill-white" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Horizontal variant for tablet/desktop list views
  if (variant === 'horizontal') {
    return (
      <Card className="hover-lift cursor-pointer" onClick={handleProfileClick}>
        <CardContent className="p-6">
          <div className="flex gap-6">
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={profile.photos?.[0] || profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                  onLoad={() => setIsImageLoading(false)}
                />
              </div>
              {profile.is_verified && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-semibold">
                  {profile.full_name}, {profile.age}
                </h3>
                {profile.vip_tier && profile.vip_tier !== 'free' && (
                  <Badge variant="secondary">
                    {profile.vip_tier}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                {profile.occupation && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.occupation}</span>
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 mb-3 line-clamp-3">
                {profile.bio}
              </p>
              
              {profile.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.interests.slice(0, 4).map((interest, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                  {profile.interests.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.interests.length - 4}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {showActions && (
              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="touch-target"
                  onClick={handlePass}
                >
                  <Heart className="w-5 h-5" />
                </Button>
                <Button
                  size="lg"
                  className="touch-target bg-gradient-to-r from-purple-600 to-pink-600"
                  onClick={handleLike}
                >
                  <Heart className="w-5 h-5 fill-white" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Vertical variant (default for mobile grid)
  return (
    <Card className="hover-lift cursor-pointer overflow-hidden group" onClick={handleProfileClick}>
      <div className="aspect-[3/4] relative">
        <img
          src={profile.photos?.[0] || profile.avatar_url}
          alt={profile.full_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onLoad={() => setIsImageLoading(false)}
        />
        
        {/* Overlay with info - visible on hover on desktop, always on mobile */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent 
                      md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg">
                {profile.full_name}, {profile.age}
              </h3>
              {profile.is_verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
              {profile.distance && (
                <span>• {profile.distance} km</span>
              )}
            </div>
          </div>
        </div>

        {/* VIP Badge */}
        {profile.vip_tier && profile.vip_tier !== 'free' && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              {profile.vip_tier}
            </Badge>
          </div>
        )}
      </div>
      
      {/* Mobile-only info below image */}
      <div className="p-4 md:hidden">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-lg">
            {profile.full_name}, {profile.age}
          </h3>
          {profile.is_verified && (
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <MapPin className="w-4 h-4" />
          <span>{profile.location}</span>
          {profile.distance && (
            <span>• {profile.distance} km</span>
          )}
        </div>
      </div>

      {/* Action buttons for mobile grid */}
      {showActions && (
        <div className="p-4 pt-0 md:hidden flex gap-3">
          <Button
            variant="outline"
            className="flex-1 touch-target"
            onClick={handlePass}
          >
            <Heart className="w-4 h-4" />
          </Button>
          <Button
            className="flex-1 touch-target bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={handleLike}
          >
            <Heart className="w-4 h-4 fill-white" />
          </Button>
        </div>
      )}
    </Card>
  );
};
