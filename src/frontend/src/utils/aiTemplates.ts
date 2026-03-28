export interface TopicExplanation {
  definition: string;
  explanation: string;
  example: string;
  keyPoints: string[];
}

export interface Summary {
  shortSummary: string;
  keyPoints: string[];
  formulas: string[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ExamPlan {
  day: number;
  date: string;
  topics: string[];
  priority: "High" | "Medium" | "Low";
  hours: number;
}

export interface PerformanceSuggestion {
  area: string;
  suggestion: string;
  priority: "High" | "Medium" | "Low";
}

export function generateTopicExplanation(topic: string): TopicExplanation {
  const t = topic.trim();
  return {
    definition: `${t} is a fundamental concept in academics that forms the basis for understanding related topics in your curriculum.`,
    explanation: `${t} can be understood by breaking it down into its core components. It involves systematic analysis and application of principles that govern how this concept works in real-world scenarios. Students studying ${t} should focus on understanding the underlying mechanisms and how they interact with each other.`,
    example: `Consider a practical scenario: When you apply the principles of ${t} in a problem, you start by identifying the key variables, then apply the relevant formulas or rules, and finally interpret the results in context. For instance, in a Class 12 exam question about ${t}, you would typically be asked to either explain the concept, solve a numerical, or analyze a given situation.`,
    keyPoints: [
      `${t} is a core topic in the Class 12 syllabus`,
      `Understanding ${t} requires knowledge of prerequisite concepts`,
      `${t} has both theoretical and practical applications`,
      `Common exam questions on ${t} include definitions, derivations, and numericals`,
      `Practice previous year questions on ${t} for better exam preparation`,
    ],
  };
}

export function generateSummary(text: string): Summary {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

  // Build short summary from first 2-3 sentences
  const summaryCount = Math.min(
    3,
    Math.max(1, Math.ceil(sentences.length / 4)),
  );
  const summarySentences = sentences.slice(0, summaryCount);
  const shortSummary =
    summarySentences.length > 0
      ? `${summarySentences.join(". ").trim()}.`
      : "This text covers important academic concepts. Review the key points below for a structured breakdown.";

  // Extract 5 key points from different parts of the text
  const totalSentences = sentences.length;
  const getAt = (fraction: number) => {
    const idx = Math.min(
      Math.floor(fraction * totalSentences),
      totalSentences - 1,
    );
    return sentences[idx]
      ? `"${sentences[idx].substring(0, 90)}${sentences[idx].length > 90 ? "…" : ""}"`
      : null;
  };

  const keyPoints: string[] = [
    `The text contains approximately ${wordCount} words across ${totalSentences} sentences.`,
    getAt(0)
      ? `Opening: ${getAt(0)}`
      : "Introduction establishes the main concept.",
    getAt(0.25)
      ? `Early point: ${getAt(0.25)}`
      : "Supporting arguments are presented.",
    getAt(0.5)
      ? `Central idea: ${getAt(0.5)}`
      : "The central theme is developed throughout.",
    getAt(0.85)
      ? `Closing: ${getAt(0.85)}`
      : "The text concludes with key takeaways.",
  ];

  return {
    shortSummary,
    keyPoints,
    formulas: [
      "Scan the text for equations, formulas, and definitions",
      "Highlight mathematical relationships and constants",
      "Note any laws, principles, or theorems mentioned",
    ],
  };
}

export function generateFlashcards(topic: string): Flashcard[] {
  const t = topic.trim();
  return [
    {
      question: `What is the definition of ${t}?`,
      answer: `${t} is a key concept that involves understanding its fundamental principles, properties, and applications in the context of Class 12 academics.`,
    },
    {
      question: `What are the main characteristics of ${t}?`,
      answer:
        "The main characteristics include: (1) It has specific properties that distinguish it from related concepts, (2) It follows certain rules and principles, (3) It can be applied in various problem-solving scenarios.",
    },
    {
      question: `How is ${t} applied in real-world scenarios?`,
      answer: `${t} is applied in various real-world contexts including scientific research, engineering, economics, and everyday problem-solving. Understanding its applications helps in grasping its importance.`,
    },
    {
      question: `What are common mistakes students make when studying ${t}?`,
      answer: `Common mistakes include: confusing ${t} with related concepts, not practicing enough numerical problems, skipping derivations, and not understanding the underlying principles before memorizing formulas.`,
    },
    {
      question: `What are the important formulas/rules related to ${t}?`,
      answer: `Key formulas and rules for ${t} should be derived from first principles, understood conceptually, and practiced through multiple problem types. Always note the conditions under which each formula applies.`,
    },
  ];
}

export function generateMCQs(topic: string): MCQ[] {
  const t = topic.trim();
  return [
    {
      question: `Which of the following best describes ${t}?`,
      options: [
        "A fundamental concept with specific properties and applications",
        "An advanced topic only relevant to higher studies",
        "A purely theoretical concept with no practical use",
        "A concept unrelated to the Class 12 curriculum",
      ],
      correctIndex: 0,
    },
    {
      question: `What is the primary purpose of studying ${t} in Class 12?`,
      options: [
        "To memorize definitions for exams only",
        "To build a foundation for higher education and practical applications",
        "To understand historical developments in the subject",
        "To prepare for competitive sports",
      ],
      correctIndex: 1,
    },
    {
      question: `Which approach is most effective for mastering ${t}?`,
      options: [
        "Reading the textbook once before the exam",
        "Only solving previous year questions",
        "Understanding concepts, practicing problems, and reviewing regularly",
        "Memorizing all formulas without understanding",
      ],
      correctIndex: 2,
    },
    {
      question: `How does ${t} relate to other topics in the syllabus?`,
      options: [
        "It is completely independent of other topics",
        "It builds upon prerequisite concepts and supports advanced topics",
        "It is only relevant to one specific chapter",
        "It has no connection to practical applications",
      ],
      correctIndex: 1,
    },
    {
      question: `What type of questions on ${t} are most common in board exams?`,
      options: [
        "Only multiple choice questions",
        "Only essay-type questions",
        "A mix of definitions, short answers, numericals, and application questions",
        "Only diagram-based questions",
      ],
      correctIndex: 2,
    },
  ];
}

export function generateExamPlan(
  subjects: string[],
  examDate: Date,
): ExamPlan[] {
  const today = new Date();
  const daysUntilExam = Math.max(
    7,
    Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const planDays = Math.min(7, daysUntilExam);
  const subjectCount = subjects.length || 1;

  const plan: ExamPlan[] = [];
  for (let i = 0; i < planDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const subjectIndex = i % subjectCount;
    const subject = subjects[subjectIndex] || "General Revision";
    const isLastDays = i >= planDays - 2;
    const priority: "High" | "Medium" | "Low" = isLastDays
      ? "High"
      : i < 2
        ? "Low"
        : "Medium";

    plan.push({
      day: i + 1,
      date: date.toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      topics: isLastDays
        ? [
            `Quick revision of ${subject}`,
            "Practice previous year questions",
            "Formula sheet review",
          ]
        : [
            `Chapter 1-3 of ${subject}`,
            `Important derivations in ${subject}`,
            "Solve 10 practice problems",
          ],
      priority,
      hours: isLastDays ? 6 : priority === "Medium" ? 5 : 4,
    });
  }
  return plan;
}

export function generatePerformanceSuggestions(params: {
  totalTasks: number;
  completedTasks: number;
  weeklyHours: number[];
  subjects: string[];
}): PerformanceSuggestion[] {
  const { totalTasks, completedTasks, weeklyHours, subjects } = params;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const avgHours =
    weeklyHours.length > 0
      ? weeklyHours.reduce((a, b) => a + b, 0) / weeklyHours.length
      : 0;
  const suggestions: PerformanceSuggestion[] = [];

  if (completionRate < 0.5) {
    suggestions.push({
      area: "Task Completion",
      suggestion: `Your task completion rate is ${Math.round(completionRate * 100)}%. Try breaking large tasks into smaller subtasks and use the Pomodoro timer to maintain focus. Aim to complete at least 70% of your planned tasks daily.`,
      priority: "High",
    });
  } else if (completionRate < 0.8) {
    suggestions.push({
      area: "Task Completion",
      suggestion: `Good progress! Your completion rate is ${Math.round(completionRate * 100)}%. To reach 80%+, prioritize your most important tasks in the morning when your energy is highest.`,
      priority: "Medium",
    });
  } else {
    suggestions.push({
      area: "Task Completion",
      suggestion: `Excellent! You're completing ${Math.round(completionRate * 100)}% of your tasks. Maintain this momentum and consider increasing the difficulty or quantity of your study goals.`,
      priority: "Low",
    });
  }

  if (avgHours < 2) {
    suggestions.push({
      area: "Study Hours",
      suggestion: `You're averaging only ${avgHours.toFixed(1)} hours/day. Class 12 students should aim for 6-8 hours of focused study. Start with 3-4 hours and gradually increase using the Focus Timer.`,
      priority: "High",
    });
  } else if (avgHours < 5) {
    suggestions.push({
      area: "Study Hours",
      suggestion: `You're averaging ${avgHours.toFixed(1)} hours/day. This is a good start! Try to reach 6 hours by adding one extra Pomodoro session each day.`,
      priority: "Medium",
    });
  } else {
    suggestions.push({
      area: "Study Hours",
      suggestion: `Great dedication with ${avgHours.toFixed(1)} hours/day average! Ensure you're taking adequate breaks to prevent burnout. Quality over quantity matters.`,
      priority: "Low",
    });
  }

  if (subjects.length > 0) {
    suggestions.push({
      area: "Subject Balance",
      suggestion: `You have ${subjects.length} subjects tracked. Ensure you're distributing study time evenly. Use the Exam Strategy Planner to create a balanced revision schedule.`,
      priority: "Medium",
    });
  }

  suggestions.push({
    area: "Revision Strategy",
    suggestion:
      "Use the spaced repetition technique: review new material after 1 day, 3 days, 1 week, and 1 month. This significantly improves long-term retention for board exams.",
    priority: "Medium",
  });

  suggestions.push({
    area: "Exam Preparation",
    suggestion:
      "Solve at least 5 previous year question papers under timed conditions. This builds exam temperament and helps identify weak areas that need more attention.",
    priority: "High",
  });

  return suggestions;
}
