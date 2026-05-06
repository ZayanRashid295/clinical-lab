import { BaseApiService } from "../base/base-api.service";
import {
  StudyPlan,
  StudyPlanProgress,
  StudyTask,
  StudyTaskStatus,
  StudyTaskType,
} from "./types";

export interface CreateStudyPlanPayload {
  name: string;
  description?: string;
  goal?: string;
  startDate: string;
  endDate: string;
}
export type UpdateStudyPlanPayload = Partial<CreateStudyPlanPayload>;

export interface CreateStudyTaskPayload {
  title: string;
  description?: string;
  type?: StudyTaskType;
  scheduledFor: string;
  durationMinutes?: number;
  systemId?: string;
  topicId?: string;
  subtopicId?: string;
  questionPaperId?: string;
}
export type UpdateStudyTaskPayload = Partial<CreateStudyTaskPayload> & {
  status?: StudyTaskStatus;
};

export interface QueryStudyTasksParams {
  status?: StudyTaskStatus;
  date?: string; // YYYY-MM-DD
  from?: string;
  to?: string;
}

class StudyPlansService extends BaseApiService {
  listPlans(): Promise<StudyPlan[]> {
    return this.get("/study-plans");
  }

  getActive(): Promise<StudyPlan | null> {
    return this.get("/study-plans/active");
  }

  progress(): Promise<StudyPlanProgress> {
    return this.get("/study-plans/progress");
  }

  createPlan(payload: CreateStudyPlanPayload): Promise<StudyPlan> {
    return this.post("/study-plans", payload);
  }

  updatePlan(id: string, payload: UpdateStudyPlanPayload): Promise<StudyPlan> {
    return this.patch(`/study-plans/${id}`, payload);
  }

  deletePlan(id: string): Promise<{ ok: true }> {
    return this.delete(`/study-plans/${id}`);
  }

  listTasks(q?: QueryStudyTasksParams): Promise<StudyTask[]> {
    return this.get("/study-plans/tasks/list", q);
  }

  createTask(payload: CreateStudyTaskPayload): Promise<StudyTask> {
    return this.post("/study-plans/tasks", payload);
  }

  updateTask(id: string, payload: UpdateStudyTaskPayload): Promise<StudyTask> {
    return this.patch(`/study-plans/tasks/${id}`, payload);
  }

  deleteTask(id: string): Promise<{ ok: true }> {
    return this.delete(`/study-plans/tasks/${id}`);
  }
}

export const studyPlansService = new StudyPlansService();
