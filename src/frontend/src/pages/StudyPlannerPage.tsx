import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  List,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Task } from "../backend";
import {
  useAddTask,
  useDeleteTask,
  useGetTasks,
  useUpdateTask,
} from "../hooks/useQueries";

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "English",
  "History",
  "Geography",
  "Economics",
  "Other",
];
const PRIORITIES = ["Low", "Medium", "High"];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface TaskFormData {
  title: string;
  subject: string;
  dueDate: string;
  isExam: boolean;
  durationHours: number;
  priority: string;
  recurring: boolean;
}

const defaultForm: TaskFormData = {
  title: "",
  subject: "Mathematics",
  dueDate: new Date().toISOString().split("T")[0],
  isExam: false,
  durationHours: 1,
  priority: "Medium",
  recurring: false,
};

/** Convert backend nanosecond timestamp to a UTC date string "YYYY-MM-DD" */
function nanosToUTCDateKey(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Build a UTC date key from year/month(0-based)/day */
function buildUTCDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

/** Days remaining from now until a UTC date key */
function daysUntilUTCKey(dateKey: string): number {
  const target = new Date(`${dateKey}T00:00:00Z`).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export default function StudyPlannerPage() {
  const { data: tasks = [], isLoading } = useGetTasks();
  const { mutateAsync: addTask, isPending: adding } = useAddTask();
  const { mutateAsync: updateTask, isPending: updating } = useUpdateTask();
  const { mutateAsync: deleteTask } = useDeleteTask();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormData>(defaultForm);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const completedCount = tasks.filter((t) => t.completed).length;
  const completionPct =
    tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Today's tasks using UTC comparison
  const todayUTCKey = useMemo(() => {
    const now = new Date();
    return buildUTCDateKey(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
  }, []);

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => nanosToUTCDateKey(t.dueDate) === todayUTCKey);
  }, [tasks, todayUTCKey]);

  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayPct =
    todayTasks.length > 0
      ? Math.round((todayCompleted / todayTasks.length) * 100)
      : 0;

  const openAdd = () => {
    setEditingTask(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    const dateKey = nanosToUTCDateKey(task.dueDate);
    setForm({
      title: task.title,
      subject: task.subject,
      dueDate: dateKey,
      isExam: task.isExam,
      durationHours: task.durationHours,
      priority: task.priority,
      recurring: task.recurring,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    // Parse as UTC midnight to avoid timezone shifts
    const dueDate =
      BigInt(new Date(`${form.dueDate}T00:00:00Z`).getTime()) *
      BigInt(1_000_000);
    try {
      if (editingTask) {
        await updateTask({
          id: editingTask.id,
          task: {
            ...editingTask,
            title: form.title,
            subject: form.subject,
            dueDate,
            isExam: form.isExam,
            durationHours: form.durationHours,
            priority: form.priority,
            recurring: form.recurring,
          },
        });
        toast.success("Task updated!");
      } else {
        await addTask({
          title: form.title,
          subject: form.subject,
          dueDate,
          isExam: form.isExam,
          durationHours: form.durationHours,
          priority: form.priority,
          recurring: form.recurring,
          reminderMinutes: null,
        });
        toast.success("Task added!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save task");
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      await updateTask({
        id: task.id,
        task: { ...task, completed: !task.completed },
      });
    } catch {
      toast.error("Failed to update task");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────

  const calendarYear = currentMonth.getFullYear();
  const calendarMonth = currentMonth.getMonth();

  /** Build the grid: array of date keys or null for empty cells */
  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: (string | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(null);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(buildUTCDateKey(calendarYear, calendarMonth, d));
    }

    // Trailing empty cells to complete the last row
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(null);
      }
    }

    return cells;
  }, [calendarYear, calendarMonth]);

  /** Map UTC date key → tasks for that day */
  const tasksByDateKey = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      const key = nanosToUTCDateKey(t.dueDate);
      // Only include tasks in the current calendar month
      const [y, m] = key.split("-").map(Number);
      if (y === calendarYear && m - 1 === calendarMonth) {
        if (!map[key]) map[key] = [];
        map[key].push(t);
      }
    }
    return map;
  }, [tasks, calendarYear, calendarMonth]);

  /** Tasks for the selected day panel */
  const selectedDayTasks = useMemo(() => {
    if (!selectedDayKey) return [];
    return tasks.filter((t) => nanosToUTCDateKey(t.dueDate) === selectedDayKey);
  }, [tasks, selectedDayKey]);

  const prevMonth = () => {
    setCurrentMonth(new Date(calendarYear, calendarMonth - 1, 1));
    setSelectedDayKey(null);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(calendarYear, calendarMonth + 1, 1));
    setSelectedDayKey(null);
  };

  const handleDayClick = (dateKey: string) => {
    setSelectedDayKey((prev) => (prev === dateKey ? null : dateKey));
  };

  const priorityColor = (p: string) => {
    if (p === "High") return "bg-destructive/20 text-destructive";
    if (p === "Medium") return "bg-accent/20 text-accent-foreground";
    return "bg-muted text-muted-foreground";
  };

  const monthLabel = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Study Planner</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organize your tasks and track progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setView((v) => (v === "list" ? "calendar" : "list"));
              setSelectedDayKey(null);
            }}
            className="rounded-xl gap-1.5"
          >
            {view === "list" ? (
              <>
                <Calendar className="w-3.5 h-3.5" /> Calendar
              </>
            ) : (
              <>
                <List className="w-3.5 h-3.5" /> List
              </>
            )}
          </Button>
          <Button
            onClick={openAdd}
            size="sm"
            className="rounded-xl gap-2 gradient-teal text-white border-0"
          >
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-display font-bold">{tasks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-display font-bold text-primary">
              {completedCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-display font-bold text-accent">
              {todayPct}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Today's Progress
            </p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-2xl font-display font-bold text-chart-4">
              {tasks.filter((t) => t.isExam && !t.completed).length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Upcoming Exams</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-sm font-bold text-primary">
              {completionPct}%
            </span>
          </div>
          <Progress value={completionPct} className="h-2.5 rounded-full" />
        </CardContent>
      </Card>

      {view === "calendar" ? (
        /* ── Calendar View ── */
        <div className="space-y-3">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">
                  {monthLabel}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-lg"
                    onClick={prevMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 rounded-lg"
                    onClick={nextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] font-semibold text-muted-foreground py-1.5 uppercase tracking-wide"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
                {calendarGrid.map((dateKey, i) => {
                  if (!dateKey) {
                    const emptyKey = `empty-cell-${i}`;
                    return (
                      <div
                        key={emptyKey}
                        className="bg-muted/30 min-h-[72px] p-1"
                        aria-hidden="true"
                      />
                    );
                  }

                  const dayNum = Number.parseInt(dateKey.split("-")[2], 10);
                  const dayTasks = tasksByDateKey[dateKey] || [];
                  const isToday = dateKey === todayUTCKey;
                  const isSelected = dateKey === selectedDayKey;
                  const hasTasks = dayTasks.length > 0;

                  return (
                    <button
                      type="button"
                      key={dateKey}
                      onClick={() => handleDayClick(dateKey)}
                      className={[
                        "bg-card min-h-[72px] p-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isSelected ? "bg-primary/10" : "hover:bg-muted/50",
                        hasTasks ? "cursor-pointer" : "cursor-default",
                      ].join(" ")}
                      aria-label={`${dateKey}${hasTasks ? `, ${dayTasks.length} task${dayTasks.length > 1 ? "s" : ""}` : ""}`}
                    >
                      {/* Day number */}
                      <span
                        className={[
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1",
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isSelected
                              ? "text-primary font-bold"
                              : "text-foreground",
                        ].join(" ")}
                      >
                        {dayNum}
                      </span>

                      {/* Task pills */}
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 2).map((t) => {
                          const daysLeft = daysUntilUTCKey(dateKey);
                          return (
                            <div
                              key={String(t.id)}
                              className={[
                                "truncate px-1 py-0.5 rounded text-[10px] leading-tight",
                                t.completed
                                  ? "bg-muted/60 text-muted-foreground line-through opacity-60"
                                  : t.isExam
                                    ? "bg-destructive/20 text-destructive font-medium"
                                    : "bg-primary/15 text-primary",
                              ].join(" ")}
                              title={t.title}
                            >
                              {t.isExam &&
                                !t.completed &&
                                daysLeft >= 0 &&
                                daysLeft <= 7 && (
                                  <span className="mr-0.5 font-bold">
                                    {daysLeft}d·
                                  </span>
                                )}
                              {t.title}
                            </div>
                          );
                        })}
                        {dayTasks.length > 2 && (
                          <div className="text-[10px] text-muted-foreground pl-1">
                            +{dayTasks.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-primary/15" />
                  <span className="text-[11px] text-muted-foreground">
                    Task
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-destructive/20" />
                  <span className="text-[11px] text-muted-foreground">
                    Exam
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-muted/60 opacity-60" />
                  <span className="text-[11px] text-muted-foreground">
                    Done
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected day task panel */}
          {selectedDayKey && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-display">
                    Tasks for{" "}
                    {new Date(`${selectedDayKey}T00:00:00Z`).toLocaleDateString(
                      "en-IN",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      },
                    )}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-lg"
                    onClick={() => setSelectedDayKey(null)}
                    aria-label="Close day panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks on this day.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDayTasks.map((task) => {
                      const daysLeft = daysUntilUTCKey(selectedDayKey);
                      return (
                        <div
                          key={String(task.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                            task.completed
                              ? "opacity-60 bg-muted/30 border-border"
                              : "bg-card border-border hover:border-primary/30"
                          }`}
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleComplete(task)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-medium text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}
                              >
                                {task.title}
                              </span>
                              {task.isExam && (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  EXAM
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${priorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {task.subject}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {task.durationHours}h
                              </span>
                              {task.isExam &&
                                !task.completed &&
                                daysLeft >= 0 && (
                                  <span
                                    className={`text-xs font-medium ${daysLeft <= 3 ? "text-destructive" : "text-accent"}`}
                                  >
                                    {daysLeft}d left
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 rounded-lg"
                              onClick={() => openEdit(task)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 rounded-lg text-destructive hover:text-destructive"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* ── List View ── */
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">All Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No tasks yet</p>
                <p className="text-sm mt-1">
                  Add your first task to get started
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-[600px]">
                <div className="space-y-2 pr-2">
                  {tasks.map((task) => {
                    const dateKey = nanosToUTCDateKey(task.dueDate);
                    const daysLeft = daysUntilUTCKey(dateKey);
                    const displayDate = new Date(
                      `${dateKey}T00:00:00Z`,
                    ).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    });
                    return (
                      <div
                        key={String(task.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                          task.completed
                            ? "opacity-60 bg-muted/30"
                            : "bg-card border-border hover:border-primary/30"
                        }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-medium text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {task.title}
                            </span>
                            {task.isExam && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] px-1.5 py-0"
                              >
                                EXAM
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${priorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {task.subject}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {displayDate}
                            </span>
                            {task.isExam &&
                              !task.completed &&
                              daysLeft >= 0 && (
                                <span
                                  className={`text-xs font-medium ${daysLeft <= 3 ? "text-destructive" : "text-accent"}`}
                                >
                                  {daysLeft}d left
                                </span>
                              )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 rounded-lg"
                            onClick={() => openEdit(task)}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 rounded-lg text-destructive hover:text-destructive"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingTask ? "Edit Task" : "Add New Task"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Task title"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select
                  value={form.subject}
                  onValueChange={(v) => setForm((f) => ({ ...f, subject: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (hours)</Label>
                <Input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={form.durationHours}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      durationHours: Number.parseFloat(e.target.value) || 1,
                    }))
                  }
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="isExam"
                  checked={form.isExam}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, isExam: !!v }))
                  }
                />
                <label htmlFor="isExam" className="text-sm cursor-pointer">
                  Mark as Exam
                </label>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="recurring"
                  checked={form.recurring}
                  onCheckedChange={(v) =>
                    setForm((f) => ({ ...f, recurring: !!v }))
                  }
                />
                <label htmlFor="recurring" className="text-sm cursor-pointer">
                  Recurring
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={adding || updating}
                className="flex-1 rounded-xl gradient-teal text-white border-0"
              >
                {adding || updating
                  ? "Saving..."
                  : editingTask
                    ? "Update Task"
                    : "Add Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
