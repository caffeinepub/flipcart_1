import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

const slides = [
  {
    emoji: "🛍️",
    title: "Welcome to ShopExpo",
    subtitle: "India's favourite online marketplace",
    bg: "from-[oklch(0.25_0.08_260)] to-[oklch(0.35_0.12_250)]",
  },
  {
    emoji: "📦",
    title: "Millions of Products",
    subtitle: "Electronics, Fashion, Grocery & more",
    bg: "from-[oklch(0.20_0.06_270)] to-[oklch(0.30_0.10_260)]",
  },
  {
    emoji: "🚀",
    title: "Fast & Easy Delivery",
    subtitle: "Track orders, easy returns, great deals",
    bg: "from-[oklch(0.22_0.07_255)] to-[oklch(0.32_0.11_245)]",
  },
];

const slideKeys = ["welcome", "products", "delivery"];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const finish = () => {
    localStorage.setItem("shopexpo_onboarding_done", "true");
    onDone();
  };

  const next = () => {
    if (current < slides.length - 1) {
      setDirection(1);
      setCurrent((c) => c + 1);
    } else {
      finish();
    }
  };

  const slide = slides[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden"
      data-ocid="onboarding.modal"
    >
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.38, ease: [0.32, 0, 0.67, 0] }}
          className={`absolute inset-0 bg-gradient-to-br ${slide.bg} flex flex-col`}
        >
          {/* Skip button */}
          <div className="flex justify-end p-5">
            {current < slides.length - 1 && (
              <button
                type="button"
                onClick={finish}
                className="text-white/70 text-sm font-medium px-3 py-1.5 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                data-ocid="onboarding.cancel_button"
              >
                Skip
              </button>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-4">
            {/* Large emoji */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.1,
                duration: 0.5,
                type: "spring",
                bounce: 0.4,
              }}
              className="text-8xl mb-8 select-none"
            >
              {slide.emoji}
            </motion.div>

            {/* ShopExpo badge */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mb-3"
            >
              <span
                className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                style={{
                  background: "oklch(0.72 0.19 45)",
                  color: "white",
                }}
              >
                ShopExpo
              </span>
            </motion.div>

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.28, duration: 0.4 }}
              className="text-3xl font-bold text-white text-center leading-tight mb-3 font-display"
            >
              {slide.title}
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.36, duration: 0.4 }}
              className="text-white/75 text-center text-base leading-relaxed max-w-xs"
            >
              {slide.subtitle}
            </motion.p>
          </div>

          {/* Bottom section */}
          <div className="px-8 pb-10 flex flex-col items-center gap-6">
            {/* Progress dots */}
            <div className="flex gap-2" data-ocid="onboarding.panel">
              {slides.map((_, i) => (
                <motion.button
                  key={slideKeys[i]}
                  type="button"
                  onClick={() => {
                    setDirection(i > current ? 1 : -1);
                    setCurrent(i);
                  }}
                  animate={{
                    width: i === current ? 24 : 8,
                    opacity: i === current ? 1 : 0.45,
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-2 rounded-full bg-white"
                  data-ocid="onboarding.toggle"
                />
              ))}
            </div>

            {/* Next / Get Started button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={next}
              className="w-full max-w-xs py-4 rounded-2xl font-bold text-base text-white transition-all"
              style={{
                background: "oklch(0.72 0.19 45)",
                boxShadow: "0 8px 24px oklch(0.72 0.19 45 / 0.4)",
              }}
              data-ocid="onboarding.primary_button"
            >
              {current === slides.length - 1 ? "Get Started 🎉" : "Next →"}
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
