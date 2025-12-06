import TestCreationPage from "@/components/test-creation-page"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function Home() {
  return (
    <TooltipProvider>
      <TestCreationPage />
    </TooltipProvider>
  )
}
