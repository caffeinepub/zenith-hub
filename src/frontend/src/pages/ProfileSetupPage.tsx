import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, Lock, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCompleteProfile } from "../hooks/useQueries";

const CLASS_OPTIONS = [
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Class 12 (Science)",
  "Class 12 (Commerce)",
  "Class 12 (Arts)",
  "Undergraduate",
  "Other",
];

export default function ProfileSetupPage() {
  const [name, setName] = useState("");
  const [schoolClass, setSchoolClass] = useState("");
  const [passcode, setPasscode] = useState("");
  const { mutateAsync: completeProfile, isPending } = useCompleteProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!schoolClass) {
      toast.error("Please select your class");
      return;
    }
    if (passcode && (passcode.length !== 4 || !/^\d{4}$/.test(passcode))) {
      toast.error("Passcode must be exactly 4 digits");
      return;
    }

    try {
      await completeProfile({
        name: name.trim(),
        schoolClass,
        passcode: passcode ? BigInt(passcode) : null,
      });
      toast.success("Profile created! Welcome to Zenith Hub 🎉");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/assets/generated/zenith-hub-logo.dim_256x256.png"
            alt="Zenith Hub"
            className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-card"
          />
          <h1 className="text-2xl font-display font-bold">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Tell us a bit about yourself to personalize your experience.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <User className="w-4 h-4 text-primary" />
                Full Name *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <GraduationCap className="w-4 h-4 text-primary" />
                Class / Grade *
              </Label>
              <Select value={schoolClass} onValueChange={setSchoolClass}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select your class" />
                </SelectTrigger>
                <SelectContent>
                  {CLASS_OPTIONS.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="passcode"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Lock className="w-4 h-4 text-primary" />
                4-Digit Passcode (Optional)
              </Label>
              <Input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) =>
                  setPasscode(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Optional quick-access passcode"
                className="h-11 rounded-xl"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to skip. Used for quick access.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full h-11 rounded-xl font-semibold gradient-teal text-white border-0 hover:opacity-90"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Get Started →"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
