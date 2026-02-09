"use client"

import AdminDashboard from "./admin-dashboard"

export default function QuestionGeneratorAdmin() {


  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800/20">
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
      <AdminDashboard />
      </div>
    </div>
  )
}





