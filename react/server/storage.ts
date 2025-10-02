import { type User, type UpsertUser, type Case, type InsertCase } from "@shared/schema";
import { randomUUID } from "crypto";

// Storage interface
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getCases(filters?: { specialty?: string; difficulty?: string }): Promise<Case[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cases: Map<string, Case>;

  constructor() {
    this.users = new Map();
    this.cases = new Map();
    this.initializeCases();
  }

  private initializeCases() {
    const sampleCases: InsertCase[] = [
      {
        title: "Acute Chest Pain in a 55-Year-Old Male",
        description: "A 55-year-old male presents to the emergency department with acute onset chest pain that started 2 hours ago.",
        specialty: "Cardiology",
        difficulty: "intermediate",
        duration: 15,
      },
      {
        title: "Pediatric Fever and Rash",
        description: "A 4-year-old child presents with fever and a widespread rash that appeared this morning.",
        specialty: "Pediatrics",
        difficulty: "beginner",
        duration: 12,
      },
      {
        title: "First Episode Psychosis",
        description: "A 22-year-old university student is brought in by family members concerned about recent behavioral changes.",
        specialty: "Psychiatry",
        difficulty: "advanced",
        duration: 20,
      },
      {
        title: "Sudden Onset Headache",
        description: "A 42-year-old woman presents with the worst headache of her life that started suddenly 3 hours ago.",
        specialty: "Neurology",
        difficulty: "intermediate",
        duration: 18,
      },
      {
        title: "Chronic Cough and Shortness of Breath",
        description: "A 65-year-old presents with a chronic cough and progressive shortness of breath over the past 6 months.",
        specialty: "Pulmonology",
        difficulty: "intermediate",
        duration: 20,
      },
    ];

    sampleCases.forEach((caseData) => {
      const id = randomUUID();
      const caseItem: Case = {
        id,
        ...caseData,
        createdAt: new Date(),
      };
      this.cases.set(id, caseItem);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: this.users.get(userData.id!)?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getCases(filters?: { specialty?: string; difficulty?: string }): Promise<Case[]> {
    let casesArray = Array.from(this.cases.values());

    if (filters?.specialty && filters.specialty !== 'all') {
      casesArray = casesArray.filter(c => c.specialty.toLowerCase() === filters.specialty!.toLowerCase());
    }

    if (filters?.difficulty && filters.difficulty !== 'all') {
      casesArray = casesArray.filter(c => c.difficulty === filters.difficulty);
    }

    return casesArray;
  }
}

export const storage = new MemStorage();
