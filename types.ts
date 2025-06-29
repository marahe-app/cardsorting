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

export interface CardSortingTask {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  createdBy: string; // Admin's user ID
}

export interface CardSortingCategory {
  id: string;
  name: string;
  cards: Card[];
}

export interface CardSortingSubmission {
  id: string;
  userId: string;
  taskId: string;
  results: CardSortingCategory[];
  completedAt: string; // ISO date string
}

export interface AppData {
  users: User[];
  tasks: CardSortingTask[];
  submissions: CardSortingSubmission[];
}