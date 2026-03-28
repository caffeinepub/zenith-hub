import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Expense, Profile, Task } from "../backend";
import { useActor } from "./useActor";

// ─── Profile ────────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<Profile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useCompleteProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      schoolClass,
      passcode,
    }: { name: string; schoolClass: string; passcode: bigint | null }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.completeProfile(name, schoolClass, passcode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Profile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function useGetTasks() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTasks();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetCompletedTasks() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["completedTasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCompletedTasks();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetUpcomingExams() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Task[]>({
    queryKey: ["upcomingExams"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUpcomingExams();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      subject: string;
      dueDate: bigint;
      isExam: boolean;
      durationHours: number;
      recurring: boolean;
      priority: string;
      reminderMinutes: bigint | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addTask(
        params.title,
        params.subject,
        params.dueDate,
        params.isExam,
        params.durationHours,
        params.recurring,
        params.priority,
        params.reminderMinutes,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["completedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingExams"] });
    },
  });
}

export function useUpdateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, task }: { id: bigint; task: Task }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateTask(id, task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["completedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingExams"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["completedTasks"] });
      queryClient.invalidateQueries({ queryKey: ["upcomingExams"] });
    },
  });
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export function useGetExpenses() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: async () => {
      if (!actor) return [];
      const categories = [
        "Food",
        "Transport",
        "Books",
        "Subscriptions",
        "Misc",
      ];
      const results = await Promise.all(
        categories.map((cat) => actor.getExpensesByCategory(cat)),
      );
      return results.flat().sort((a, b) => Number(b.date - a.date));
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      amount: number;
      category: string;
      date: bigint;
      description: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addExpense(
        params.amount,
        params.category,
        params.date,
        params.description,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financialOverview"] });
    },
  });
}

export function useDeleteExpense() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteExpense(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["financialOverview"] });
    },
  });
}

export function useGetFinancialOverview() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<[number, number]>({
    queryKey: ["financialOverview"],
    queryFn: async () => {
      if (!actor) return [0, 0];
      return actor.getFinancialOverview();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSetMonthlyBudget() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (budget: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setMonthlyBudget(budget);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financialOverview"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useSetSavingsGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.setSavingsGoal(goal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financialOverview"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// ─── Study Sessions ──────────────────────────────────────────────────────────

export function useLogStudySession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      subject: string;
      durationHours: number;
      date: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.logStudySession(
        params.subject,
        params.durationHours,
        params.date,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekStudyHours"] });
    },
  });
}

export function useGetWeekStudyHours() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<number[]>({
    queryKey: ["weekStudyHours"],
    queryFn: async () => {
      if (!actor) return [0, 0, 0, 0, 0, 0, 0];
      return actor.getWeekStudyHours();
    },
    enabled: !!actor && !actorFetching,
  });
}

// ─── AI Tasks ────────────────────────────────────────────────────────────────

export function useAddAITask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      type_: string;
      input: string;
      output: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addAITask(params.type_, params.input, params.output);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiHistory"] });
    },
  });
}

// ─── Subject Performance ─────────────────────────────────────────────────────

export function useGetTaskCompletionBySubject(subject: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<number>({
    queryKey: ["subjectCompletion", subject],
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getTaskCompletionBySubject(subject);
    },
    enabled: !!actor && !actorFetching && !!subject,
  });
}

// ─── Trips (localStorage-based) ──────────────────────────────────────────────

export interface TripWaypoint {
  id: string;
  name: string;
  notes: string;
}

export interface TripChecklistItem {
  id: string;
  text: string;
  packed: boolean;
}

export interface TripExpenseItem {
  id: string;
  amount: number;
  category: string;
  note: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  description: string;
  budget: number;
  waypoints: TripWaypoint[];
  checklist: TripChecklistItem[];
  expenses: TripExpenseItem[];
  createdAt: number;
}

const TRIPS_STORAGE_KEY = "zenith_hub_trips";

function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTrips(trips: Trip[]): void {
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useGetTrips() {
  return useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: async () => loadTrips(),
    staleTime: 0,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      title: string;
      destination: string;
      startDate: string;
      endDate: string;
      description: string;
      budget: number;
    }) => {
      const trips = loadTrips();
      const newTrip: Trip = {
        id: generateId(),
        ...params,
        waypoints: [],
        checklist: [],
        expenses: [],
        createdAt: Date.now(),
      };
      trips.push(newTrip);
      saveTrips(trips);
      return newTrip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trip: Trip) => {
      const trips = loadTrips();
      const idx = trips.findIndex((t) => t.id === trip.id);
      if (idx !== -1) {
        trips[idx] = trip;
        saveTrips(trips);
      }
      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const trips = loadTrips().filter((t) => t.id !== tripId);
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useAddWaypoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tripId: string;
      name: string;
      notes: string;
    }) => {
      const trips = loadTrips();
      const trip = trips.find((t) => t.id === params.tripId);
      if (!trip) throw new Error("Trip not found");
      trip.waypoints.push({
        id: generateId(),
        name: params.name,
        notes: params.notes,
      });
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useRemoveWaypoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: string; waypointId: string }) => {
      const trips = loadTrips();
      const trip = trips.find((t) => t.id === params.tripId);
      if (!trip) throw new Error("Trip not found");
      trip.waypoints = trip.waypoints.filter((w) => w.id !== params.waypointId);
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: string; text: string }) => {
      const trips = loadTrips();
      const trip = trips.find((t) => t.id === params.tripId);
      if (!trip) throw new Error("Trip not found");
      trip.checklist.push({
        id: generateId(),
        text: params.text,
        packed: false,
      });
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useRemoveChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: string; itemId: string }) => {
      const trips = loadTrips();
      const trip = trips.find((t) => t.id === params.tripId);
      if (!trip) throw new Error("Trip not found");
      trip.checklist = trip.checklist.filter((c) => c.id !== params.itemId);
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: string; itemId: string }) => {
      const trips = loadTrips();
      const trip = trips.find((t) => t.id === params.tripId);
      if (!trip) throw new Error("Trip not found");
      const item = trip.checklist.find((c) => c.id === params.itemId);
      if (item) item.packed = !item.packed;
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useAddTripExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tripId: string;
      amount: number;
      category: string;
      note: string;
    }) => {
      const trips = loadTrips();
      const trip = trips.find((t) => t.id === params.tripId);
      if (!trip) throw new Error("Trip not found");
      trip.expenses.push({
        id: generateId(),
        amount: params.amount,
        category: params.category,
        note: params.note,
      });
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useDeleteTripExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tripId: string; expenseId: string }) => {
      const trips = loadTrips();
      const trip = trips.find((t) => t.id === params.tripId);
      if (!trip) throw new Error("Trip not found");
      trip.expenses = trip.expenses.filter((e) => e.id !== params.expenseId);
      saveTrips(trips);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}
