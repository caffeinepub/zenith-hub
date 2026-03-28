import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Brain,
  Coffee,
  Flame,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGetWeekStudyHours, useLogStudySession } from "../hooks/useQueries";

const POMODORO_WORK = 25 * 60;
const POMODORO_BREAK = 5 * 60;
const BURNOUT_THRESHOLD_MINUTES = 300; // 5 hours

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function FocusTimerPage() {
  const { mutateAsync: logSession } = useLogStudySession();
  const { data: weekHours = [] } = useGetWeekStudyHours();

  // Pomodoro state
  const [pomodoroTime, setPomodoroTime] = useState(POMODORO_WORK);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const pomodoroRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Custom timer state
  const [customMinutes, setCustomMinutes] = useState(30);
  const [customTime, setCustomTime] = useState(30 * 60);
  const [customRunning, setCustomRunning] = useState(false);
  const [customStarted, setCustomStarted] = useState(false);
  const customRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session tracking
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [sessionSubject, setSessionSubject] = useState("General");

  const todayHours = weekHours[0] ?? 0;
  const totalTodayMinutes = todayMinutes + Math.round(todayHours * 60);
  const showBurnoutWarning = totalTodayMinutes >= BURNOUT_THRESHOLD_MINUTES;

  const saveSession = useCallback(
    async (minutes: number) => {
      if (minutes < 1) return;
      try {
        await logSession({
          subject: sessionSubject,
          durationHours: minutes / 60,
          date: BigInt(Date.now()) * BigInt(1_000_000),
        });
        setTodayMinutes((prev) => prev + minutes);
        toast.success(`Session saved: ${minutes} minutes`);
      } catch {
        toast.error("Failed to save session");
      }
    },
    [logSession, sessionSubject],
  );

  // Pomodoro timer
  useEffect(() => {
    if (pomodoroRunning) {
      pomodoroRef.current = setInterval(() => {
        setPomodoroTime((prev) => {
          if (prev <= 1) {
            clearInterval(pomodoroRef.current!);
            setPomodoroRunning(false);
            if (!isBreak) {
              saveSession(25);
              setPomodoroCount((c) => c + 1);
              toast.success("🍅 Pomodoro complete! Take a break.");
              setIsBreak(true);
              return POMODORO_BREAK;
            }
            toast.success("Break over! Ready for next session?");
            setIsBreak(false);
            return POMODORO_WORK;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current);
    }
    return () => {
      if (pomodoroRef.current) clearInterval(pomodoroRef.current);
    };
  }, [pomodoroRunning, isBreak, saveSession]);

  // Custom timer
  useEffect(() => {
    if (customRunning) {
      customRef.current = setInterval(() => {
        setCustomTime((prev) => {
          if (prev <= 1) {
            clearInterval(customRef.current!);
            setCustomRunning(false);
            setCustomStarted(false);
            saveSession(customMinutes);
            toast.success(
              `✅ Custom session complete! ${customMinutes} minutes focused.`,
            );
            return customMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (customRef.current) clearInterval(customRef.current);
    }
    return () => {
      if (customRef.current) clearInterval(customRef.current);
    };
  }, [customRunning, customMinutes, saveSession]);

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setIsBreak(false);
    setPomodoroTime(POMODORO_WORK);
  };

  const startCustom = () => {
    setCustomTime(customMinutes * 60);
    setCustomStarted(true);
    setCustomRunning(true);
  };

  const resetCustom = () => {
    setCustomRunning(false);
    setCustomStarted(false);
    setCustomTime(customMinutes * 60);
  };

  const pomodoroProgress = isBreak
    ? ((POMODORO_BREAK - pomodoroTime) / POMODORO_BREAK) * 100
    : ((POMODORO_WORK - pomodoroTime) / POMODORO_WORK) * 100;

  const customProgress = customStarted
    ? ((customMinutes * 60 - customTime) / (customMinutes * 60)) * 100
    : 0;

  const focusScore = Math.min(100, Math.round((totalTodayMinutes / 300) * 100));

  const circumference = 2 * Math.PI * 54;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Focus Timer</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Stay focused and track your study sessions
        </p>
      </div>

      {/* Burnout Warning */}
      {showBurnoutWarning && (
        <Alert className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-medium">
            ⚠️ Burnout Warning! You've studied for{" "}
            {Math.floor(totalTodayMinutes / 60)}h {totalTodayMinutes % 60}m
            today. Take a longer break and rest!
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Flame className="w-5 h-5 text-accent mx-auto mb-1" />
            <p className="text-xl font-display font-bold">
              {Math.floor(totalTodayMinutes / 60)}h {totalTodayMinutes % 60}m
            </p>
            <p className="text-xs text-muted-foreground">Today's Focus</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Brain className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-display font-bold">{focusScore}%</p>
            <p className="text-xs text-muted-foreground">Focus Score</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 text-center">
            <Coffee className="w-5 h-5 text-chart-4 mx-auto mb-1" />
            <p className="text-xl font-display font-bold">{pomodoroCount}</p>
            <p className="text-xs text-muted-foreground">Pomodoros</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Input */}
      <Card className="border-border">
        <CardContent className="p-4">
          <Label className="text-sm font-medium mb-2 block">
            Study Subject
          </Label>
          <Input
            value={sessionSubject}
            onChange={(e) => setSessionSubject(e.target.value)}
            placeholder="e.g. Mathematics, Physics..."
            className="rounded-xl"
          />
        </CardContent>
      </Card>

      {/* Timers */}
      <Tabs defaultValue="pomodoro">
        <TabsList className="w-full rounded-xl">
          <TabsTrigger value="pomodoro" className="flex-1 rounded-lg">
            🍅 Pomodoro
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1 rounded-lg">
            ⏱ Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pomodoro" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-6 flex flex-col items-center gap-6">
              <Badge
                variant={isBreak ? "secondary" : "default"}
                className="text-sm px-4 py-1"
              >
                {isBreak ? "☕ Break Time" : "🎯 Focus Session"}
              </Badge>

              {/* Circular Timer */}
              <div className="relative w-40 h-40">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 120 120"
                  aria-label="Pomodoro timer ring"
                >
                  <title>Pomodoro timer</title>
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke={
                      isBreak ? "oklch(0.78 0.14 75)" : "oklch(0.52 0.13 192)"
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={
                      circumference - (pomodoroProgress / 100) * circumference
                    }
                    className="timer-ring transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-display font-bold tabular-nums">
                    {formatTime(pomodoroTime)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setPomodoroRunning((r) => !r)}
                  className="rounded-xl px-8 gradient-teal text-white border-0 gap-2"
                >
                  {pomodoroRunning ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" /> Start
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetPomodoro}
                  className="rounded-xl gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                25 min focus → 5 min break cycle. Complete {pomodoroCount}{" "}
                pomodoros today.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="mt-4">
          <Card className="border-border">
            <CardContent className="p-6 flex flex-col items-center gap-6">
              {!customStarted && (
                <div className="w-full space-y-2">
                  <Label className="text-sm font-medium">
                    Duration (minutes)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="180"
                    value={customMinutes}
                    onChange={(e) => {
                      const v = Number.parseInt(e.target.value) || 30;
                      setCustomMinutes(v);
                      setCustomTime(v * 60);
                    }}
                    className="rounded-xl text-center text-lg font-bold"
                  />
                </div>
              )}

              {/* Circular Timer */}
              <div className="relative w-40 h-40">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 120 120"
                  aria-label="Custom timer ring"
                >
                  <title>Custom timer</title>
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="oklch(0.78 0.14 75)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={
                      circumference - (customProgress / 100) * circumference
                    }
                    className="timer-ring transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-display font-bold tabular-nums">
                    {formatTime(customTime)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                {!customStarted ? (
                  <Button
                    onClick={startCustom}
                    className="rounded-xl px-8 gradient-amber text-white border-0 gap-2"
                  >
                    <Play className="w-4 h-4" /> Start
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setCustomRunning((r) => !r)}
                      className="rounded-xl px-8 gradient-amber text-white border-0 gap-2"
                    >
                      {customRunning ? (
                        <>
                          <Pause className="w-4 h-4" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" /> Resume
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetCustom}
                      className="rounded-xl gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
