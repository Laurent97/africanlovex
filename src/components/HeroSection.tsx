import { Heart, Sparkles, Globe, Shield, Gift, Video, Crown, Star, ChevronRight, MessageCircle, Users, Zap, Diamond, Gem, Infinity, Feather, Flower2, Coffee, Music, Award, Flame } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import heroBg from "@/assets/hero-bg.jpg";
import Logo from "./Logo";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] as const },
  }),
};

export default function HeroSection() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartMatching = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth?redirect=/dashboard');
    }
  };

  const floatingGifts = [
    { icon: <Heart className="w-6 h-6 text-pink-300/30" />, delay: 0 },
    { icon: <Diamond className="w-6 h-6 text-blue-300/30" />, delay: 2 },
    { icon: <Gem className="w-6 h-6 text-purple-300/30" />, delay: 4 },
    { icon: <Star className="w-6 h-6 text-yellow-300/30" />, delay: 6 },
    { icon: <Crown className="w-6 h-6 text-amber-300/30" />, delay: 8 },
    { icon: <Flower2 className="w-6 h-6 text-pink-300/30" />, delay: 10 },
    { icon: <Coffee className="w-6 h-6 text-amber-300/30" />, delay: 12 },
    { icon: <Music className="w-6 h-6 text-indigo-300/30" />, delay: 14 },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Romantic Gradient */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Romantic sunset over East Africa" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-rose-900/80 via-purple-900/70 to-indigo-900/90" />
      </div>

      {/* Romantic Pattern Overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(255,192,203,0.3) 0px, transparent 50px),
                            radial-gradient(circle at 80% 70%, rgba(255,105,180,0.3) 0px, transparent 50px),
                            radial-gradient(circle at 40% 60%, rgba(147,112,219,0.3) 0px, transparent 50px)`,
          backgroundSize: '200px 200px'
        }} />
      </div>

      {/* Floating Romantic Icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingGifts.map((gift, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, 15, -15, 0],
              rotate: [0, 10, -10, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8 + index * 2,
              repeat: Infinity,
              delay: gift.delay,
              ease: "easeInOut",
            }}
          >
            {gift.icon}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        {/* Animated Logo with Modern Design */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 shadow-2xl animate-pulse-glow relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 blur-xl opacity-70" />
            <Logo />
          </div>
        </motion.div>

        {/* Title with Romantic Gradient */}
        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tight"
        >
          <span className="bg-gradient-to-r from-rose-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">
            Love
          </span>
          <span className="bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent">
            X
          </span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-rose-100/90 text-lg md:text-xl mb-3 font-light tracking-wide"
        >
          Where Hearts Connect Across East Africa
        </motion.p>

        <motion.p
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="text-amber-200/90 text-base md:text-lg mb-12 italic font-display"
        >
          "Find your perfect match in a world of possibilities"
        </motion.p>

        {/* CTA Buttons with Romantic Design */}
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16"
        >
          <button 
            onClick={handleStartMatching}
            className="group relative px-10 py-4 rounded-full text-lg font-semibold text-white overflow-hidden shadow-2xl hover-lift"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 transition-transform group-hover:scale-110" />
            <span className="relative flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Start Your Journey
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <Link 
            to="/about" 
            className="group relative px-10 py-4 rounded-full text-lg font-semibold overflow-hidden border-2 border-amber-200/50 hover:border-amber-200 transition-colors"
          >
            <span className="relative text-amber-200 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Discover More
            </span>
          </Link>
        </motion.div>

        {/* Romantic Country Showcase */}
        <motion.div
          custom={5}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
            <span className="text-rose-200/80 text-sm font-light tracking-widest">CONNECTING</span>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" />
          </div>
          
          <div className="flex items-center justify-center gap-6 text-3xl">
            {[
              { flag: "🇷🇼", name: "Rwanda", color: "from-blue-400 to-green-400" },
              { flag: "🇧🇮", name: "Burundi", color: "from-red-400 to-green-400" },
              { flag: "🇺🇬", name: "Uganda", color: "from-yellow-400 to-red-400" },
              { flag: "🇰🇪", name: "Kenya", color: "from-green-400 to-red-400" },
              { flag: "🇹🇿", name: "Tanzania", color: "from-green-400 to-blue-400" },
              { flag: "🇨🇩", name: "Congo", color: "from-blue-400 to-yellow-400" },
            ].map((country, i) => (
              <motion.div
                key={country.flag}
                className="relative group"
                whileHover={{ scale: 1.2, y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="cursor-pointer text-4xl filter drop-shadow-lg">
                  {country.flag}
                </span>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <span className={`text-xs font-medium text-white bg-gradient-to-r ${country.color} px-3 py-1 rounded-full shadow-lg`}>
                    {country.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Romantic Stats with Icons */}
        <motion.div
          custom={6}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
        >
          {[
            { 
              value: "100K+", 
              label: "Active Hearts", 
              icon: <Users className="w-5 h-5 text-rose-300" />,
              gradient: "from-rose-400 to-pink-400"
            },
            { 
              value: "50K+", 
              label: "Love Connections", 
              icon: <Heart className="w-5 h-5 text-pink-300" />,
              gradient: "from-pink-400 to-purple-400"
            },
            { 
              value: "6", 
              label: "East African Nations", 
              icon: <Globe className="w-5 h-5 text-purple-300" />,
              gradient: "from-purple-400 to-indigo-400"
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="relative group"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${stat.gradient} mb-4 shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-rose-200 to-purple-200 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-rose-100/70 text-sm tracking-wide">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Romantic Gift Showcase */}
        <motion.div
          custom={7}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-16 flex items-center justify-center gap-4"
        >
          <div className="flex -space-x-3">
            {[
              { icon: <Diamond className="w-4 h-4 text-blue-300" />, tooltip: "Diamond Cluster" },
              { icon: <Gem className="w-4 h-4 text-purple-300" />, tooltip: "Precious Gem" },
              { icon: <Crown className="w-4 h-4 text-amber-300" />, tooltip: "Royal Crown" },
              { icon: <Star className="w-4 h-4 text-yellow-300" />, tooltip: "Shooting Star" },
              { icon: <Flower2 className="w-4 h-4 text-pink-300" />, tooltip: "Eternal Rose" },
              { icon: <Infinity className="w-4 h-4 text-indigo-300" />, tooltip: "Infinity Heart" },
            ].map((gift, i) => (
              <motion.div
                key={i}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group relative"
                whileHover={{ y: -5 }}
              >
                {gift.icon}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <span className="text-xs text-white bg-purple-500/80 px-2 py-1 rounded">
                    {gift.tooltip}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <span className="text-rose-200/60 text-sm ml-2">Romantic gifts await</span>
        </motion.div>
      </div>

      {/* Romantic Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="relative">
          <div className="w-7 h-12 rounded-full border-2 border-rose-300/30 flex justify-center pt-2">
            <motion.div 
              className="w-1.5 h-3 rounded-full bg-gradient-to-b from-rose-400 to-purple-400"
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
          <Heart className="absolute -right-6 top-1/2 -translate-y-1/2 w-3 h-3 text-rose-300/50 animate-pulse" />
          <Heart className="absolute -left-6 top-1/2 -translate-y-1/2 w-3 h-3 text-purple-300/50 animate-pulse" />
        </div>
      </motion.div>
    </section>
  );
}