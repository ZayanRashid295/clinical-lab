import { ContentRegistry } from "../types/dashboard";

import BillingPage from "../components/Billing/BillingPage";
import BillingPlanManagement from "../components/Billing/BillingPlanManagement";
import PromotionManagement from "../components/Billing/PromotionManagement";
import PricingPage from "../components/Billing/PricingPage";
import ChatRoomsList from "../components/Chat/ChatRoomsList";
import SupportChatRoomsList from "../components/Chat/SupportChatRoomsList";
import NotificationsList from "../components/Notifications/NotificationsList";
import UserManagementContent from "../components/Content/UserManagementContent";
import ActivityLogsManagementContent from "../components/Content/ActivityLogsManagementContent";
import RoleManagementContent from "../components/Content/RoleManagementContent";
import SystemSettingsContent from "../components/Content/SystemSettingsContent";
import CategoryManagementContent from "../components/Content/CategoryManagementContent";
import ProductManagementContent from "../components/Content/ProductManagementContent";
import SystemManagementContent from "../components/Content/SystemManagementContent";
import ProductSubtypeManagementContent from "../components/Content/ProductSubtypeManagementContent";
import TopicManagementContent from "../components/Content/TopicManagementContent";
import SubtopicManagementContent from "../components/Content/SubtopicManagementContent";
import QuestionPaperManagementContent from "../components/Content/QuestionPaperManagementContent";
import QuestionPaperQuestionManagementContent from "../components/Content/QuestionPaperQuestionManagementContent";
import QuestionManagementContent from "../components/Content/QuestionManagementContent";
import QuestionChoiceManagementContent from "../components/Content/QuestionChoiceManagementContent";
import { adminDashboardConfig } from "./dashboard.configs";

// Import study components
import StudyIndexPage from "../components/Study/StudyIndexPage";
import StudyPlannerPage from "../components/Study/StudyPlannerPage";

// Import test creation components
import StudentDashboardPage from "../components/Dashboard/StudentDashboardPage";
import PerformanceDashboardPage from "../components/test-creation/PerformanceDashboardPage";
import StudyCreateTestPage from "../components/test-creation/StudyCreateTestPage";
import PreviousTestsPage from "../components/test-creation/PreviousTestsPage";

// Import test session components
import TestSessionPage from "../components/test-session/TestSessionPage";

// Import question generator components
import QuestionGeneratorPage from "../components/question-generator/QuestionGeneratorPage";
import QuestionGeneratorStudent from "../components/question-generator/QuestionGeneratorStudent";
import QuestionGeneratorAdmin from "../components/question-generator/QuestionGeneratorAdmin";
import OrgChartView from "../components/OrgChart/OrgChartView";
import MedPrepOverviewPage from "../components/medprep-ai/MedPrepOverviewPage";
import { EvaluationPage } from "../components/medprep-ai/EvaluationPage";
import { QaModePage } from "../components/medprep-ai/QaModePage";
import { LetMeDriveModePage } from "../components/medprep-ai/LetMeDriveModePage";
import { PracticeCasesPage } from "../components/medprep-ai/PracticeCasesPage";
import { PracticeNurseReportPage } from "../components/medprep-ai/PracticeNurseReportPage";
import { PracticeCaseRoutePage } from "../components/medprep-ai/PracticeCaseRoutePage";
import { LearningCaseRoutePage } from "../components/medprep-ai/LearningCaseRoutePage";
import { LearningModePage } from "../components/medprep-ai/LearningModePage";
import { LearnCasesPage } from "../components/medprep-ai/LearnCasesPage";
import { LearningNurseReportPage } from "../components/medprep-ai/LearningNurseReportPage";
import { EvaluationModePage } from "../components/medprep-ai/EvaluationModePage";
import { ShadowModePage } from "../components/medprep-ai/ShadowModePage";
import { ShadowCasesPage } from "../components/medprep-ai/ShadowCasesPage";
import { ShadowModePlayPage } from "../components/medprep-ai/ShadowModePlayPage";
import { EvaluationCasesPage } from "../components/medprep-ai/EvaluationCasesPage";
import { EvaluationNurseReportPage } from "../components/medprep-ai/EvaluationNurseReportPage";
import { MedPrepSlugGate } from "../components/medprep-ai/MedPrepSlugGate";

