import { motion } from "framer-motion";

const giftTiers = [
  {
    tier: "Everyday Romance",
    range: "25-100 LX",
    gifts: [
      { emoji: "🍦", name: "Ice Cream Sundae", price: 25 },
      { emoji: "☕", name: "Coffee Date", price: 30 },
      { emoji: "🍕", name: "Gourmet Pizza", price: 40 },
      { emoji: "🎵", name: "Music Note", price: 60 },
      { emoji: "�", name: "Game Controller", price: 80 },
      { emoji: "💌", name: "Love Letter", price: 75 },
      { emoji: "🌹", name: "Eternal Rose", price: 50 },
      { emoji: "�", name: "Heart Box", price: 100 },
    ],
  },
  {
    tier: "Romantic Gestures",
    range: "150-1000 LX",
    gifts: [
      { emoji: "�", name: "Valentine's Heart", price: 150 },
      { emoji: "⭐", name: "Shooting Star", price: 150 },
      { emoji: "🌟", name: "Christmas Star", price: 200 },
      { emoji: "�", name: "New Year Fireworks", price: 300 },
      { emoji: "🔮", name: "Crystal Ball", price: 300 },
      { emoji: "🪽", name: "Phoenix Feather", price: 400 },
      { emoji: "💎", name: "Diamond Cluster", price: 500 },
      { emoji: "🌹", name: "Golden Rose", price: 300 },
      { emoji: "�", name: "Royal Crown", price: 300 },
      { emoji: "💘", name: "Cupid's Arrow", price: 200 },
      { emoji: "💍", name: "Promise Ring", price: 500 },
      { emoji: "♾️", name: "Infinity Heart", price: 400 },
    ],
  },
  {
    tier: "Legendary",
    range: "1,200-15,000 LX",
    gifts: [
      { emoji: "❤️‍🔥", name: "Dragon's Heart", price: 1000 },
      { emoji: "🪽", name: "Phoenix Feather", price: 800 },
      { emoji: "🔮", name: "Crystal Ball", price: 600 },
      { emoji: "�", name: "Northern Lights", price: 900 },
      { emoji: "🏎️", name: "Sports Car", price: 2500 },
      { emoji: "✈️", name: "Private Jet", price: 5000 },
      { emoji: "🏖️", name: "Luxury Mansion", price: 7500 },
      { emoji: "�️", name: "Super Yacht", price: 4000 },
    ],
  },
];

export default function GiftSection() {
  return (
    <section className="py-24 bg-muted/50 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="lovex-badge gradient-royal-bg text-primary-foreground mb-4">
            💎 LoveX Coins
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-4 mb-4">
            Express Love, <span className="text-gradient-royal">Your Way</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From a virtual Fanta to a Zanzibar Dream Wedding — every emotion has a gift.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {giftTiers.map((tier, tierIdx) => (
            <motion.div
              key={tier.tier}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: tierIdx * 0.15 }}
              className="lovex-card p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-bold text-foreground">{tier.tier}</h3>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {tier.range}
                </span>
              </div>
              <div className="space-y-3">
                {tier.gifts.map((gift) => (
                  <motion.div
                    key={gift.name}
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/80 transition-colors cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{gift.emoji}</span>
                      <span className="font-medium text-foreground">{gift.name}</span>
                    </div>
                    <span className="text-sm font-bold text-primary">
                      {gift.price.toLocaleString()} LX
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
