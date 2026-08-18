import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Star, 
  MapPin, 
  Calendar,
  MessageCircle,
  Users,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Quote,
  Award,
  Crown,
  Diamond,
  Flower2,
  Infinity as InfinityIcon,
  Coffee,
  Camera,
  Music,
  Globe,
  Gift
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SuccessStory {
  id: string;
  coupleName: string;
  partner1: {
    name: string;
    age: number;
    profession: string;
    location: string;
    avatar: string;
  };
  partner2: {
    name: string;
    age: number;
    profession: string;
    location: string;
    avatar: string;
  };
  story: string;
  matchDate: string;
  weddingDate?: string;
  children?: number;
  favoriteGift: string;
  testimonial: string;
  photos: string[];
  category: 'recent' | 'featured' | 'long-term' | 'international';
  vipTier: 'free' | 'premium' | 'platinum';
}

const successStories: SuccessStory[] = [
  {
    id: '1',
    coupleName: 'David & Sarah',
    partner1: {
      name: 'David',
      age: 32,
      profession: 'Software Engineer',
      location: 'Kigali, Rwanda',
      avatar: '👨‍💻'
    },
    partner2: {
      name: 'Sarah',
      age: 29,
      profession: 'Marketing Manager',
      location: 'Kigali, Rwanda',
      avatar: '👩‍💼'
    },
    story: 'We met on LoveX during the pandemic when everything was uncertain. David sent me a virtual coffee date invitation, and I was skeptical but curious. Our first video call lasted 4 hours! We discovered we both loved hiking and trying new restaurants. After 6 months of virtual dates, David proposed at Lake Kivu during sunset - exactly where we had our first "real" date.',
    matchDate: '2021-03-15',
    weddingDate: '2022-12-10',
    favoriteGift: 'Eternal Rose',
    testimonial: 'LoveX didn\'t just help us find each other - it helped us find our best friends. The matching algorithm understood our values and sense of humor perfectly.',
    photos: ['lake-kivu-sunset', 'proposal-moment', 'wedding-day'],
    category: 'featured',
    vipTier: 'premium'
  },
  {
    id: '2',
    coupleName: 'Michael & Grace',
    partner1: {
      name: 'Michael',
      age: 35,
      profession: 'Architect',
      location: 'Nairobi, Kenya',
      avatar: '🏗️'
    },
    partner2: {
      name: 'Grace',
      age: 31,
      profession: 'Fashion Designer',
      location: 'Nairobi, Kenya',
      avatar: '👗'
    },
    story: 'I was tired of dating apps where people just wanted to chat endlessly. On LoveX, Michael sent me a Diamond Cluster gift on our first interaction - that caught my attention! We discovered we both had a passion for design and architecture. Our dates involved visiting beautiful buildings in Nairobi and discussing our dreams.',
    matchDate: '2022-07-20',
    weddingDate: '2023-11-25',
    children: 1,
    favoriteGift: 'Diamond Cluster',
    testimonial: 'What makes LoveX special is how people are genuinely looking for meaningful connections. Michael understood my ambition and supported my career.',
    photos: ['nairobi-skyline', 'design-studio', 'baby-announcement'],
    category: 'featured',
    vipTier: 'platinum'
  },
  {
    id: '3',
    coupleName: 'James & Patricia',
    partner1: {
      name: 'James',
      age: 28,
      profession: 'Doctor',
      location: 'Kampala, Uganda',
      avatar: '👨‍⚕️'
    },
    partner2: {
      name: 'Patricia',
      age: 26,
      profession: 'Teacher',
      location: 'Kampala, Uganda',
      avatar: '👩‍🏫'
    },
    story: 'As a doctor, my schedule is crazy. LoveX\'s video dating feature was perfect - we could have meaningful conversations even when I was on call. Patricia\'s patience and understanding during my long shifts made me fall in love. We got married at Entebbe Botanical Gardens, surrounded by nature.',
    matchDate: '2023-01-10',
    favoriteGift: 'Promise Ring',
    testimonial: 'LoveX brought together two people who might never have met otherwise. The video dating feature helped us connect deeply before meeting in person.',
    photos: ['entebbe-gardens', 'hospital-wedding', 'honeymoon-zanzibar'],
    category: 'recent',
    vipTier: 'premium'
  },
  {
    id: '4',
    coupleName: 'Alex & Sophie',
    partner1: {
      name: 'Alex',
      age: 30,
      profession: 'Pilot',
      location: 'Dar es Salaam, Tanzania',
      avatar: '✈️'
    },
    partner2: {
      name: 'Sophie',
      age: 27,
      profession: 'Chef',
      location: 'Dar es Salaam, Tanzania',
      avatar: '👩‍🍳'
    },
    story: 'Long-distance relationships are tough, but LoveX made it work. I\'m a pilot flying across East Africa, and Sophie is a chef in Dar es Salaam. We\'d have video dates between my flights, and she\'d cook amazing meals while we talked. After 8 months, I proposed at 30,000 feet! Now we\'re planning our restaurant.',
    matchDate: '2022-11-05',
    favoriteGift: 'Shooting Star',
    testimonial: 'LoveX proves that distance is just a number when you find the right person. The video dating and gift features kept our romance alive.',
    photos: ['proposal-flight', 'restaurant-opening', 'zanzibar-getaway'],
    category: 'international',
    vipTier: 'platinum'
  },
  {
    id: '5',
    coupleName: 'Robert & Aisha',
    partner1: {
      name: 'Robert',
      age: 33,
      profession: 'Tour Guide',
      location: 'Arusha, Tanzania',
      avatar: '🦁️'
    },
    partner2: {
      name: 'Aisha',
      age: 29,
      profession: 'Wildlife Photographer',
      location: 'Arusha, Tanzania',
      avatar: '📸'
    },
    story: 'We both love adventure and wildlife! Robert takes tourists on safari, and I photograph animals. LoveX matched us because we share the same passion for nature. Our dates included safari drives, photography sessions, and camping under the stars. We got married at the base of Mount Kilimanjaro.',
    matchDate: '2021-09-12',
    weddingDate: '2023-06-15',
    favoriteGift: 'Gorilla Trek',
    testimonial: 'LoveX understood that we wanted someone who shared our adventurous spirit. Now we run wildlife photography tours together!',
    photos: ['kilimanjaro-wedding', 'safari-adventure', 'wildlife-photos'],
    category: 'long-term',
    vipTier: 'premium'
  },
  {
    id: '6',
    coupleName: 'Pierre & Marie',
    partner1: {
      name: 'Pierre',
      age: 31,
      profession: 'Coffee Exporter',
      location: 'Bujumbura, Burundi',
      avatar: '☕'
    },
    partner2: {
      name: 'Marie',
      age: 28,
      profession: 'Journalist',
      location: 'Bujumbura, Burundi',
      avatar: '📰'
    },
    story: 'I export Burundi\'s amazing coffee, and Marie tells stories about our beautiful country. LoveX connected us through our shared love for Burundian culture. Our dates involved coffee tasting sessions and visits to local markets. Marie wrote a beautiful article about our love story that was published regionally.',
    matchDate: '2023-03-20',
    favoriteGift: 'Coffee Date',
    testimonial: 'LoveX celebrates East African culture and connections. We found someone who appreciates our home country as much as we do.',
    photos: ['coffee-plantation', 'market-visits', 'published-story'],
    category: 'recent',
    vipTier: 'free'
  }
];

