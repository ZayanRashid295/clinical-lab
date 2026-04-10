"use client"

import AdminDashboard from "./admin-dashboard"

export default function QuestionGeneratorAdmin() {


  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/20">
      {/* h-full (not h-screen) so this pane stays within the main layout below the header */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <AdminDashboard />
      </div>
    </div>
  )
}





