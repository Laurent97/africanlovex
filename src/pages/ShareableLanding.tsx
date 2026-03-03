import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Heart, Globe, Sparkles, Star, Shield, Zap } from 'lucide-react';
import Logo from '../components/Logo';

export default function ShareableLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-pink-50 to-purple-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-pink-200/20 to-purple-200/20" />
        <div className="relative container mx-auto px-6 py-8">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 flex items-center justify-center">
                <Logo />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
                LoveX
              </span>
            </div>
            <Link
              to="/"
              className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Enter App
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 shadow-2xl relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 blur-xl opacity-70" />
                <Logo />
              </div>
            </motion.div>

            {/* Title */}
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Love
              </span>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                X
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-2xl text-gray-600 mb-8 font-light">
              Where East African Hearts Connect
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Link
                to="/auth"
                className="group relative px-10 py-4 rounded-full text-lg font-semibold text-white overflow-hidden shadow-2xl hover-lift"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 transition-transform group-hover:scale-110" />
                <span className="relative flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                to="/about"
                className="group relative px-10 py-4 rounded-full text-lg font-semibold overflow-hidden border-2 border-purple-300 hover:border-purple-500 transition-colors"
              >
                <span className="relative text-purple-600 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Discover More
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Why Choose LoveX?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of romance in East Africa
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Users className="w-8 h-8" />,
                title: "Real Connections",
                description: "Meet genuine people across Rwanda, Kenya, Uganda, Tanzania, Burundi & Congo",
                gradient: "from-amber-400 to-orange-500"
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Live Streaming",
                description: "Go live and connect with your audience in real-time",
                gradient: "from-pink-400 to-red-500"
              },
              {
                icon: <Star className="w-8 h-8" />,
                title: "Virtual Gifts",
                description: "Send beautiful virtual gifts and express your feelings",
                gradient: "from-purple-400 to-indigo-500"
              },
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Safe & Secure",
                description: "Advanced verification and privacy protection",
                gradient: "from-green-400 to-teal-500"
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "Instant Matching",
                description: "Smart algorithms to find your perfect match",
                gradient: "from-blue-400 to-purple-500"
              },
              {
                icon: <Globe className="w-8 h-8" />,
                title: "East African Focus",
                description: "Designed specifically for the East African community",
                gradient: "from-indigo-400 to-purple-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-white/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 hover:border-white/80 transition-all shadow-xl">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} mb-6 shadow-lg`}>
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Country Showcase */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Connecting East Africa
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Find love across the region
            </p>
          </motion.div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-5xl">
            {[
              { flag: "🇷🇼", name: "Rwanda" },
              { flag: "🇧🇮", name: "Burundi" },
              { flag: "🇺🇬", name: "Uganda" },
              { flag: "🇰🇪", name: "Kenya" },
              { flag: "🇹🇿", name: "Tanzania" },
              { flag: "🇨🇩", name: "Congo" },
            ].map((country, i) => (
              <motion.div
                key={country.flag}
                className="relative group"
                whileHover={{ scale: 1.2, y: -8 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="cursor-pointer filter drop-shadow-lg">
                  {country.flag}
                </span>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full shadow-lg border">
                    {country.name}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Your Love Story Starts Here
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of East Africans finding meaningful connections
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-white text-purple-600 font-bold text-lg hover:shadow-2xl transition-all hover:scale-105"
            >
              Get Started Now
              <ArrowRight className="w-6 h-6" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-50">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 flex items-center justify-center">
              <Logo />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-purple-600 bg-clip-text text-transparent">
              LoveX
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Where East African Hearts Connect
          </p>
          <p className="text-sm text-gray-500">
            © 2024 LoveX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
