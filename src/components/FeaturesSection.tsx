import { motion } from "framer-motion";
import { 
  Heart, 
  Shield, 
  Globe, 
  Gift, 
  Video, 
  Crown, 
  Sparkles, 
  Smartphone,
  Diamond,
  Gem,
  Star,
  Flower2,
  Infinity,
  Coffee,
  Music,
  Award,
  Feather,
  Zap,
  Users,
  MessageCircle
} from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Intelligent Matchmaking",
    description: "Our sophisticated algorithm connects you with compatible partners based on values, interests, and relationship goals across East Africa.",
    color: "from-rose-500 to-pink-500",
    gradient: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-500",
    glowColor: "rgba(244, 114, 182, 0.3)",
  },
  {
    icon: Video,
    title: "Romantic Live Rooms",
    description: "Virtual dates with enchanting backgrounds of African sunsets, Victoria Falls, and Zanzibar beaches. Share moments that matter.",
    color: "from-purple-500 to-indigo-500",
    gradient: "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-500",
    glowColor: "rgba(168, 85, 247, 0.3)",
  },
  {
    icon: Gift,
    title: "Treasure Chest of Gifts",
    description: "Send romantic treasures: Eternal Rose, Promise Ring, Diamond Cluster, Golden Rose, Infinity Heart, and Shooting Star.",
    color: "from-amber-500 to-orange-500",
    gradient: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500",
    glowColor: "rgba(245, 158, 11, 0.3)",
    extraIcons: [
      { icon: Flower2, tooltip: "Eternal Rose" },
      { icon: Diamond, tooltip: "Diamond Cluster" },
      { icon: Gem, tooltip: "Precious Gem" },
      { icon: Star, tooltip: "Shooting Star" },
    ]
  },
  {
    icon: Smartphone,
    title: "Seamless Payments",
    description: "Multiple payment options including MTN MoMo, M-Pesa, Airtel Money, credit cards, and cryptocurrency for your convenience.",
    color: "from-blue-500 to-cyan-500",
    gradient: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    glowColor: "rgba(59, 130, 246, 0.3)",
  },
  {
    icon: Shield,
    title: "Trust & Safety",
    description: "Advanced AI verification, SIM swap protection, and dedicated 24/7 support team ensuring your romantic journey is secure.",
    color: "from-emerald-500 to-green-500",
    gradient: "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-500",
    glowColor: "rgba(16, 185, 129, 0.3)",
  },
  {
    icon: Crown,
    title: "Exclusive Membership",
    description: "Unlock premium features with our LoveX membership: Priority matching, unlimited gifts, and romantic date planning assistance.",
    color: "from-yellow-500 to-amber-500",
    gradient: "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20",
    iconBg: "bg-gradient-to-br from-yellow-500 to-amber-500",
    glowColor: "rgba(245, 158, 11, 0.3)",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-rose-50 dark:from-gray-950 dark:to-rose-950/20 relative overflow-hidden">
      {/* Romantic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-indigo-200/30 rounded-full blur-3xl" />
        
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
            <Heart className="w-8 h-8 text-rose-200/20 dark:text-rose-500/10" />
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
            <span>Discover Romance</span>
          </motion.div>

          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              A Love Story
            </span>
            <br />
            <span className="text-gray-800 dark:text-gray-200">Designed for You</span>
          </h2>

          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Every feature thoughtfully crafted to help you find meaningful connections 
            and express your feelings in the most romantic way.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative"
            >
              {/* Glow Effect on Hover */}
              <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${feature.glowColor}, transparent 70%)`,
                }}
              />

              {/* Feature Card */}
              <div className={`relative p-6 sm:p-8 rounded-2xl ${feature.gradient} border border-white/20 dark:border-white/5 shadow-xl backdrop-blur-sm h-full flex flex-col`}>
                {/* Icon with Gradient */}
                <div className="relative mb-6">
                  <motion.div
                    className={`w-16 h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center shadow-lg relative z-10`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <feature.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  
                  {/* Decorative rings */}
                  <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3 font-display">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                  {feature.description}
                </p>

                {/* Extra Icons for Gifts Feature */}
                {feature.extraIcons && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-500 mr-1">Gifts:</span>
                    {feature.extraIcons.map((Item, idx) => (
                      <motion.div
                        key={idx}
                        className="relative group/icon"
                        whileHover={{ y: -3, scale: 1.1 }}
                      >
                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${feature.color} flex items-center justify-center`}>
                          <Item.icon className="w-3 h-3 text-white" />
                        </div>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap">
                          <span className="text-xs bg-gray-800 text-white px-2 py-1 rounded shadow-lg">
                            {Item.tooltip}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Romantic divider */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-4 h-4 text-rose-400/50" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Romantic Promise */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-rose-200 dark:border-rose-800/30">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 border-2 border-white dark:border-gray-900"
                  whileHover={{ scale: 1.2, y: -3 }}
                  transition={{ type: "spring", stiffness: 300 }}
                />
              ))}
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Join <span className="text-rose-500 font-bold">50,000+</span> couples who found love here
            </span>
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}