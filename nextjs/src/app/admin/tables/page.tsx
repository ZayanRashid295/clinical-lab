"use client";

import React from "react";
import DashboardLayout from "@/shared/components/layout/dashboard-layout";
import TwoTablesWithPagination from "../tables";

export default function AdminTablesPage() {
  return (
    <DashboardLayout activeMenuId="admin">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Data Tables</h1>
          <p className="text-gray-600 mt-2">
            View and manage system data with paginated tables
          </p>
        </div>
        <TwoTablesWithPagination />
      </div>
    </DashboardLayout>
  );
}
