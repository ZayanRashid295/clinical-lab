import { BaseApiService } from "../base/base-api.service";

class StudentInstitutionApiService extends BaseApiService {
  getContext() {
    return this.request("/student/institution");
  }

  listAssignments() {
    return this.request("/student/institution/assignments");
  }

  listCases(mode?: string) {
    const q = mode ? `?mode=${encodeURIComponent(mode)}` : "";
    return this.request(`/student/institution/cases${q}`);
  }

  getCase(caseId: string) {
    return this.request(
      `/student/institution/cases/${encodeURIComponent(caseId)}`,
    );
  }

  updateAssignmentProgress(
    assignmentId: string,
    body: {
      status?: string;
      conversationId?: string;
      score?: number;
      institutionCaseId?: string;
    },
  ) {
    return this.request(
      `/student/institution/assignments/${encodeURIComponent(assignmentId)}/progress`,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    );
  }

  listQuestions() {
    return this.request("/student/institution/questions");
  }

  listMessageThreads() {
    return this.request("/student/institution/messages/threads");
  }

  getThread(threadId: string) {
    return this.request(
      `/student/institution/messages/threads/${encodeURIComponent(threadId)}`,
    );
  }

  openFacultyThread(facultyUserId: string) {
    return this.request(
      `/student/institution/messages/with-faculty/${encodeURIComponent(facultyUserId)}`,
      { method: "POST" },
    );
  }

  sendMessage(threadId: string, content: string) {
    return this.request(
      `/student/institution/messages/threads/${encodeURIComponent(threadId)}`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      },
    );
  }
}

export const studentInstitutionApiService = new StudentInstitutionApiService();
