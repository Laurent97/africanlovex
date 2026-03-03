import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Globe, Shield, Gift, Video, Crown, Users, MapPin, Sparkles, Star, CheckCircle, ChevronRight, Music, Coffee, Moon, Sun, Leaf, Droplet } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const About = () => {
  const features = [
    {
      icon: <Heart className="w-8 h-8" style={{ color: 'var(--umutara-red)' }} />,
      title: "Ubwiruze bw'Urukundo",
      subtitle: "Smart Matching",
      description: "AI-powered compatibility scoring considering culture, language, interests, and relationship goals with 95% accuracy.",
      highlight: "95% Match Rate",
      bgPattern: "imigongo-pattern-subtle"
    },
    {
      icon: <Gift className="w-8 h-8" style={{ color: 'var(--igikari-purple)' }} />,
      title: "Impano z'Umwimerere",
      subtitle: "Cultural Gifts",
      description: "Authentic East African themed gifts with local names like 'Agasatsi', 'Inka', and 'Intore Crown'.",
      highlight: "30+ Unique Gifts",
      bgPattern: "agaseke-pattern"
    },
    {
      icon: <Video className="w-8 h-8" style={{ color: 'var(--agaciro-gold)' }} />,
      title: "Amaradiyo Mazima",
      subtitle: "Live Streaming",
      description: "Real-time video rooms with Virunga backgrounds, Intore celebrations, and virtual dowry negotiations.",
      highlight: "HD Quality",
      bgPattern: "imigongo-pattern"
    },
    {
      icon: <Shield className="w-8 h-8" style={{ color: 'var(--imisozi-green)' }} />,
      title: "Umutekano mbere",
      subtitle: "Safety First",
      description: "24/7 AI moderation, SIM swap detection, and verified 'Umuziranenge' badges for trusted connections.",
      highlight: "24/7 Protection",
      bgPattern: "ikinga-pattern"
    },
    {
      icon: <Crown className="w-8 h-8" style={{ color: 'var(--ikirere-blue)' }} />,
      title: "Ingabo y'Agaciro",
      subtitle: "VIP Experience",
      description: "Personal matchmakers, exclusive Intore events, and 'Umwami' status with diamond benefits.",
      highlight: "4 Premium Tiers",
      bgPattern: "umwami-pattern"
    },
    {
      icon: <Users className="w-8 h-8" style={{ color: 'var(--umuriro-orange)' }} />,
      title: "Umuryango wacu",
      subtitle: "Community",
      description: "Built for East Africans with Kinyarwanda, Swahili, Luganda, Lingala and cultural celebrations.",
      highlight: "6 Countries",
      bgPattern: "umuganda-pattern"
    }
  ];

  const countries = [
    { flag: "🇷🇼", name: "Rwanda", capital: "Kigali", region: "Gasabo", languages: "Kinyarwanda, English, French", users: "15K+", color: "var(--umutara-red)", pattern: "imigongo" },
    { flag: "🇰🇪", name: "Kenya", capital: "Nairobi", region: "Nairobi", languages: "Swahili, English", users: "35K+", color: "var(--imisozi-green)", pattern: "savanna" },
    { flag: "🇺🇬", name: "Uganda", capital: "Kampala", region: "Central", languages: "Luganda, English, Swahili", users: "20K+", color: "var(--agaciro-gold)", pattern: "nile" },
    { flag: "🇹🇿", name: "Tanzania", capital: "Dar es Salaam", region: "Dar", languages: "Swahili, English", users: "18K+", color: "var(--ikirere-blue)", pattern: "zanzibar" },
    { flag: "🇧🇮", name: "Burundi", capital: "Bujumbura", region: "Bujumbura", languages: "Kirundi, French, English", users: "8K+", color: "var(--igikari-purple)", pattern: "tanganyika" },
    { flag: "🇨🇩", name: "Congo", capital: "Kinshasa", region: "Kinshasa", languages: "French, Lingala, Swahili", users: "12K+", color: "var(--umuriro-orange)", pattern: "congo-river" }
  ];

  const stats = [
    { value: "100K+", label: "Abakoresha", translation: "Active Users", icon: <Users className="w-5 h-5" />, color: "var(--umutara-red)" },
    { value: "50K+", label: "Abakundana", translation: "Successful Matches", icon: <Heart className="w-5 h-5" />, color: "var(--agaciro-gold)" },
    { value: "6", label: "Ibihugu", translation: "East African Countries", icon: <Globe className="w-5 h-5" />, color: "var(--imisozi-green)" },
    { value: "24/7", label: "Ubufasha", translation: "Live Support", icon: <Shield className="w-5 h-5" />, color: "var(--ikirere-blue)" }
  ];

  const values = [
    {
      icon: <Heart className="w-6 h-6" style={{ color: 'var(--umutara-red)' }} />,
      title: "Umuco nyarwanda",
      subtitle: "Cultural Authenticity",
      description: "We celebrate East African cultures, languages, and traditions in everything we do.",
      pattern: "agaseke"
    },
    {
      icon: <Shield className="w-6 h-6" style={{ color: 'var(--igikari-purple)' }} />,
      title: "Umutekano",
      subtitle: "Safety First",
      description: "Advanced AI moderation and verification systems keep our community safe.",
      pattern: "ikinga"
    },
    {
      icon: <Sparkles className="w-6 h-6" style={{ color: 'var(--agaciro-gold)' }} />,
      title: "Ubuhanga",
      subtitle: "Innovation",
      description: "Cutting-edge technology meets traditional values for the best dating experience.",
      pattern: "imigongo"
    }
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, ease: [0, 0, 0.2, 1] },
    }),
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--inyoni-white)' }}>
      {/* Hero Section - Premium Redesign */}
      <div className="relative overflow-hidden" style={{ background: 'var(--gradient-royal)' }}>
        {/* Cultural Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, var(--agaciro-gold) 0px, var(--agaciro-gold) 2px, transparent 2px, transparent 8px)`,
          }} />
        </div>
        
        {/* Intore Silhouettes */}
        <div className="absolute bottom-0 right-0 opacity-20">
          <div className="flex gap-2 p-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-8 h-16" style={{
                background: 'var(--agaciro-gold)',
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: `rotate(${i % 2 === 0 ? -5 : 5}deg)`,
              }} />
            ))}
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full blur-xl opacity-50" style={{ background: 'var(--gradient-love)' }} />
                <div className="relative w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-2xl">
                  <Heart className="w-10 h-10 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Title with Cultural Touch */}
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-4"
            >
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 tracking-tight">
                About Love<span style={{ color: 'var(--agaciro-gold)' }}>X</span>
              </h1>
              <div className="flex items-center justify-center gap-2 text-white/80">
                <div className="w-12 h-px" style={{ background: 'var(--agaciro-gold)' }} />
                <span className="font-cultural text-sm uppercase tracking-[0.2em]">Rwanda • East Africa</span>
                <div className="w-12 h-px" style={{ background: 'var(--agaciro-gold)' }} />
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-xl text-white/90 max-w-2xl mx-auto mb-4 font-light"
            >
              East Africa's premier dating platform where cultural authenticity meets modern technology.
            </motion.p>

            {/* Cultural Quote */}
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-10"
            >
              <p className="font-display text-2xl italic text-white/80 mb-1">"Urukundo rwacu, uburyo bushya"</p>
              <p className="text-sm text-white/60">Our love, a new way</p>
            </motion.div>

            {/* Stats Grid - Redesigned */}
            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10"
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="relative group">
                  <div className="absolute inset-0 bg-white/5 rounded-2xl blur-sm group-hover:blur-md transition-all" />
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: stat.color }}>{stat.icon}</span>
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                      </div>
                      <div className="text-sm text-white/80">{stat.label}</div>
                      <div className="text-xs text-white/60 mt-1">{stat.translation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              custom={5}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link 
                to="/matching" 
                className="group relative px-8 py-4 rounded-full font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105"
                style={{ background: 'var(--inyoni-white)', color: 'var(--umutara-red)' }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Tangira None • Start Now
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                     style={{ background: 'var(--gradient-cream)' }} />
              </Link>
              <Link 
                to="/" 
                className="px-8 py-4 rounded-full font-semibold text-lg border-2 border-white/30 text-white hover:bg-white/10 transition-all"
              >
                Asubire Inyuma • Back Home
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full" style={{ background: 'var(--agaciro-gold)' }} />
          </div>
        </motion.div>
      </div>

      {/* Mission Section - Redesigned with Cultural Elements */}
      <div className="relative py-16" style={{ background: 'var(--igicu-gray-50)' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `repeating-linear-gradient(45deg, var(--umutara-red) 0px, var(--umutara-red) 1px, transparent 1px, transparent 20px)`,
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <Badge className="mb-4 px-4 py-1 text-sm" style={{ 
              background: 'var(--agaseke-cream)', 
              color: 'var(--umutara-red)',
              border: '1px solid var(--agaciro-gold)'
            }}>
              <Star className="w-3 h-3 mr-1" /> Umurava wacu • Our Mission
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--igicu-gray-800)' }}>
              Connecting Hearts Across the{" "}
              <span style={{ color: 'var(--umutara-red)' }}>Thousand Hills</span>
            </h2>
            <div className="w-24 h-1 mx-auto rounded-full mb-4" style={{ background: 'var(--gradient-royal)' }} />
            <p className="text-lg" style={{ color: 'var(--igicu-gray-600)' }}>
              LoveX was born in Kigali with a vision to create meaningful connections 
              while honoring our rich cultural heritage. We blend traditional values 
              with modern technology to help East Africans find lasting love.
            </p>
          </motion.div>

          {/* Features Section - Redesigned Cards */}
          <h2 className="font-display text-3xl font-bold text-center mb-10" style={{ color: 'var(--igicu-gray-800)' }}>
            Ibiranga • <span style={{ color: 'var(--umutara-red)' }}>Features</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                      style={{ background: 'var(--inyoni-white)', borderRadius: '24px 24px 12px 24px' }}>
                  {/* Cultural Corner Accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16" style={{ 
                      background: 'var(--gradient-royal)',
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
                      opacity: 0.1
                    }} />
                  </div>
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl" style={{ 
                        background: `color-mix(in srgb, ${feature.icon.props.style.color} 10%, white)`,
                        borderRadius: '16px 16px 4px 16px'
                      }}>
                        {feature.icon}
                      </div>
                      <div>
                        <Badge className="mb-1 text-xs" style={{ 
                          background: 'var(--agaseke-cream)',
                          color: feature.icon.props.style.color,
                          border: 'none'
                        }}>
                          {feature.highlight}
                        </Badge>
                        <CardTitle className="font-display text-lg" style={{ color: 'var(--igicu-gray-800)' }}>
                          {feature.title}
                        </CardTitle>
                        <p className="text-sm" style={{ color: 'var(--igicu-gray-500)' }}>{feature.subtitle}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--igicu-gray-600)' }}>
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Countries Section - Redesigned */}
          <h2 className="font-display text-3xl font-bold text-center mb-4" style={{ color: 'var(--igicu-gray-800)' }}>
            Turi Hose • <span style={{ color: 'var(--umutara-red)' }}>Where We Are</span>
          </h2>
          <p className="text-center mb-10" style={{ color: 'var(--igicu-gray-500)' }}>
            Serving the East African community across borders
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {countries.map((country, index) => (
              <motion.div
                key={country.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                      style={{ background: 'var(--inyoni-white)', borderRadius: '16px' }}>
                  {/* Country Header with Flag */}
                  <div className="h-2" style={{ background: country.color }} />
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-4xl filter drop-shadow-lg">{country.flag}</span>
                      <div>
                        <h3 className="font-display text-xl font-semibold" style={{ color: country.color }}>
                          {country.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--igicu-gray-500)' }}>
                          <MapPin className="w-3 h-3" />
                          {country.capital}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4" style={{ color: 'var(--igicu-gray-400)' }} />
                        <span style={{ color: 'var(--igicu-gray-600)' }}>{country.languages}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4" style={{ color: country.color }} />
                        <span className="font-medium" style={{ color: country.color }}>{country.users} active users</span>
                      </div>
                    </div>

                    {/* Cultural Pattern Preview */}
                    <div className="mt-4 h-8 rounded-md opacity-30" style={{
                      background: `repeating-linear-gradient(45deg, ${country.color} 0px, ${country.color} 2px, transparent 2px, transparent 6px)`,
                    }} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Values Section - Redesigned */}
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-bold mb-4" style={{ color: 'var(--igicu-gray-800)' }}>
              Indangagaciro • <span style={{ color: 'var(--umutara-red)' }}>Our Values</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <div className="absolute inset-0" style={{
                    background: `repeating-linear-gradient(45deg, ${value.icon.props.style.color} 0px, ${value.icon.props.style.color} 1px, transparent 1px, transparent 10px)`,
                    opacity: 0.05,
                    borderRadius: '24px'
                  }} />
                  <div className="relative p-6" style={{ background: 'var(--inyoni-white)', borderRadius: '24px' }}>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ 
                      background: `color-mix(in srgb, ${value.icon.props.style.color} 10%, white)`,
                      borderRadius: '50% 50% 8px 50%'
                    }}>
                      {value.icon}
                    </div>
                    <h3 className="font-display text-xl font-semibold mb-1" style={{ color: 'var(--igicu-gray-800)' }}>
                      {value.title}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: value.icon.props.style.color }}>
                      {value.subtitle}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--igicu-gray-600)' }}>
                      {value.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section - Redesigned */}
      <div className="relative overflow-hidden" style={{ background: 'var(--gradient-hills)' }}>
        {/* Cultural Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, var(--agaciro-gold) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <Badge className="mb-4 px-4 py-1" style={{ 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)'
            }}>
              <Heart className="w-3 h-3 mr-1" /> Urukundo Rutagatifu
            </Badge>
            
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Find Your Perfect Match?
            </h2>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of East Africans who have found love through LoveX.
            </p>
            
            <Link 
              to="/matching" 
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105"
              style={{ background: 'var(--agaciro-gold)', color: 'var(--igicu-gray-800)' }}
            >
              <Sparkles className="w-5 h-5" />
              Tangira Uruendo • Start Your Journey
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* Cultural Footer */}
            <div className="mt-12 flex items-center justify-center gap-4 text-white/60 text-sm">
              <Leaf className="w-4 h-4" />
              <span>Imena ry'urukundo • In the name of love</span>
              <Leaf className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;