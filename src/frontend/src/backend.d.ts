import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    id: bigint;
    title: string;
    reminderMinutes?: bigint;
    subject: string;
    recurring: boolean;
    completed: boolean;
    durationHours: number;
    dueDate: Time;
    isExam: boolean;
    priority: string;
}
export type Time = bigint;
export interface Profile {
    monthlyBudget: number;
    passcode?: bigint;
    name: string;
    schoolClass: string;
    savingsGoal: number;
}
export interface Expense {
    id: bigint;
    date: Time;
    description: string;
    category: string;
    amount: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAITask(type: string, input: string, output: string): Promise<void>;
    addExpense(amount: number, category: string, date: Time, description: string): Promise<void>;
    addTask(title: string, subject: string, dueDate: Time, isExam: boolean, durationHours: number, recurring: boolean, priority: string, reminderMinutes: bigint | null): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeProfile(name: string, schoolClass: string, passcode: bigint | null): Promise<void>;
    deleteExpense(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompletedTasks(): Promise<Array<Task>>;
    getExpensesByCategory(category: string): Promise<Array<Expense>>;
    getFinancialOverview(): Promise<[number, number]>;
    getTask(_id: bigint): Promise<Task>;
    getTaskCompletionBySubject(subject: string): Promise<number>;
    getTasks(): Promise<Array<Task>>;
    getUpcomingExams(): Promise<Array<Task>>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    getWeekStudyHours(): Promise<Array<number>>;
    isCallerAdmin(): Promise<boolean>;
    logStudySession(subject: string, durationHours: number, date: Time): Promise<void>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    setMonthlyBudget(budget: number): Promise<void>;
    setSavingsGoal(goal: number): Promise<void>;
    updateTask(id: bigint, updatedTask: Task): Promise<void>;
}
