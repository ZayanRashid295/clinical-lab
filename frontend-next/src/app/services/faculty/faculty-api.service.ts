import { BaseApiService } from "../base/base-api.service";

class FacultyApiService extends BaseApiService {
  getDashboard() {
    return this.request("/faculty/dashboard");
  }

  listStudents(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request(`/faculty/students${q}`);
  }

  getStudent(studentId: string) {
    return this.request(`/faculty/students/${encodeURIComponent(studentId)}`);
  }

  compareStudents(studentIds: string[]) {
    return this.request("/faculty/compare", {
      method: "POST",
      body: JSON.stringify({ studentIds }),
    });
  }

  listAssignments() {
    return this.request("/faculty/assignments");
  }

  createAssignment(body: Record<string, unknown>) {
    return this.request("/faculty/assignments", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  publishAssignment(id: string) {
    return this.request(`/faculty/assignments/${encodeURIComponent(id)}/publish`, {
      method: "POST",
    });
  }

  listCases(mode?: string) {
    const q = mode ? `?mode=${encodeURIComponent(mode)}` : "";
    return this.request(`/faculty/cases${q}`);
  }

  createCase(body: Record<string, unknown>) {
    return this.request("/faculty/cases", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  publishCase(id: string) {
    return this.request(`/faculty/cases/${encodeURIComponent(id)}/publish`, {
      method: "POST",
    });
  }

  listQuestions() {
    return this.request("/faculty/questions");
  }

  createQuestion(body: Record<string, unknown>) {
    return this.request("/faculty/questions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  listQuestionSets() {
    return this.request("/faculty/question-sets");
  }

  listThreads() {
    return this.request("/faculty/messages/threads");
  }

  getThread(threadId: string) {
    return this.request(
      `/faculty/messages/threads/${encodeURIComponent(threadId)}`,
    );
  }

  openThreadWithStudent(studentId: string) {
    return this.request(
      `/faculty/messages/with-student/${encodeURIComponent(studentId)}`,
      { method: "POST" },
    );
  }

  sendMessage(threadId: string, content: string) {
    return this.request(
      `/faculty/messages/threads/${encodeURIComponent(threadId)}`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
  }
}

export const facultyApiService = new FacultyApiService();
