import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart2,
  BookOpen,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  HelpCircle,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddAITask,
  useGetCompletedTasks,
  useGetTasks,
  useGetWeekStudyHours,
} from "../hooks/useQueries";
import {
  type ExamPlan,
  type Flashcard,
  type MCQ,
  type PerformanceSuggestion,
  type Summary,
  type TopicExplanation,
  generateExamPlan,
  generateFlashcards,
  generateMCQs,
  generatePerformanceSuggestions,
  generateSummary,
  generateTopicExplanation,
} from "../utils/aiTemplates";

// ─── Sub-components ──────────────────────────────────────────────────────────

function TopicExplainerTab() {
  const { mutateAsync: saveAI } = useAddAITask();
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState<TopicExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic");
      return;
    }
    setLoading(true);
    const explanation = generateTopicExplanation(topic);
    setResult(explanation);
    setLoading(false);
    try {
      await saveAI({
        type_: "topic_explainer",
        input: topic,
        output: JSON.stringify(explanation),
      });
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter a topic (e.g. Photosynthesis, Derivatives...)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          className="rounded-xl flex-1"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl gradient-teal text-white border-0 gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Generating..." : "Explain"}
        </Button>
      </div>

      {result && (
        <div className="space-y-3 animate-fade-in">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                Definition
              </p>
              <p className="text-sm leading-relaxed">{result.definition}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Explanation
              </p>
              <p className="text-sm leading-relaxed">{result.explanation}</p>
            </CardContent>
          </Card>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-accent-foreground uppercase tracking-wider mb-1">
                Example
              </p>
              <p className="text-sm leading-relaxed">{result.example}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Key Points
              </p>
              <ul className="space-y-1.5">
                {result.keyPoints.map((pt, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function SummaryGeneratorTab() {
  const { mutateAsync: saveAI } = useAddAITask();
  const [text, setText] = useState("");
  const [result, setResult] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim() || text.trim().length < 20) {
      toast.error("Paste at least 20 characters of text");
      return;
    }
    setLoading(true);
    const summary = generateSummary(text);
    setResult(summary);
    setLoading(false);
    try {
      await saveAI({
        type_: "summary_generator",
        input: text.slice(0, 200),
        output: JSON.stringify(summary),
      });
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Paste your text below</Label>
        <Textarea
          placeholder="Paste a paragraph, chapter, or notes here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-xl min-h-[120px] resize-none"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full rounded-xl gradient-teal text-white border-0 gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "Generating..." : "Generate Summary"}
        </Button>
      </div>

      {result && (
        <div className="space-y-3 animate-fade-in">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                Short Summary
              </p>
              <p className="text-sm leading-relaxed">{result.shortSummary}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                5 Key Points
              </p>
              <ul className="space-y-2">
                {result.keyPoints.map((pt, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary font-bold shrink-0">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-accent-foreground uppercase tracking-wider mb-2">
                Important Formulas / Notes
              </p>
              <ul className="space-y-1.5">
                {result.formulas.map((f, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-accent font-bold shrink-0">→</span>
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function FlashcardGeneratorTab() {
  const { mutateAsync: saveAI } = useAddAITask();
  const [topic, setTopic] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic");
      return;
    }
    setLoading(true);
    const flashcards = generateFlashcards(topic);
    setCards(flashcards);
    setFlipped({});
    setLoading(false);
    try {
      await saveAI({
        type_: "flashcard_generator",
        input: topic,
        output: JSON.stringify(flashcards),
      });
    } catch {
      /* silent */
    }
  };

  const toggleFlip = (i: number) => setFlipped((f) => ({ ...f, [i]: !f[i] }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter a topic for flashcards..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          className="rounded-xl flex-1"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl gradient-teal text-white border-0 gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "..." : "Generate"}
        </Button>
      </div>

      {cards.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-muted-foreground">
            Click a card to reveal the answer
          </p>
          {cards.map((card, i) => (
            <button
              type="button"
              key={card.question}
              onClick={() => toggleFlip(i)}
              className="w-full text-left rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-card"
              style={{
                background: flipped[i]
                  ? "oklch(var(--primary) / 0.08)"
                  : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px]">
                      Q{i + 1}
                    </Badge>
                    {flipped[i] && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-0">
                        Answer Revealed
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium">{card.question}</p>
                  {flipped[i] && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Answer:
                      </p>
                      <p className="text-sm text-primary leading-relaxed">
                        {card.answer}
                      </p>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-muted-foreground">
                  {flipped[i] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MCQGeneratorTab() {
  const { mutateAsync: saveAI } = useAddAITask();
  const [topic, setTopic] = useState("");
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic");
      return;
    }
    setLoading(true);
    const questions = generateMCQs(topic);
    setMcqs(questions);
    setRevealed({});
    setSelected({});
    setLoading(false);
    try {
      await saveAI({
        type_: "mcq_generator",
        input: topic,
        output: JSON.stringify(questions),
      });
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter a topic for MCQs..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          className="rounded-xl flex-1"
        />
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl gradient-teal text-white border-0 gap-2 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? "..." : "Generate"}
        </Button>
      </div>

      {mcqs.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {mcqs.map((mcq, qi) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
            <Card key={qi} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    Q{qi + 1}
                  </Badge>
                  <p className="text-sm font-medium">{mcq.question}</p>
                </div>
                <div className="space-y-2">
                  {mcq.options.map((opt, oi) => {
                    const isSelected = selected[qi] === oi;
                    const isCorrect = oi === mcq.correctIndex;
                    const showResult = revealed[qi];
                    let optClass = "border-border bg-card";
                    if (showResult && isCorrect)
                      optClass = "border-chart-3 bg-chart-3/10";
                    else if (showResult && isSelected && !isCorrect)
                      optClass = "border-destructive bg-destructive/10";
                    else if (isSelected)
                      optClass = "border-primary bg-primary/10";

                    return (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          !revealed[qi] &&
                          setSelected((s) => ({ ...s, [qi]: oi }))
                        }
                        className={`w-full text-left p-3 rounded-xl border text-sm transition-all flex items-center gap-2 ${optClass}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs shrink-0">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {showResult && isCorrect && (
                          <Check className="w-4 h-4 text-chart-3 shrink-0" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <X className="w-4 h-4 text-destructive shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {!revealed[qi] && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-xl text-xs"
                    onClick={() => setRevealed((r) => ({ ...r, [qi]: true }))}
                  >
                    Reveal Answer
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ExamStrategyTab() {
  const { mutateAsync: saveAI } = useAddAITask();
  const [subjectsInput, setSubjectsInput] = useState("");
  const [examDate, setExamDate] = useState("");
  const [plan, setPlan] = useState<ExamPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!subjectsInput.trim()) {
      toast.error("Enter at least one subject");
      return;
    }
    if (!examDate) {
      toast.error("Select an exam date");
      return;
    }
    setLoading(true);
    const subjects = subjectsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const examPlan = generateExamPlan(subjects, new Date(examDate));
    setPlan(examPlan);
    setLoading(false);
    try {
      await saveAI({
        type_: "exam_strategy",
        input: `${subjectsInput} | ${examDate}`,
        output: JSON.stringify(examPlan),
      });
    } catch {
      /* silent */
    }
  };

  const priorityColor = (p: string) => {
    if (p === "High")
      return "bg-destructive/20 text-destructive border-destructive/30";
    if (p === "Medium")
      return "bg-accent/20 text-accent-foreground border-accent/30";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Subjects (comma-separated)</Label>
          <Input
            placeholder="e.g. Maths, Physics, Chemistry"
            value={subjectsInput}
            onChange={(e) => setSubjectsInput(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Exam Date</Label>
          <Input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className="rounded-xl"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full rounded-xl gradient-teal text-white border-0 gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? "Generating Plan..." : "Generate 7-Day Plan"}
      </Button>

      {plan.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm font-medium text-muted-foreground">
            Your personalized 7-day revision plan:
          </p>
          {plan.map((day) => (
            <Card key={day.day} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      {day.day}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{day.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.hours}h planned
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${priorityColor(day.priority)}`}
                  >
                    {day.priority} Priority
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {day.topics.map((topic, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary shrink-0 mt-0.5">▸</span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PerformanceAnalyzerTab() {
  const { mutateAsync: saveAI } = useAddAITask();
  const { data: tasks = [] } = useGetTasks();
  const { data: completedTasks = [] } = useGetCompletedTasks();
  const { data: weekHours = [] } = useGetWeekStudyHours();
  const [suggestions, setSuggestions] = useState<PerformanceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const subjects = [...new Set(tasks.map((t) => t.subject))];
  const totalWeekHours = weekHours.reduce((a, b) => a + b, 0);

  const handleAnalyze = async () => {
    setLoading(true);
    const result = generatePerformanceSuggestions({
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      weeklyHours: weekHours,
      subjects,
    });
    setSuggestions(result);
    setLoading(false);
    try {
      await saveAI({
        type_: "performance_analyzer",
        input: `tasks:${tasks.length},completed:${completedTasks.length},hours:${totalWeekHours.toFixed(1)}`,
        output: JSON.stringify(result),
      });
    } catch {
      /* silent */
    }
  };

  const priorityColor = (p: string) => {
    if (p === "High") return "border-destructive/40 bg-destructive/5";
    if (p === "Medium") return "border-accent/40 bg-accent/5";
    return "border-chart-3/40 bg-chart-3/5";
  };

  const priorityBadge = (p: string) => {
    if (p === "High") return "bg-destructive/20 text-destructive border-0";
    if (p === "Medium") return "bg-accent/20 text-accent-foreground border-0";
    return "bg-chart-3/20 text-chart-3 border-0";
  };

  return (
    <div className="space-y-4">
      {/* Stats Preview */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-display font-bold">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-display font-bold text-primary">
              {completedTasks.length}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-display font-bold text-accent">
              {totalWeekHours.toFixed(1)}h
            </p>
            <p className="text-xs text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full rounded-xl gradient-teal text-white border-0 gap-2"
      >
        <Sparkles className="w-4 h-4" />
        {loading ? "Analyzing..." : "Analyze My Performance"}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm font-medium text-muted-foreground">
            Personalized suggestions based on your data:
          </p>
          {suggestions.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static ordered list
            <Card key={i} className={`border ${priorityColor(s.priority)}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-semibold text-sm">{s.area}</p>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ${priorityBadge(s.priority)}`}
                  >
                    {s.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.suggestion}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AI_MODES = [
  {
    id: "topic",
    label: "Topic Explainer",
    icon: BookOpen,
    shortLabel: "Explain",
  },
  {
    id: "summary",
    label: "Summary Generator",
    icon: FileText,
    shortLabel: "Summary",
  },
  {
    id: "flashcard",
    label: "Flashcards",
    icon: CreditCard,
    shortLabel: "Cards",
  },
  { id: "mcq", label: "MCQ Generator", icon: HelpCircle, shortLabel: "MCQs" },
  {
    id: "exam",
    label: "Exam Strategy",
    icon: Calendar,
    shortLabel: "Strategy",
  },
  {
    id: "performance",
    label: "Performance Analyzer",
    icon: BarChart2,
    shortLabel: "Analyze",
  },
];

export default function AIAssistantPage() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">
            AI Study Assistant
          </h1>
          <p className="text-muted-foreground text-sm">
            Smart tools to supercharge your learning
          </p>
        </div>
      </div>

      <Tabs defaultValue="topic">
        <ScrollArea className="w-full">
          <TabsList className="w-full h-auto flex-wrap gap-1 p-1 rounded-xl">
            {AI_MODES.map((mode) => (
              <TabsTrigger
                key={mode.id}
                value={mode.id}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
              >
                <mode.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{mode.label}</span>
                <span className="sm:hidden">{mode.shortLabel}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        <div className="mt-4">
          <TabsContent value="topic">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Topic Explainer
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Enter any topic and get a structured explanation with
                  definition, examples, and key points.
                </p>
              </CardHeader>
              <CardContent>
                <TopicExplainerTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summary">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Summary Generator
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Paste any text and get a concise summary with key points and
                  important formulas.
                </p>
              </CardHeader>
              <CardContent>
                <SummaryGeneratorTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flashcard">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Flashcard Generator
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Generate 5 Q&A flashcards for any topic. Click a card to
                  reveal the answer.
                </p>
              </CardHeader>
              <CardContent>
                <FlashcardGeneratorTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mcq">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  MCQ Generator
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Generate 5 multiple-choice questions. Select an option and
                  reveal the correct answer.
                </p>
              </CardHeader>
              <CardContent>
                <MCQGeneratorTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exam">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Exam Strategy Planner
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Enter your subjects and exam date to get a personalized 7-day
                  revision plan.
                </p>
              </CardHeader>
              <CardContent>
                <ExamStrategyTab />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Performance Analyzer
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Analyze your study data and get personalized improvement
                  suggestions.
                </p>
              </CardHeader>
              <CardContent>
                <PerformanceAnalyzerTab />
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
