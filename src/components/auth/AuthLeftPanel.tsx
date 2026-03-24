import { Receipt, Calculator, ClipboardCheck, Building2, BookOpen, LineChart, Sparkles, Bot } from "lucide-react";
import apnaCaLogo from "@/assets/apna-ca-logo.png";

const features = [
  { icon: Receipt, title: "GST Agent", description: "GSTR-1, 2B matching & ITC reconciliation" },
  { icon: Calculator, title: "Income Tax Agent", description: "AIS reconciliation & ITR drafts" },
  { icon: ClipboardCheck, title: "Audit Assistant", description: "Risk sampling & evidence management" },
  { icon: Building2, title: "ROC Compliance", description: "Deadline tracking & form drafting" },
  { icon: BookOpen, title: "Accounting Agent", description: "Auto classification & reconciliation" },
  { icon: LineChart, title: "FP&A Advisory", description: "Budget analysis & forecasting" },
];

interface AuthLeftPanelProps {
  pageReady: boolean;
}

export function AuthLeftPanel({ pageReady }: AuthLeftPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-1/2 gradient-hero p-12 flex-col justify-between relative overflow-hidden">
      {/* Animated orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        style={{ animation: "authOrb1 8s ease-in-out infinite" }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl"
        style={{ animation: "authOrb2 10s ease-in-out infinite" }} />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary/5 rounded-full blur-3xl"
        style={{ animation: "authOrb3 12s ease-in-out infinite" }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            top: `${15 + i * 15}%`,
            left: `${10 + i * 14}%`,
            animation: `authParticle ${4 + i}s ease-in-out infinite ${i * 0.5}s`,
          }}
        />
      ))}

      <div className="relative z-10">
        {/* Logo with 3D entrance */}
        <div
          className="flex items-center gap-4 mb-12"
          style={{
            opacity: pageReady ? 1 : 0,
            transform: pageReady
              ? "perspective(800px) rotateY(0deg) translateX(0)"
              : "perspective(800px) rotateY(-25deg) translateX(-30px)",
            transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <img
            src={apnaCaLogo}
            alt="Apna CA Logo"
            className="w-20 h-20 object-contain drop-shadow-2xl"
            style={{
              animation: pageReady ? "auth3DLogo 1s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
            }}
          />
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Apna CA</h1>
            <p className="text-sm text-white/70">Your Smart CA Assistant</p>
          </div>
        </div>

        {/* Hero Text with staggered entrance */}
        <div className="mb-12">
          <h2
            className="text-4xl font-display font-bold text-white mb-4 leading-tight"
            style={{
              opacity: pageReady ? 1 : 0,
              transform: pageReady ? "translateY(0)" : "translateY(25px)",
              transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s",
            }}
          >
            Professional CA Practice,{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Powered by AI</span>
              <span
                className="absolute bottom-0 left-0 w-full h-3 bg-accent/30 rounded-sm -z-0"
                style={{
                  animation: pageReady ? "authHighlight 0.6s ease-out 1s both" : "none",
                  transformOrigin: "left",
                }}
              />
            </span>
          </h2>
          <p
            className="text-lg text-white/80 max-w-md"
            style={{
              opacity: pageReady ? 1 : 0,
              transform: pageReady ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s",
            }}
          >
            Real industry work with intelligent agents. Upload data, process GST returns,
            reconcile accounts, and generate professional outputs.
          </p>
        </div>

        {/* Features Grid with 3D card entrance */}
        <div className="grid grid-cols-2 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-white/5 backdrop-blur border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all duration-400 cursor-default group"
                style={{
                  opacity: pageReady ? 1 : 0,
                  transform: pageReady
                    ? "perspective(600px) rotateX(0deg) translateY(0)"
                    : "perspective(600px) rotateX(15deg) translateY(20px)",
                  transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${0.4 + i * 0.08}s`,
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:bg-white/15 transition-all duration-300">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-white/60">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div
        className="relative z-10"
        style={{
          opacity: pageReady ? 1 : 0,
          transform: pageReady ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.9s",
        }}
      >
        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur border border-white/10 hover:bg-white/15 transition-all duration-300">
          <Sparkles className="w-6 h-6 text-accent" style={{ animation: "authSparkle 2s ease-in-out infinite" }} />
          <div>
            <p className="font-semibold text-white">Start Free</p>
            <p className="text-sm text-white/70">First 5 work items are completely free</p>
          </div>
        </div>
      </div>
    </div>
  );
}
