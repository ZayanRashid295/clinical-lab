"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Label } from "@/shared/ui/label"
import { SectionsService } from "@/app/services/content/sections.service"
import { ChaptersService } from "@/app/services/content/chapters.service"
import { TopicsService } from "@/app/services/content/topics.service"

interface MetadataModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metadata: {
    sectionId?: string
    chapterId?: string
    topicId?: string
    subject?: string
    system?: string
    tags?: string[]
  }) => void
  initialMetadata?: {
    sectionId?: string
    chapterId?: string
    topicId?: string
    subject?: string
    system?: string
    tags?: string[]
  }
}

export default function MetadataModal({ isOpen, onClose, onSave, initialMetadata }: MetadataModalProps) {
  const [sectionId, setSectionId] = useState(initialMetadata?.sectionId || "")
  const [chapterId, setChapterId] = useState(initialMetadata?.chapterId || "")
  const [topicId, setTopicId] = useState(initialMetadata?.topicId || "")
  const [subject, setSubject] = useState(initialMetadata?.subject || "")
  const [system, setSystem] = useState(initialMetadata?.system || "")
  const [tags, setTags] = useState(initialMetadata?.tags?.join(", ") || "")

  const sectionsService = useMemo(() => new SectionsService(), [])
  const chaptersService = useMemo(() => new ChaptersService(), [])
  const topicsService = useMemo(() => new TopicsService(), [])

  const [sections, setSections] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loadingSections, setLoadingSections] = useState(false)
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  // Reset form when modal opens/closes or initialMetadata changes
  useEffect(() => {
    if (isOpen) {
      setSectionId(initialMetadata?.sectionId || "")
      setChapterId(initialMetadata?.chapterId || "")
      setTopicId(initialMetadata?.topicId || "")
      setSubject(initialMetadata?.subject || "")
      setSystem(initialMetadata?.system || "")
      setTags(initialMetadata?.tags?.join(", ") || "")
    }
  }, [isOpen, initialMetadata])

  useEffect(() => {
    if (isOpen) {
      setLoadingSections(true)
      sectionsService
        .getSections({ status: "ACTIVE" })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setSections(data)
        })
        .catch(() => setSections([]))
        .finally(() => setLoadingSections(false))
    }
  }, [isOpen, sectionsService])

  useEffect(() => {
    if (isOpen && sectionId) {
      setLoadingChapters(true)
      chaptersService
        .getChapters({ sectionId, status: "ACTIVE" })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setChapters(data)
        })
        .catch(() => setChapters([]))
        .finally(() => setLoadingChapters(false))
    } else {
      setChapters([])
      setChapterId("")
    }
  }, [isOpen, sectionId, chaptersService])

  useEffect(() => {
    if (isOpen && chapterId) {
      setLoadingTopics(true)
      topicsService
        .getTopics({ chapterId, status: "ACTIVE" })
        .then((response) => {
          const data = Array.isArray(response) ? response : (response as any)?.data || []
          setTopics(data)
        })
        .catch(() => setTopics([]))
        .finally(() => setLoadingTopics(false))
    } else {
      setTopics([])
      setTopicId("")
    }
  }, [isOpen, chapterId, topicsService])

  const handleSave = () => {
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t)

    onSave({
      sectionId: sectionId || undefined,
      chapterId: chapterId || undefined,
      topicId: topicId || undefined,
      subject: subject || undefined,
      system: system || undefined,
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
            <Label className="text-sm font-semibold">System (Section) *</Label>
            <select
              value={sectionId}
              onChange={(e) => {
                setSectionId(e.target.value)
                setChapterId("")
                setTopicId("")
              }}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loadingSections}
            >
              <option value="">Select System...</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Subject (Chapter) *</Label>
            <select
              value={chapterId}
              onChange={(e) => {
                setChapterId(e.target.value)
                setTopicId("")
              }}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loadingChapters || !sectionId}
            >
              <option value="">Select Subject...</option>
              {chapters.map((chapter) => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Topic *</Label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              disabled={loadingTopics || !chapterId}
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





