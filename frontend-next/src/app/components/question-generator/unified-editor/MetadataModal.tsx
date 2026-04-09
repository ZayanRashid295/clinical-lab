"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { SystemsService } from "@/app/services/systems/systems.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { SubtopicsService } from "@/app/services/content/subtopics.service"

interface MetadataModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metadata: {
    systemId?: string
    topicId?: string
    subtopicId?: string
    subject?: string
    tags?: string[]
  }) => void
  initialMetadata?: {
    systemId?: string
    topicId?: string
    subtopicId?: string
    subject?: string
    tags?: string[]
  }
}

export default function MetadataModal({ isOpen, onClose, onSave, initialMetadata }: MetadataModalProps) {
  const [systemId, setSystemId] = useState(initialMetadata?.systemId || "")
  const [topicId, setTopicId] = useState(initialMetadata?.topicId || "")
  const [subtopicId, setSubtopicId] = useState(initialMetadata?.subtopicId || "")
  const [subject, setSubject] = useState(initialMetadata?.subject || "")
  const [tags, setTags] = useState(initialMetadata?.tags?.join(", ") || "")

  const systemsService = useMemo(() => new SystemsService(), [])
  const topicsService = useMemo(() => new TopicsService(), [])
  const subtopicsService = useMemo(() => new SubtopicsService(), [])

  const [systems, setSystems] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [subtopics, setSubtopics] = useState<any[]>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingSubtopics, setLoadingSubtopics] = useState(false)

  // Reset form when modal opens/closes or initialMetadata changes
  useEffect(() => {
    if (isOpen) {
      setSystemId(initialMetadata?.systemId || "")
      setTopicId(initialMetadata?.topicId || "")
      setSubtopicId(initialMetadata?.subtopicId || "")
      setSubject(initialMetadata?.subject || "")
      setTags(initialMetadata?.tags?.join(", ") || "")
    }
  }, [isOpen, initialMetadata])

  // Load all chapters when modal opens (section derived from chapter at backend)
  useEffect(() => {
    if (isOpen) {
      setLoadingChapters(true)
      systemsService
        .getSystems({ status: "ACTIVE", listAll: true })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setSystems(data)
        })
        .catch(() => setSystems([]))
        .finally(() => setLoadingChapters(false))
    }
  }, [isOpen, systemsService])

  useEffect(() => {
    if (isOpen && systemId) {
      setLoadingTopics(true)
      topicsService
        .getTopics({ systemId, status: "ACTIVE", listAll: true })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setTopics(data)
        })
        .catch(() => setTopics([]))
        .finally(() => setLoadingTopics(false))
    } else {
      setTopics([])
      setTopicId("")
      setSubtopics([])
      setSubtopicId("")
    }
  }, [isOpen, systemId, topicsService])

  useEffect(() => {
    if (isOpen && topicId) {
      setLoadingSubtopics(true)
      subtopicsService
        .getSubtopics({ topicId, status: "ACTIVE", listAll: true })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setSubtopics(data)
        })
        .catch(() => setSubtopics([]))
        .finally(() => setLoadingSubtopics(false))
    } else {
      setSubtopics([])
      setSubtopicId("")
    }
  }, [isOpen, topicId, subtopicsService])

  const handleSave = () => {
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t)

    onSave({
      systemId: systemId || undefined,
      topicId: topicId || undefined,
      subtopicId: subtopicId || undefined,
      subject: subject || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Question Metadata</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label className="text-sm font-semibold">System *</Label>
            <select
              value={systemId}
              onChange={(e) => {
                setSystemId(e.target.value)
                setTopicId("")
                setSubtopicId("")
              }}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loadingChapters}
            >
              <option value="">Select System...</option>
              {systems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Topic *</Label>
            <select
              value={topicId}
              onChange={(e) => {
                setTopicId(e.target.value)
                setSubtopicId("")
              }}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loadingTopics || !systemId}
            >
              <option value="">Select Topic...</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Subtopic *</Label>
            <select
              value={subtopicId}
              onChange={(e) => setSubtopicId(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loadingSubtopics || !topicId}
            >
              <option value="">Select Subtopic...</option>
              {subtopics.map((subtopic) => (
                <option key={subtopic.id} value={subtopic.id}>
                  {subtopic.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Tags</Label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., CAH, Enzyme deficiency"
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}





