import { ContentRegistry } from "../types/dashboard";

// Helper function to create a content registry
// export const createContentRegistry = (
//   config: Partial<ContentRegistry> = {}
// ): ContentRegistry => {
//   return {
//     content: config.content || {},
//     dashboards: config.dashboards || {},
//     defaultContent: config.defaultContent,
//   };
// };

// Import ride-sharing specific components
import PaymentHistoryContent from "../components/Content/PaymentHistoryContent";
import PaymentMethodsContent from "../components/Content/PaymentMethodsContent";
import PayoutsContent from "../components/Content/PayoutsContent";
import InvoicesContent from "../components/Content/InvoicesContent";
import ChatRoomsList from "../components/Chat/ChatRoomsList";
import SupportChatRoomsList from "../components/Chat/SupportChatRoomsList";
import NotificationsList from "../components/Notifications/NotificationsList";
import UserManagementContent from "../components/Content/UserManagementContent";
import RoleManagementContent from "../components/Content/RoleManagementContent";
import SystemSettingsContent from "../components/Content/SystemSettingsContent";
import SubscriptionManagementContent from "../components/Content/SubscriptionManagementContent";
import SubscriptionPackageManagementContent from "../components/Content/SubscriptionPackageManagementContent";
import PackageFeatureManagementContent from "../components/Content/PackageFeatureManagementContent";
import ProductManagementContent from "../components/Content/ProductManagementContent";
import ProductTagManagementContent from "../components/Content/ProductTagManagementContent";
import ProductSubtypeManagementContent from "../components/Content/ProductSubtypeManagementContent";
import SectionManagementContent from "../components/Content/SectionManagementContent";
import ChapterManagementContent from "../components/Content/ChapterManagementContent";
import TopicManagementContent from "../components/Content/TopicManagementContent";
import QuestionPaperManagementContent from "../components/Content/QuestionPaperManagementContent";
import QuestionPaperQuestionManagementContent from "../components/Content/QuestionPaperQuestionManagementContent";
import QuestionManagementContent from "../components/Content/QuestionManagementContent";
import QuestionChoiceManagementContent from "../components/Content/QuestionChoiceManagementContent";
// import TwoTablesWithPagination from "../components/Content/TwoTablesWithPagination";
import { mainDashboardConfig, adminDashboardConfig } from "./dashboard.configs";

// Import study components
import QuestionBankPage from "../components/Study/QuestionBankPage";
import StudyMaterialsPage from "../components/Study/StudyMaterialsPage";
import FlashcardsPage from "../components/Study/FlashcardsPage";
import NotesPage from "../components/Study/NotesPage";

// Import test creation components
import TestCreationPage from "../components/test-creation/TestCreationPage";
import StudyCreateTestPage from "../components/test-creation/StudyCreateTestPage";
import PreviousTestsPage from "../components/test-creation/PreviousTestsPage";
import EnhancedQuestionBuilder from "../components/test-creation/EnhancedQuestionBuilder";
import NewQuestionBuilder from "../components/test-creation/NewQuestionBuilder";

// Import dashboard - using TestCreationPage as the main dashboard

// Import test session components
import TestSessionPage from "../components/test-session/TestSessionPage";

// Import zoom simulation components
// import ZoomSimulation from "../components/zoom-simulation/zoom-simulation"; // Component not found

// Import robotic components
// import RobotFace from "../components/robotic/RobotFace"; // Component not found

// Import question generator components
import QuestionGeneratorPage from "../components/question-generator/QuestionGeneratorPage";
import QuestionGeneratorStudent from "../components/question-generator/QuestionGeneratorStudent";
import QuestionGeneratorAdmin from "../components/question-generator/QuestionGeneratorAdmin";

// Import development components
// import MenuManager from "../components/Development/MenuManager"; // Component not found - exists as page
// import RefDesign from "../components/Development/ref-design"; // Component not found - exists as page
// import AdvDbView from "../components/Development/AdvDbView"; // Component not found
import OrgChartView from "../components/OrgChart/OrgChartView";

