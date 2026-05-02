import { useTheme } from "next-themes";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus-visible:outline-none focus:ring-2 focus:ring-indigo-500",
        isDark ? "bg-emerald-500" : "bg-slate-300"
      )}
      aria-label="Alternar tema"
    >
      <motion.div
        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0"
        initial={false}
        animate={{
          x: isDark ? 20 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />
    </button>
  );
}
