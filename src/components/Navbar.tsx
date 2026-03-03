import { Heart, Menu, X, Sparkles, HeartPulse } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Gifts", href: "/gifts" },
  { label: "Pricing", href: "/vip" },
  { label: "Safety", href: "/wallet" },
  { label: "Success Stories", href: "/success-stories" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState("");

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-lg" 
          : "bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-purple-500/10 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a 
            href="/" 
            className="flex items-center gap-2 sm:gap-3 group relative"
            onClick={() => setOpen(false)}
          >
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl">
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
              </div>
            </motion.div>
            
            <div className="flex items-center">
              <span className="font-display text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Love
              </span>
              <span className="font-display text-xl sm:text-2xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
                X
              </span>
            </div>

            {/* Decorative sparkle */}
            <motion.div
              className="absolute -top-2 -right-4 text-yellow-400"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setActiveLink(link.label)}
                className={`relative text-sm lg:text-base font-medium transition-all duration-300 group ${
                  activeLink === link.label
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400"
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-rose-500 to-pink-500 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                  activeLink === link.label ? "scale-x-100" : ""
                }`} />
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={() => setOpen(!open)}
            className="md:hidden relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl md:hidden z-40"
            style={{ height: "calc(100vh - 4rem)" }}
          >
            <motion.div 
              className="container mx-auto px-4 py-8 flex flex-col h-full"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Navigation Links */}
              <div className="flex-1 flex flex-col gap-4">
                {navLinks.map((link, index) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={(e) => {
                      setOpen(false);
                      // Use navigate for internal routes
                      if (link.href.startsWith('/')) {
                        e.preventDefault();
                        window.location.href = link.href;
                      }
                    }}
                    className="relative group py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 hover:from-rose-100 hover:to-pink-100 dark:hover:from-rose-900/50 dark:hover:to-pink-900/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
                        {link.label}
                      </span>
                      <motion.div
                        className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Heart className="w-4 h-4 text-white" />
                      </motion.div>
                    </div>
                    
                    {/* Progress indicator */}
                    <motion.div 
                      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-rose-500 to-pink-500"
                      initial={{ width: "0%" }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.a>
                ))}
              </div>

              {/* Social Proof */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Join 50,000+ couples who found love
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      className="w-6 h-6 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 border-2 border-white dark:border-gray-900"
                      whileHover={{ scale: 1.2, y: -3 }}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">+50k</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}