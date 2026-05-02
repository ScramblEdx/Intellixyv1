import { cn } from "@/lib/utils";

export function Logo({ className, iconSize = "h-8 w-8", textSize = "text-2xl" }: { className?: string, iconSize?: string, textSize?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex items-center justify-center">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="url(#intellixy-gradient)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={iconSize}
        >
          <defs>
            <linearGradient id="intellixy-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" /> {/* blue-400 */}
              <stop offset="50%" stopColor="#3b82f6" /> {/* blue-500 */}
              <stop offset="100%" stopColor="#1d4ed8" /> {/* blue-700 */}
            </linearGradient>
          </defs>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          <circle cx="12" cy="5" r="1" fill="#60a5fa" stroke="none" />
        </svg>
      </div>
      <span className={cn("font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800", textSize)}>
        Intellixy
      </span>
    </div>
  );
}