// Import launch / new-module pages
import NotificationsPage from "../components/Launch/NotificationsPage";
import AchievementsPage from "../components/Launch/AchievementsPage";
import DiscussionsPage from "../components/Launch/DiscussionsPage";
import AiTutorPage from "../components/Launch/AiTutorPage";
import MockExamsPage from "../components/Launch/MockExamsPage";
import StudyGroupsPage from "../components/Launch/StudyGroupsPage";
import FeedbackPage from "../components/Launch/FeedbackPage";
import QuestionReportsPage from "../components/Launch/QuestionReportsPage";
import QuestionReviewAdminPage from "../components/QuestionReview/QuestionReviewAdminPage";
import QaAdminPortal from "../components/QuestionReview/admin/QaAdminPortal";
import SettingsPage from "../components/Launch/SettingsPage";
import ProfilePage from "../components/Launch/ProfilePage";
import { StudentAssignmentsPage } from "../components/institution/StudentAssignmentsPage";
import { StudentMessagesPage } from "../components/institution/StudentMessagesPage";

// Import placeholder components
import UnderConstruction from "../../shared/components/placeholders/under-construction";

export const appContentRegistry: ContentRegistry = {
  content: {
    "/": () => <StudentDashboardPage />,
    "/dashboard": () => <StudentDashboardPage />,

    // Billing routes
    "/billing": () => <BillingPage />,
    "/pricing": () => <PricingPage />,

    // Chat routes
    "/chat/rooms": () => (
      <div className="h-full">
        <ChatRoomsList />
      </div>
    ),
    "/chat/notifications": () => (
      <div className="h-full">
        <NotificationsList />
      </div>
    ),
    "/chat/support": () => (
      <div className="h-full">
        <SupportChatRoomsList />
      </div>
    ),

    // Admin sub-routes
    "/admin/users": () => <UserManagementContent />,
    "/admin/activity-logs": () => <ActivityLogsManagementContent />,
    "/admin/roles": () => <RoleManagementContent />,
    "/admin/settings": () => <SystemSettingsContent />,

    // Billing admin routes
    "/admin/billing/plans": () => <BillingPlanManagement />,
    "/admin/billing/promotions": () => <PromotionManagement />,
    "/admin/content/question-review": () => <QuestionReviewAdminPage />,
    "/admin/content/question-review/inbox": () => <QaAdminPortal view="inbox" />,
    "/admin/content/question-review/reviewers": () => <QaAdminPortal view="inbox" />,
    "/admin/content/question-review/links": () => <QaAdminPortal view="links" />,
    "/admin/content/question-review/question": () => (
      <QaAdminPortal view="question" />
    ),

    // Institution (faculty ↔ student)
    "/assignments": () => (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <StudentAssignmentsPage />
      </div>
    ),
    "/messages": () => (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <StudentMessagesPage />
      </div>
    ),

    // Product routes
    "/admin/categories": () => <CategoryManagementContent />,
    "/admin/products": () => <ProductManagementContent />,
    "/admin/systems": () => <SystemManagementContent />,
    "/admin/products/subtypes": () => <ProductSubtypeManagementContent />,

    // Content routes (Learning/Content Management)
    "/admin/content/topics": () => <TopicManagementContent />,
    "/admin/content/subtopics": () => <SubtopicManagementContent />,
    "/admin/content/questions": () => <QuestionManagementContent />,
    "/admin/content/question-choices": () => (
      <QuestionChoiceManagementContent />
    ),

    // Assessment routes
    "/admin/assessments/question-papers": () => (
      <QuestionPaperManagementContent />
    ),
    "/admin/assessments/question-paper-questions": () => (
      <QuestionPaperQuestionManagementContent />
    ),

    // Study routes
    "/study": () => <StudyIndexPage />,
    "/study-planner": () => <StudyPlannerPage />,

    // MedPrepAI learning modes
    "/medprep-ai": () => <MedPrepOverviewPage />,
    "/medprep-ai/let-me-drive": () => <LetMeDriveModePage />,
    "/medprep-ai/practice-mode": () => <LetMeDriveModePage />,
    "/medprep-ai/practice-cases": () => <PracticeCasesPage />,
    "/medprep-ai/practice-nurse-report": () => <PracticeNurseReportPage />,
    "/medprep-ai/qa": () => <QaModePage />,
    "/medprep-ai/learning-mode": () => <LearningModePage />,
    "/medprep-ai/learn-cases": () => <LearnCasesPage />,
    "/medprep-ai/learning-nurse-report": () => <LearningNurseReportPage />,
    "/medprep-ai/evaluation-mode": () => <EvaluationModePage />,
    "/medprep-ai/evaluation-cases": () => <EvaluationCasesPage />,
    "/medprep-ai/evaluation-nurse-report": () => <EvaluationNurseReportPage />,
    "/medprep-ai/evaluation": () => (
      <MedPrepSlugGate slug="ai-evaluation" modeLabel="AI Evaluation Mode">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <EvaluationPage initialCopilotMode={false} embedInAppShell skipExternalRedirects />
        </div>
      </MedPrepSlugGate>
    ),
    "/medprep-ai/case": () => (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PracticeCaseRoutePage />
      </div>
    ),
    "/medprep-ai/learn": () => (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <LearningCaseRoutePage />
      </div>
    ),
    "/medprep-ai/ai-evaluation": () => <EvaluationModePage />,
    "/medprep-ai/shadow-mode": () => <ShadowModePage />,
    "/medprep-ai/shadow-cases": () => <ShadowCasesPage />,
    "/medprep-ai/shadow-play": () => <ShadowModePlayPage />,

    "/test-creation": () => <StudyCreateTestPage />,
    "/test-creation/new": () => <StudyCreateTestPage />,
    "/performance": () => <PerformanceDashboardPage />,
    "/test-creation/study-create": () => <StudyCreateTestPage />,
    "/previous-tests": () => <PreviousTestsPage />,

    // Question generator routes
    "/question-generator": () => <QuestionGeneratorPage />,
    "/question-generator/student": () => <QuestionGeneratorStudent />,
    "/question-generator/admin": () => <QuestionGeneratorAdmin />,

    // Development routes
    "/development/menu-manager": () => (
      <UnderConstruction
        menuTitle="Menu Manager"
        menuIcon="📋"
        description="Development tool for managing application menus and navigation."
        estimatedCompletion="TBD"
        features={[
          "Menu configuration",
          "Navigation management",
          "Route organization",
        ]}
      />
    ),
    "/development/ref-design": () => (
      <UnderConstruction
        menuTitle="Reference Design"
        menuIcon="🎨"
        description="Reference design system and component library."
        estimatedCompletion="TBD"
        features={[
          "Design system components",
          "UI patterns",
          "Style guidelines",
        ]}
      />
    ),
    "/development/adv-db-view": () => (
      <UnderConstruction
        menuTitle="Advanced Database View"
        menuIcon="🗄️"
        description="Advanced database viewer and management tool."
        estimatedCompletion="TBD"
        features={[
          "Database visualization",
          "Query builder",
          "Data management",
        ]}
      />
    ),
    "/development/org-chart": () => <OrgChartView />,

    // Test session routes
    "/test-session/:id": () => <TestSessionPage />,

    // Launch / new modules
    "/notifications": () => <NotificationsPage />,
    "/achievements": () => <AchievementsPage />,
    "/discussions": () => <DiscussionsPage />,
    "/ai-tutor": () => (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AiTutorPage />
      </div>
    ),
    "/mock-exams": () => <MockExamsPage />,
    "/study-groups": () => <StudyGroupsPage />,
    "/feedback": () => <FeedbackPage />,
    "/my-reports": () => <QuestionReportsPage />,
    "/profile": () => <ProfilePage />,
    "/settings": () => <SettingsPage />,
  },

  dashboards: {
    // Keep admin dashboard config
    "/admin": adminDashboardConfig,
  },

  defaultContent: () => (
    <div className="bg-white rounded-lg shadow border p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Content Not Configured
      </h2>
      <p className="text-gray-600">
        This section has not been configured yet. Please add content for this
        path in your content registry.
      </p>
    </div>
  ),
};

/** Legacy alias for existing dynamic imports. Prefer `appContentRegistry`. */
export const transportationContentRegistry = appContentRegistry;
