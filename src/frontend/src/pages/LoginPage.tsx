import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Clock, TrendingUp, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    { icon: BookOpen, label: "Study Planner", desc: "Organize tasks & exams" },
    { icon: Clock, label: "Focus Timer", desc: "Pomodoro & custom timers" },
    { icon: TrendingUp, label: "Finance Tracker", desc: "Budget in ₹ INR" },
    { icon: Brain, label: "AI Assistant", desc: "Smart study tools" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left Panel */}
      <div className="lg:w-1/2 gradient-teal flex flex-col items-center justify-center p-10 text-white min-h-[40vh] lg:min-h-screen">
        <div className="max-w-md w-full">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/assets/generated/zenith-hub-logo.dim_256x256.png"
              alt="Zenith Hub Logo"
              className="w-16 h-16 rounded-2xl shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight">
                Zenith Hub
              </h1>
              <p className="text-white/70 text-sm">
                Student Productivity Platform
              </p>
            </div>
          </div>

          <p className="text-xl font-display font-medium mb-2 text-white/90">
            Reach your academic peak.
          </p>
          <p className="text-white/60 mb-10 leading-relaxed">
            An all-in-one productivity app designed for Class 12 students. Plan
            smarter, focus better, and track your progress.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
              >
                <Icon className="w-5 h-5 mb-2 text-amber-300" />
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-white/60 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center p-10">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in with your Internet Identity to access your personalized
              dashboard.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold rounded-xl gradient-teal text-white border-0 hover:opacity-90 transition-opacity"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Login with Internet Identity
                </span>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              New users will be prompted to set up their profile after login.
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              🔐 Secured by Internet Computer's decentralized identity system
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
