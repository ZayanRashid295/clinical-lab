import { useState } from "react";
import UserViewModal from "../src/app/components/Users/UserViewModal";
import UserFormModal from "../src/app/components/Users/UserFormModal";
import { User } from "../src/app/types/user";

export default function TestUserModals() {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [testUser, setTestUser] = useState<User>({
    id: "test-1",
    email: "student@clinicallab.test",
    firstName: "Alex",
    lastName: "Student",
    phone: "+10000000004",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    userSettings: {
      id: "settings-1",
      userId: "test-1",
      language: "en",
      timezone: "America/New_York",
      notifications: true,
      emailNotifications: true,
      smsNotifications: false,
    },
    roles: [
      {
        id: "role-1",
        userId: "test-1",
        roleId: "student-role",
        role: {
          id: "student-role",
          name: "STUDENT",
          displayName: "Student",
          description: "Course access and practice",
          permissions: ["lms:content:read"],
          isActive: true,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      },
    ],
  });

  const handleUserSaved = (savedUser: User) => {
    console.log("User saved:", savedUser);
    setTestUser(savedUser);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test User Modals
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* View Modal Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">View User Modal</h2>
            <p className="text-gray-600 mb-4">
              Test the view modal to see user details in read-only mode.
            </p>
            <button
              onClick={() => setViewModalOpen(true)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open View Modal
            </button>
          </div>

          {/* Edit Modal Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Edit User Modal</h2>
            <p className="text-gray-600 mb-4">
              Test the edit modal to modify user information.
            </p>
            <button
              onClick={() => {
                setFormMode("edit");
                setFormModalOpen(true);
              }}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Open Edit Modal
            </button>
          </div>

          {/* Add Modal Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Add User Modal</h2>
            <p className="text-gray-600 mb-4">
              Test the add modal to create a new user.
            </p>
            <button
              onClick={() => {
                setFormMode("create");
                setFormModalOpen(true);
              }}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Open Add Modal
            </button>
          </div>
        </div>

        {/* Current User Data */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Current User Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p>
                <strong>Name:</strong> {testUser.firstName} {testUser.lastName}
              </p>
              <p>
                <strong>Email:</strong> {testUser.email}
              </p>
              <p>
                <strong>Phone:</strong> {testUser.phone}
              </p>
            </div>
            <div>
              <p>
                <strong>Status:</strong>{" "}
                {testUser.isActive ? "Active" : "Inactive"}
              </p>
              <p>
                <strong>Role:</strong>{" "}
                {testUser.roles?.[0]?.role?.name || "USER"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(testUser.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Modals */}
        <UserViewModal
          isOpen={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          user={testUser}
        />

        <UserFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          user={formMode === "edit" ? testUser : null}
          onUserSaved={handleUserSaved}
          mode={formMode}
        />
      </div>
    </div>
  );
}
