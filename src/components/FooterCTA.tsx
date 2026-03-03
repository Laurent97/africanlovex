import { motion } from "framer-motion";
import { Heart, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function FooterCTA() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleStartMatching = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/auth?redirect=/dashboard');
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 gradient-love-bg opacity-95" />
      <div className="absolute inset-0 imigongo-pattern opacity-20" />

      <div className="relative z-10 container mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Heart className="w-16 h-16 text-primary-foreground mx-auto mb-6 animate-heart-beat" />
          <h2 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-4">
            Your Love Story Starts Here
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of East Africans finding real connections on LoveX.
          </p>
          <button onClick={handleStartMatching} className="bg-primary-foreground text-primary font-bold px-12 py-4 rounded-full text-lg shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 mx-auto">
            Start Your Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-20 border-t border-primary-foreground/20 pt-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-display text-lg font-bold">LoveX</span>
          </div>
          <div className="flex gap-6 text-primary-foreground/70 text-sm">
            <a href="#" className="hover:text-primary-foreground transition-colors">About</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Safety</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Support</a>
            <a href="#" className="hover:text-primary-foreground transition-colors">Privacy</a>
          </div>
          <div className="flex gap-3 text-xl">
            🇷🇼 🇧🇮 🇺🇬 🇰🇪 🇹🇿 🇨🇩
          </div>
        </div>
      </div>
    </section>
  );
}
