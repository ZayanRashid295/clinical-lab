// components/avatar-config.tsx

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save, Eye, EyeOff, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AvatarConfigProps {
  onConfigSave: (config: {
    apiKey: string
    patientAvatarId: string
    doctorAvatarId: string
  }) => void
  currentConfig: {
    apiKey: string
    patientAvatarId: string
    doctorAvatarId: string
  }
}

export function AvatarConfig({ onConfigSave, currentConfig }: AvatarConfigProps) {
  const [config, setConfig] = useState(currentConfig)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSave = () => {
    onConfigSave(config)
    setIsOpen(false)
    setTestResult(null)
  }

  const testConnection = async () => {
    if (!config.apiKey) {
      setTestResult({ success: false, message: "Please enter an API key first" })
      return
    }

    setIsTestingConnection(true)
    setTestResult(null)

    try {
      const { heygenClientService } = await import("@/lib/heygen-client-service")

      heygenClientService.initialize({
        apiKey: config.apiKey,
        patientAvatarId: config.patientAvatarId,
        doctorAvatarId: config.doctorAvatarId,
      })

      const result = await heygenClientService.testConnection()

      if (result.success) {
        setTestResult({ success: true, message: "Connection successful! API key is valid." })
      } else {
        setTestResult({ success: false, message: result.error || "Connection failed" })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const isConfigValid = config.apiKey && config.patientAvatarId && config.doctorAvatarId

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure Avatars
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>HeyGen Avatar Configuration</DialogTitle>
          <DialogDescription>
            Configure your HeyGen API settings to enable AI avatars for patient and doctor interactions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">HeyGen API Key</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={config.apiKey}
                onChange={(e) => {
                  setConfig({ ...config, apiKey: e.target.value })
                  setTestResult(null) // Clear test result when API key changes
                }}
                placeholder="Enter your HeyGen API key"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testConnection}
                disabled={!config.apiKey || isTestingConnection}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Testing...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>
              {testResult && (
                <Badge variant={testResult.success ? "default" : "destructive"} className="text-xs">
                  {testResult.success ? "✓ Valid" : "✗ Invalid"}
                </Badge>
              )}
            </div>
            {testResult && (
              <p className={`text-xs ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                {testResult.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="patientAvatar">Patient Avatar ID</Label>
            <Input
              id="patientAvatar"
              value={config.patientAvatarId}
              onChange={(e) => setConfig({ ...config, patientAvatarId: e.target.value })}
              placeholder="Enter patient avatar ID from HeyGen"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctorAvatar">Doctor Avatar ID</Label>
            <Input
              id="doctorAvatar"
              value={config.doctorAvatarId}
              onChange={(e) => setConfig({ ...config, doctorAvatarId: e.target.value })}
              placeholder="Enter doctor avatar ID from HeyGen"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
            <p className="font-medium mb-1">How to get HeyGen credentials:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>
                Sign up at{" "}
                <a href="https://heygen.com" target="_blank" rel="noopener noreferrer" className="underline">
                  heygen.com
                </a>
              </li>
              <li>Go to API settings to get your API key</li>
              <li>Create or select avatars and copy their IDs</li>
              <li>Use the "Test Connection" button to verify your API key</li>
              <li>Paste the credentials above</li>
            </ol>
          </div>

          {testResult && !testResult.success && (
            <div className="bg-red-50 p-3 rounded-lg text-sm text-red-800">
              <p className="font-medium mb-1">Common Issues:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Invalid API key format or expired key</li>
                <li>Avatar IDs don't exist in your HeyGen account</li>
                <li>Insufficient API credits or quota exceeded</li>
                <li>Network connectivity issues</li>
              </ul>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!isConfigValid}>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
