import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MenuSystem, authService } from "../src/shared";
import AdminLayout from "../src/app/components/Admin/AdminLayout";
import { ADMIN_SECTIONS } from "../src/data/adminData";
import {
  Users,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit,
  MoreVertical,
} from "lucide-react";

// Reusable card components
const UserCard = ({ user }: { user: any }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-sm opacity-90">{user.email}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.status === "ACTIVE"
              ? "bg-green-100 text-green-800"
              : user.status === "INACTIVE"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {user.status}
        </span>
      </div>
    </div>
    <div className="p-6">
      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="h-4 w-4 mr-2" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <Phone className="h-4 w-4 mr-2" />
          <span>{user.phone}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{user.location}</span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            user.role === "ADMIN"
              ? "bg-purple-100 text-purple-800"
              : user.role === "FLEET_MANAGER"
              ? "bg-blue-100 text-blue-800"
              : user.role === "DRIVER"
              ? "bg-green-100 text-green-800"
              : "bg-orange-100 text-orange-800"
          }`}
        >
          {user.role.replace("_", " ")}
        </span>
      </div>
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <Calendar className="h-4 w-4 mr-2" />
        <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <Eye className="h-4 w-4 mr-1" />
          View
        </button>
        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </button>
        <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);

const RoleCard = ({ role }: { role: any }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
    <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-semibold">{role.displayName}</h3>
            <p className="text-sm opacity-90">{role.name}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            role.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {role.isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>
    </div>
    <div className="p-6">
      <p className="text-sm text-gray-600 mb-4">{role.description}</p>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2" />
          <span>Users: {role.userCount}</span>
        </div>
      </div>
      <div className="flex items-center text-sm text-gray-600 mb-4">
        <Calendar className="h-4 w-4 mr-2" />
        <span>Created: {new Date(role.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-2">
        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
          <Eye className="h-4 w-4 mr-1" />
          View
        </button>
        <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100 transition-colors">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </button>
      </div>
    </div>
  </div>
);

export default function AdminSimplePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const customContent = {
    admin: () => (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Administration Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Manage system administration and configuration
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.values(ADMIN_SECTIONS).map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    users: () => (
      <AdminLayout
        section={ADMIN_SECTIONS.users}
        renderItem={(user) => <UserCard user={user} />}
      />
    ),
    roles: () => (
      <AdminLayout
        section={ADMIN_SECTIONS.roles}
        renderItem={(role) => <RoleCard role={role} />}
      />
    ),
    reports: () => (
      <AdminLayout
        section={ADMIN_SECTIONS.reports}
        renderItem={(report) => (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {report.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  report.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {report.status}
              </span>
              <span className="text-sm text-gray-500">{report.format}</span>
            </div>
          </div>
        )}
      />
    ),
    audit: () => (
      <AdminLayout
        section={ADMIN_SECTIONS.audit}
        renderItem={(log) => (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {log.userName}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  log.status === "SUCCESS"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {log.status}
              </span>
            </div>
            <p className="text-sm text-gray-600">{log.details}</p>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>{log.resource}</span>
              <span>{new Date(log.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      />
    ),
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/login");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Administration - Medical Lab</title>
        <meta
          name="description"
          content="System administration and management"
        />
      </Head>
      <MenuSystem
        applicationTitle="Medical Lab"
        customContent={customContent}
      />
    </>
  );
}