// Import placeholder components
import UnderConstruction from "../../shared/components/placeholders/under-construction";

// Transportation content registry
export const transportationContentRegistry: ContentRegistry = {
  content: {
    // Dashboard routes - use TestCreationPage as the main dashboard
    "/": () => <TestCreationPage />,
    "/dashboard": () => <TestCreationPage />,

    // Payment routes
    "/payments/history": () => <PaymentHistoryContent />,
    "/payments/methods": () => <PaymentMethodsContent />,
    "/payments/payouts": () => <PayoutsContent />,
    "/payments/invoices": () => <InvoicesContent />,

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
    "/admin/roles": () => <RoleManagementContent />,
    "/admin/settings": () => <SystemSettingsContent />,
    // "/admin/tables": () => <TwoTablesWithPagination />,

    // Subscription routes
    "/admin/subscriptions": () => <SubscriptionManagementContent />,
    "/admin/subscriptions/packages": () => (
      <SubscriptionPackageManagementContent />
    ),
    "/admin/subscriptions/features": () => <PackageFeatureManagementContent />,

    // Product routes
    "/admin/products": () => <ProductManagementContent />,
    "/admin/products/tags": () => <ProductTagManagementContent />,
    "/admin/products/subtypes": () => <ProductSubtypeManagementContent />,

    // Content routes (Learning/Content Management)
    "/admin/content/sections": () => <SectionManagementContent />,
    "/admin/content/chapters": () => <ChapterManagementContent />,
    "/admin/content/topics": () => <TopicManagementContent />,
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
    "/study/question-bank": () => <QuestionBankPage />,
    "/study/materials": () => <StudyMaterialsPage />,
    "/study/flashcards": () => <FlashcardsPage />,
    "/study/notes": () => <NotesPage />,

    // Test creation routes
    "/test-creation": () => <TestCreationPage />,
    "/test-creation/new": () => <TestCreationPage />,
    "/test-creation/study-create": () => <StudyCreateTestPage />,
    "/previous-tests": () => <PreviousTestsPage />,
    "/test-creation/templates": () => (
      <UnderConstruction
        menuTitle="Test Templates"
        menuIcon="📋"
        description="Pre-built test templates for quick test creation with customizable questions and formats."
        estimatedCompletion="2 weeks"
        features={[
          "Template library with medical specialties",
          "Customizable question sets",
          "Difficulty level adjustments",
          "Subject-specific templates",
          "One-click test generation",
        ]}
      />
    ),
    "/test-creation/builder": () => (
      <div className="p-6">
        <EnhancedQuestionBuilder
          onQuestionCreated={(question) => {
            console.log("Question created:", question);
            // TODO: Implement API call to save question
          }}
        />
      </div>
    ),
    "/test-creation/new-builder": () => <NewQuestionBuilder />,
    "/test-creation/settings": () => (
      <UnderConstruction
        menuTitle="Test Settings"
        menuIcon="⚙️"
        description="Comprehensive test configuration and settings management for optimal test experience."
        estimatedCompletion="2 weeks"
        features={[
          "Time limits and scheduling",
          "Scoring and grading options",
          "Access control and permissions",
          "Test analytics and reporting",
          "Mobile-responsive design",
          "Progress tracking",
        ]}
      />
    ),

    // Zoom simulation routes
    "/zoom": () => (
      <UnderConstruction
        menuTitle="Zoom Simulation"
        menuIcon="📹"
        description="Interactive zoom simulation feature for enhanced learning experience."
        estimatedCompletion="TBD"
        features={[
          "Zoom interface simulation",
          "Interactive controls",
          "Real-time collaboration features",
        ]}
      />
    ),

    // Robotic routes
    "/robotic": () => (
      <UnderConstruction
        menuTitle="Robot Face"
        menuIcon="🤖"
        description="Interactive robotic face interface for enhanced user interaction."
        estimatedCompletion="TBD"
        features={[
          "Animated robot face",
          "Interactive expressions",
          "Voice and gesture recognition",
        ]}
      />
    ),

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
