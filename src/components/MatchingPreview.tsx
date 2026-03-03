import { motion } from "framer-motion";
import { 
  Heart, 
  X, 
  RotateCcw, 
  MapPin, 
  Briefcase, 
  Star, 
  CheckCircle,
  Sparkles,
  Gem,
  Crown,
  Coffee,
  Music,
  Camera,
  Globe,
  MessageCircle,
  Shield,
  Award
} from "lucide-react";
import profile1 from "@/assets/profile-1.jpg";
import profile2 from "@/assets/profile-2.jpg";
import profile3 from "@/assets/profile-3.jpg";

const profiles = [
  {
    name: "Isabella",
    age: 26,
    profession: "Fashion Designer",
    location: "Kigali, Rwanda",
    bio: "Creating beauty through fashion. Looking for someone who appreciates art and culture.",
    interests: ["🎨 Art", "✈️ Travel", "📸 Photography", "☕ Coffee"],
    image: profile1,
    verified: true,
    vipTier: "premium",
    matchScore: 95,
    romanticMessage: "You had me at hello",
    traits: ["Creative", "Adventurous", "Romantic"]
  },
  {
    name: "Alexander",
    age: 29,
    profession: "Architect",
    location: "Nairobi, Kenya",
    bio: "Designing dreams and building futures. Seeking a partner for life's greatest adventure.",
    interests: ["🏛️ Architecture", "🏃 Running", "📚 Reading", "🌅 Sunsets"],
    image: profile2,
    verified: true,
    vipTier: "platinum",
    matchScore: 98,
    romanticMessage: "Every love story is beautiful, but ours will be my favorite",
    traits: ["Ambitious", "Thoughtful", "Loyal"]
  },
  {
    name: "Sofia",
    age: 24,
    profession: "Chef",
    location: "Kampala, Uganda",
    bio: "Cooking with love and passion. Searching for someone to share life's flavors.",
    interests: ["🍳 Cooking", "🎵 Music", "💃 Dancing", "🌿 Nature"],
    image: profile3,
    verified: false,
    vipTier: "free",
    matchScore: 92,
    romanticMessage: "Love is the secret ingredient",
    traits: ["Passionate", "Warm", "Creative"]
  },
];

export default function MatchingPreview() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50 dark:from-gray-950 dark:to-rose-950/20 relative overflow-hidden">
      {/* Romantic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl" />
        
        {/* Floating Hearts */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, -15, 0],
              rotate: [0, 15, -15, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 12 + i * 3,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 2,
              ease: "easeInOut",
            }}
          >
            <Heart className="w-6 h-6 text-rose-200/30 dark:text-rose-500/10" />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-medium mb-6 shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span>Meet Your Match</span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Find Your Soulmate
            </span>
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Our intelligent matching algorithm connects you with compatible partners 
            across East Africa based on shared values, interests, and chemistry.
          </p>
        </motion.div>

        {/* Profiles Display */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-6 sm:gap-8 items-stretch px-4">
          {profiles.map((profile, i) => (
            <motion.div
              key={profile.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -12, transition: { duration: 0.2 } }}
              className={`relative ${i === 1 ? "z-10" : "z-0"} w-full sm:w-auto max-w-sm mx-auto sm:mx-0`}
            >
              {/* Match Score Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 + 0.3, type: "spring", stiffness: 200 }}
                className="absolute -top-4 -right-4 z-20"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center shadow-xl">
                    <div className="text-center">
                      <div className="text-white font-bold text-lg">{profile.matchScore}%</div>
                      <div className="text-white/80 text-[8px] uppercase tracking-wider">Match</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 blur-xl opacity-50" />
                </div>
              </motion.div>

              {/* Main Profile Card */}
              <div className={`w-full max-w-sm sm:w-80 rounded-[32px] bg-white dark:bg-gray-900 shadow-2xl overflow-hidden ${
                i === 1 ? 'ring-4 ring-rose-400/50 ring-offset-4 ring-offset-white dark:ring-offset-gray-900' : ''
              }`}>
                {/* Image Section */}
                <div className="relative h-64 sm:h-80 overflow-hidden group">
                  <motion.img
                    src={profile.image}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* VIP Badge */}
                  {profile.vipTier === 'platinum' && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-medium shadow-lg">
                        <Crown className="w-3 h-3" />
                        <span>Platinum</span>
                      </div>
                    </div>
                  )}

                  {/* Verified Badge */}
                  {profile.verified && (
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/90 backdrop-blur-sm text-white text-xs font-medium shadow-lg">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </div>
                    </div>
                  )}

                  {/* Profile Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-display text-xl sm:text-2xl font-bold mb-1">
                      {profile.name}, {profile.age}
                    </h3>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-white/90 text-xs sm:text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        <span>{profile.profession}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{profile.location}</span>
                      </div>
                    </div>

                    {/* Romantic Message */}
                    <motion.p 
                      className="text-white/80 text-sm italic border-l-2 border-rose-400 pl-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      "{profile.romanticMessage}"
                    </motion.p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  {/* Bio */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {profile.bio}
                  </p>

                  {/* Traits */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profile.traits.map((trait) => (
                      <span 
                        key={trait} 
                        className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-700 dark:text-rose-300 font-medium"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>

                  {/* Interests */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {profile.interests.map((interest) => (
                      <span 
                        key={interest} 
                        className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -10 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl relative group"
                    >
                      <Heart className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all"
                    >
                      <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                    >
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Decorative Elements for Middle Card */}
              {i === 1 && (
                <>
                  <motion.div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    {[...Array(3)].map((_, idx) => (
                      <div key={idx} className="w-2 h-2 rounded-full bg-rose-400" />
                    ))}
                  </motion.div>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-sm font-medium text-rose-500 bg-white dark:bg-gray-900 px-4 py-1 rounded-full shadow-lg">
                      🌟 Top Pick
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <button className="group relative px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg font-semibold text-white overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 transition-transform group-hover:scale-110" />
            <span className="relative flex items-center gap-2 mx-auto justify-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Start Your Love Story Today</span>
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </span>
          </button>
          
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4">
            Join 50,000+ couples who found their perfect match on LoveX
          </p>
        </motion.div>
      </div>
    </section>
  );
}