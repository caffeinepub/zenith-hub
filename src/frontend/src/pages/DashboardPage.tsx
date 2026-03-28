import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  BookOpen,
  Brain,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useGetCompletedTasks,
  useGetExpenses,
  useGetFinancialOverview,
  useGetTasks,
  useGetUpcomingExams,
  useGetWeekStudyHours,
} from "../hooks/useQueries";
import { formatINR } from "../utils/currency";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EXPENSE_COLORS = ["#0d9488", "#f59e0b", "#6366f1", "#10b981", "#f97316"];
const CATEGORIES = ["Food", "Transport", "Books", "Subscriptions", "Misc"];

export default function DashboardPage() {
  const { data: tasks = [] } = useGetTasks();
  const { data: completedTasks = [] } = useGetCompletedTasks();
  const { data: weekHours = [0, 0, 0, 0, 0, 0, 0], isLoading: hoursLoading } =
    useGetWeekStudyHours();
  const { data: expenses = [], isLoading: expensesLoading } = useGetExpenses();
  const { data: financialOverview } = useGetFinancialOverview();
  const { data: upcomingExams = [] } = useGetUpcomingExams();

  const productivityPct =
    tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

  const totalWeekHours = weekHours.reduce((a, b) => a + b, 0);

  const today = new Date();
  const weekDayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return DAYS[d.getDay()];
  });

  const weekChartData = weekHours
    .slice()
    .reverse()
    .map((h, i) => ({
      day: weekDayLabels[i],
      hours: Number.parseFloat(h.toFixed(1)),
    }));

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return CATEGORIES.map((cat, i) => ({
      name: cat,
      value: map[cat] || 0,
      color: EXPENSE_COLORS[i],
    })).filter((c) => c.value > 0);
  }, [expenses]);

  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const availableBalance = financialOverview?.[0] ?? 0;
  const savingsGoal = financialOverview?.[1] ?? 0;

  const statCards = [
    {
      title: "Weekly Study Hours",
      value: `${totalWeekHours.toFixed(1)}h`,
      icon: Clock,
      color: "text-primary",
      bg: "bg-primary/10",
      sub: `${tasks.length} tasks planned`,
    },
    {
      title: "Productivity",
      value: `${productivityPct}%`,
      icon: Target,
      color: "text-accent",
      bg: "bg-accent/10",
      sub: `${completedTasks.length}/${tasks.length} tasks done`,
    },
    {
      title: "Monthly Expenses",
      value: formatINR(totalExpenses),
      icon: TrendingUp,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
      sub: `Balance: ${formatINR(availableBalance)}`,
    },
    {
      title: "Upcoming Exams",
      value: `${upcomingExams.length}`,
      icon: BookOpen,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      sub: upcomingExams[0]
        ? `Next: ${upcomingExams[0].subject}`
        : "No exams scheduled",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {statCards.map(({ title, value, icon: Icon, color, bg, sub }) => (
          <Card key={title} className="card-hover border-border">
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-xl ${bg} mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-display font-bold">{value}</p>
              <p className="text-xs font-medium text-foreground mt-0.5">
                {title}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Study Hours */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              Weekly Study Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hoursLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={weekChartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                    formatter={(v: number) => [`${v}h`, "Study Hours"]}
                  />
                  <Bar
                    dataKey="hours"
                    fill="oklch(0.52 0.13 192)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Expense Pie Chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesLoading ? (
              <Skeleton className="h-48 w-full rounded-xl" />
            ) : expenseByCategory.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No expenses recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatINR(v), ""]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Productivity & Savings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              Productivity Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-display font-bold">
                {productivityPct}%
              </span>
              <span className="text-muted-foreground text-sm mb-1">
                completion rate
              </span>
            </div>
            <Progress value={productivityPct} className="h-3 rounded-full" />
            <p className="text-xs text-muted-foreground">
              {completedTasks.length} of {tasks.length} tasks completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-chart-3" />
              Savings Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {savingsGoal > 0 ? (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-display font-bold">
                    {formatINR(Math.max(0, availableBalance))}
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    100,
                    (Math.max(0, availableBalance) / savingsGoal) * 100,
                  )}
                  className="h-3 rounded-full"
                />
                <p className="text-xs text-muted-foreground">
                  Goal: {formatINR(savingsGoal)}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Set a savings goal in Finance Tracker
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingExams.slice(0, 3).map((exam) => {
                const daysLeft = Math.ceil(
                  (Number(exam.dueDate) / 1_000_000 - Date.now()) /
                    (1000 * 60 * 60 * 24),
                );
                return (
                  <div
                    key={String(exam.id)}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium text-sm">{exam.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exam.subject}
                      </p>
                    </div>
                    <Badge
                      variant={daysLeft <= 3 ? "destructive" : "secondary"}
                    >
                      {daysLeft > 0 ? `${daysLeft}d left` : "Today!"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t border-border">
        © {new Date().getFullYear()} Zenith Hub — Built with{" "}
        <span className="text-red-400">♥</span> using{" "}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
