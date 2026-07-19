"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { SystemsService } from "@/app/services/systems/systems.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { SubtopicsService } from "@/app/services/content/subtopics.service"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SELECT_EMPTY_VALUE,
} from "@/shared/ui/select"

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
            <Select
              value={systemId || SELECT_EMPTY_VALUE}
              onValueChange={(v) => {
                const next = v === SELECT_EMPTY_VALUE ? "" : v
                setSystemId(next)
                setTopicId("")
                setSubtopicId("")
              }}
              disabled={loadingChapters}
            >
              <SelectTrigger className="mt-1 h-9 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs focus:ring-2 focus:ring-primary/50 focus:outline-none [&>span]:line-clamp-1">
                <SelectValue placeholder="Select System..." />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value={SELECT_EMPTY_VALUE} className="text-muted-foreground">
                  Select System...
                </SelectItem>
                {systems.map((system) => (
                  <SelectItem key={system.id} value={system.id}>
                    {system.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Topic *</Label>
            <Select
              value={topicId || SELECT_EMPTY_VALUE}
              onValueChange={(v) => {
                const next = v === SELECT_EMPTY_VALUE ? "" : v
                setTopicId(next)
                setSubtopicId("")
              }}
              disabled={loadingTopics || !systemId}
            >
              <SelectTrigger className="mt-1 h-9 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs focus:ring-2 focus:ring-primary/50 focus:outline-none [&>span]:line-clamp-1">
                <SelectValue placeholder="Select Topic..." />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value={SELECT_EMPTY_VALUE} className="text-muted-foreground">
                  Select Topic...
                </SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Subtopic *</Label>
            <Select
              value={subtopicId || SELECT_EMPTY_VALUE}
              onValueChange={(v) =>
                setSubtopicId(v === SELECT_EMPTY_VALUE ? "" : v)
              }
              disabled={loadingSubtopics || !topicId}
            >
              <SelectTrigger className="mt-1 h-9 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-xs focus:ring-2 focus:ring-primary/50 focus:outline-none [&>span]:line-clamp-1">
                <SelectValue placeholder="Select Subtopic..." />
              </SelectTrigger>
              <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value={SELECT_EMPTY_VALUE} className="text-muted-foreground">
                  Select Subtopic...
                </SelectItem>
                {subtopics.map((subtopic) => (
                  <SelectItem key={subtopic.id} value={subtopic.id}>
                    {subtopic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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


