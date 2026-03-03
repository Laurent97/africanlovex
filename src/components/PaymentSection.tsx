import { motion } from "framer-motion";
import { Smartphone, CreditCard, Bitcoin } from "lucide-react";

const methods = [
  { icon: "📱", name: "MTN MoMo", countries: "🇷🇼 🇺🇬 🇨🇩" },
  { icon: "📱", name: "M-Pesa", countries: "🇰🇪 🇹🇿 🇧🇮 🇨🇩" },
  { icon: "📱", name: "Airtel Money", countries: "🇷🇼 🇰🇪 🇺🇬 🇹🇿 🇨🇩" },
  { icon: "📱", name: "Tigo Pesa", countries: "🇹🇿" },
  { icon: "📱", name: "Lumicash", countries: "🇧🇮" },
  { icon: "📱", name: "Orange Money", countries: "🇨🇩" },
  { icon: "💳", name: "Stripe / Card", countries: "🌍 Global" },
  { icon: "₿", name: "Bitcoin & USDT", countries: "⚡ Lightning" },
];

export default function PaymentSection() {
  return (
    <section className="py-24 bg-muted/30 imigongo-pattern relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Pay <span className="text-gradient-love">Your Way</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Mobile money, cards, or crypto — we support how East Africa pays.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {methods.map((method, i) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="lovex-card p-4 text-center cursor-default"
            >
              <span className="text-3xl">{method.icon}</span>
              <p className="font-semibold text-foreground text-sm mt-2">{method.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{method.countries}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