export default function SuccessStories() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const navigate = useNavigate();

  const filteredStories = selectedCategory === 'all' 
    ? successStories 
    : successStories.filter(story => story.category === selectedCategory);

  const categories = [
    { key: 'all', label: 'All Stories', count: successStories.length },
    { key: 'featured', label: 'Featured', count: successStories.filter(s => s.category === 'featured').length },
    { key: 'recent', label: 'Recent', count: successStories.filter(s => s.category === 'recent').length },
    { key: 'long-term', label: 'Long-term', count: successStories.filter(s => s.category === 'long-term').length },
    { key: 'international', label: 'International', count: successStories.filter(s => s.category === 'international').length }
  ];

  const getVipBadge = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0"><Crown className="w-3 h-3 mr-1" /> Platinum</Badge>;
      case 'premium':
        return <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0"><Star className="w-3 h-3 mr-1" /> Premium</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-rose-50 dark:from-gray-900 dark:to-rose-950/20">
      {/* Header */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl" />
          
          {/* Floating Hearts */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, -10, 0],
                rotate: [0, 10, -10, 0],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 2,
                ease: "easeInOut",
              }}
            >
              <Heart className="w-6 h-6 text-rose-200/30 dark:text-rose-500/10" />
            </motion.div>
          ))}
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-medium mb-6 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Success Stories</span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Love Stories
              </span>
              <br />
              <span className="text-gray-800 dark:text-gray-200">That Came True</span>
            </h1>

            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Real couples from across East Africa who found their soulmates on LoveX. 
              From virtual dates to wedding days, these are the stories that inspire us every day.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-rose-600">50,000+</div>
                <div className="text-sm text-gray-500">Couples Connected</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-pink-600">1,200+</div>
                <div className="text-sm text-gray-500">Weddings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-purple-600">85%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
          {categories.map((category) => (
            <Button
              key={category.key}
              variant={selectedCategory === category.key ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.key)}
              className={`relative overflow-hidden ${
                selectedCategory === category.key 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0' 
                  : 'border-rose-200 text-rose-600 hover:bg-rose-50'
              }`}
            >
              {category.label}
              <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {category.count}
              </span>
            </Button>
          ))}
        </div>
      </section>

      {/* Stories Grid */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredStories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
              onClick={() => setSelectedStory(story)}
            >
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6">
                  {/* Couple Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-200 to-pink-200 flex items-center justify-center text-2xl border-2 border-white">
                          {story.partner1.avatar}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-200 to-indigo-200 flex items-center justify-center text-2xl border-2 border-white">
                          {story.partner2.avatar}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">{story.coupleName}</h3>
                        <p className="text-sm text-gray-500">
                          {story.partner1.location} • {story.matchDate}
                        </p>
                      </div>
                    </div>
                    {getVipBadge(story.vipTier)}
                  </div>

                  {/* Story Preview */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                    {story.story}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {story.weddingDate && (
                      <Badge variant="secondary" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        Married {story.weddingDate}
                      </Badge>
                    )}
                    {story.children && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {story.children} Children
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-rose-200 text-rose-600">
                      <Gift className="w-3 h-3 mr-1" />
                      {story.favoriteGift}
                    </Badge>
                  </div>

                  {/* Testimonial */}
                  <div className="border-t pt-4">
                    <div className="flex items-start gap-2">
                      <Quote className="w-4 h-4 text-rose-400 mt-1 flex-shrink-0" />
                      <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                        "{story.testimonial}"
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story Detail Modal */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedStory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-64 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-600">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {selectedStory.coupleName}
                  </h2>
                  <p className="text-white/90">
                    {selectedStory.matchDate} {selectedStory.weddingDate && `• Married ${selectedStory.weddingDate}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={() => setSelectedStory(null)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 sm:p-8">
                {/* Full Story */}
                <div className="prose prose prose-gray dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedStory.story}
                  </p>
                </div>

                {/* Couple Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      {selectedStory.partner1.avatar} {selectedStory.partner1.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedStory.partner1.profession}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedStory.partner1.location}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      {selectedStory.partner2.avatar} {selectedStory.partner2.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">{selectedStory.partner2.profession}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedStory.partner2.location}
                    </p>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <Quote className="w-6 h-6 text-rose-400 flex-shrink-0" />
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        "{selectedStory.testimonial}"
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        - {selectedStory.coupleName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedStory(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                    onClick={() => {
                      setSelectedStory(null);
                      navigate('/gifts');
                    }}
                  >
                    Send Them a Gift
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready for Your Own Love Story?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of couples who found their perfect match on LoveX. 
            Your soulmate is waiting for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
              onClick={() => navigate('/auth')}
            >
              Start Your Journey
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/gifts')}
            >
              Send a Gift
            </Button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
