import { useState, useEffect } from "react";
import apnaCaLogo from "@/assets/apna-ca-logo.png";

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(onComplete, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700 ${
        phase === "exit" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Radial glow */}
      <div className="absolute w-64 h-64 rounded-full bg-primary/20 blur-3xl animate-pulse" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo */}
        <div
          className={`transition-all duration-1000 ease-out ${
            phase === "enter"
              ? "scale-50 opacity-0 rotate-[-10deg]"
              : "scale-100 opacity-100 rotate-0"
          }`}
        >
          <img
            src={apnaCaLogo}
            alt="Apna CA"
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Brand name */}
        <div
          className={`text-center transition-all duration-700 delay-300 ${
            phase === "enter"
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          }`}
        >
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            Apna CA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Your Smart CA Assistant</p>
        </div>

        {/* Loading bar */}
        <div
          className={`w-48 h-1 rounded-full bg-muted overflow-hidden transition-opacity duration-500 delay-500 ${
            phase === "enter" ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="h-full bg-primary rounded-full animate-[loading_1.8s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  );
}
