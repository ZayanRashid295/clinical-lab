"use client"

import AdminDashboard from "./admin-dashboard"

export default function QuestionGeneratorAdmin() {


  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background dark:bg-gray-900">
      {/* h-full (not h-screen) so this pane stays within the main layout below the header */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AdminDashboard />
      </div>
    </div>
  )
}





