Herosection clean · TSX
Copy

"use client";

import { useUser } from "@/hooks/useUser";
import { useEffect, useState } from "react";

export default function HeroSection() {
  const { profile, loading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const firstName = profile?.name?.split(" ")[0];

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(235, 110, 128, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(233, 176, 0, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(226, 78, 66, 0.15) 0%, transparent 60%)
          `,
          animation: "gradientShift 20s ease-in-out infinite",
        }}
      />

      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle floating shapes */}
        <div 
          className={`absolute top-[15%] left-[10%] w-32 h-40 rounded-sm bg-white shadow-2xl transition-all duration-1000 ${
            mounted ? 'opacity-20 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ 
            transform: `rotate(-6deg)`,
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div 
          className={`absolute top-[25%] right-[12%] w-24 h-32 rounded-sm bg-white shadow-2xl transition-all duration-1000 delay-200 ${
            mounted ? 'opacity-15 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ 
            transform: `rotate(4deg)`,
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
        <div 
          className={`absolute bottom-[20%] left-[15%] w-20 h-28 rounded-sm bg-white shadow-2xl transition-all duration-1000 delay-300 ${
            mounted ? 'opacity-10 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ 
            transform: `rotate(8deg)`,
            animation: "float 12s ease-in-out infinite",
          }}
        />
        <div 
          className={`absolute bottom-[30%] right-[20%] w-28 h-36 rounded-sm bg-white shadow-2xl transition-all duration-1000 delay-500 ${
            mounted ? 'opacity-15 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ 
            transform: `rotate(-3deg)`,
            animation: "float 9s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Greeting */}
        <h1 
          className={`font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-6 transition-all duration-1000 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {loading ? (
            <span className="text-ink/80">{getGreeting()}</span>
          ) : profile ? (
            <>
              <span className="text-ink/80">{getGreeting()}</span>
              {firstName && (
                <>
                  <span className="text-ink/80">, </span>
                  <span className="italic text-ink/60">{firstName}</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="text-ink/80">Collect what </span>
              <span className="italic text-ink/60">inspires</span>
              <span className="text-ink/80"> you</span>
            </>
          )}
        </h1>

        {/* Tagline */}
        <p 
          className={`text-lg md:text-xl text-ink/50 font-light max-w-md mx-auto transition-all duration-1000 delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {profile ? (
            "Your boards are waiting"
          ) : (
            "A private space for your visual inspiration"
          )}
        </p>

        {/* CTA for non-logged in users */}
        {!loading && !profile && (
          <div 
            className={`mt-10 transition-all duration-1000 delay-400 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <a 
              href="/login"
              className="inline-block px-8 py-4 bg-ink text-white text-sm font-medium tracking-wide rounded-full hover:bg-ink/90 transition-colors"
            >
              Begin collecting
            </a>
          </div>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FDFCFB] to-transparent" />

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          33% {
            transform: scale(1.1) rotate(1deg);
          }
          66% {
            transform: scale(0.95) rotate(-1deg);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </section>
  );
}