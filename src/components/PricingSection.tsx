import { motion } from "framer-motion";
import { Check, Sparkles, Crown, Star, Heart } from "lucide-react";

const plans = [
  {
    name: "Free",
    nameKr: "Ubuntu",
    price: "$0",
    icon: Heart,
    color: "border-border",
    features: ["10 swipes/day", "Basic matching", "Receive gifts only", "Standard visibility"],
    popular: false,
  },
  {
    name: "Love",
    nameKr: "Urukundo",
    price: "$4.99",
    icon: Star,
    color: "border-primary",
    features: ["Unlimited swipes", "See who liked you", "1 boost/week", "Voice messages", "No ads"],
    popular: false,
  },
  {
    name: "Premium",
    nameKr: "Agaciro",
    price: "$9.99",
    icon: Sparkles,
    color: "border-lovex-purple",
    features: ["All Love features", "Unlimited rewind", "5 boosts/week", "Read receipts", "Exclusive animations"],
    popular: true,
  },
  {
    name: "Diamond",
    nameKr: "Ingabo",
    price: "$49.99",
    icon: Crown,
    color: "border-secondary",
    features: ["All Premium features", "Personal matchmaker", "Real gift delivery", "Elite Singles", "VIP events"],
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="lovex-badge gradient-sunset-bg text-primary-foreground mb-4">
            <Crown className="w-3 h-3" /> VIP Club
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-4">
            Unlock <span className="text-gradient-love">Your Heart</span>
          </h2>
          <p className="text-muted-foreground text-lg">Choose the plan that matches your love journey.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative lovex-card p-6 border-2 ${plan.color} ${plan.popular ? "ring-2 ring-lovex-purple shadow-2xl scale-105" : ""} hover-lift`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 lovex-badge gradient-royal-bg text-primary-foreground text-xs">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-6">
                <plan.icon className={`w-8 h-8 mx-auto mb-3 ${plan.popular ? "text-lovex-purple" : "text-primary"}`} />
                <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground italic">{plan.nameKr}</p>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  {plan.price !== "$0" && <span className="text-muted-foreground text-sm">/mo</span>}
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-lovex-green flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 rounded-full font-semibold text-sm transition-colors ${
                  plan.popular
                    ? "gradient-royal-bg text-primary-foreground shadow-lg"
                    : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                {plan.price === "$0" ? "Get Started" : "Subscribe"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
