export type Role = 'user' | 'admin';

export interface User {
  id: string; // This is the unique key for login
  firstName: string;
  lastName: string;
  role: Role;
  assignedTasks: string[];
}

export interface Card {
  id: string;
  content: string;
}

// --- Task Types ---

export interface CardSortingTask {
  id: string;
  type: 'card_sorting';
  title: string;
  description: string;
  cards: Card[];
  createdBy: string; // Admin's user ID
}

export interface Alternative {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  alternatives: Alternative[];
}

export interface AlternativesTask {
  id: string;
  type: 'alternatives';
  title: string;
  description: string;
  questions: Question[];
  createdBy: string; // Admin's user ID
}

export type Task = CardSortingTask | AlternativesTask;


// --- Submission Types ---

export interface CardSortingCategory {
  id: string;
  name: string;
  cards: Card[];
}

export interface CardSortingSubmission {
  id: string;
  type: 'card_sorting';
  userId: string;
  taskId: string;
  results: CardSortingCategory[];
  completedAt: string; // ISO date string
}

export interface Answer {
  questionId: string;
  selectedAlternativeId: string;
}

export interface AlternativesSubmission {
  id:string;
  type: 'alternatives';
  userId: string;
  taskId: string;
  answers: Answer[];
  completedAt: string; // ISO date string
}

export type Submission = CardSortingSubmission | AlternativesSubmission;


export interface AppData {
  users: User[];
  tasks: Task[];
  submissions: Submission[];
}