import { useState } from "react";
import UserFormModal from "../src/app/components/Users/UserFormModal";
import { User } from "../src/app/types/user";

export default function TestUserEdit() {
  const [isOpen, setIsOpen] = useState(false);
  const [testUser, setTestUser] = useState<User>({
    id: "test-1",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    phone: "+1 (555) 123-4567",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  });

  const handleUserUpdated = (updatedUser: User) => {
    console.log("User updated:", updatedUser);
    setTestUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test User Edit Modal
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User Data</h2>
          <div className="space-y-2">
            <p>
              <strong>Name:</strong> {testUser.firstName} {testUser.lastName}
            </p>
            <p>
              <strong>Email:</strong> {testUser.email}
            </p>
            <p>
              <strong>Phone:</strong> {testUser.phone}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {testUser.isActive ? "Active" : "Inactive"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open Edit Modal
        </button>

        <UserFormModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          user={testUser}
          onUserSaved={handleUserUpdated}
          mode="edit"
        />
      </div>
    </div>
  );
}
