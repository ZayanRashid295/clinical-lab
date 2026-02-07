"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/shared/ui/card"
import { QuestionMetadata } from "./types"
import { ChaptersService } from "@/app/services/content/chapters.service"
import { TopicsService } from "@/app/services/content/topics.service"

interface MetadataSectionProps {
  value: QuestionMetadata
  onChange: (metadata: QuestionMetadata) => void
}

export default function MetadataSection({ value, onChange }: MetadataSectionProps) {
  const [chapterId, setChapterId] = useState(value.chapterId || "")
  const [topicId, setTopicId] = useState(value.topicId || "")
  const [subject, setSubject] = useState(value.subject || "")
  const [tags, setTags] = useState(value.tags?.join(", ") || "")

  const chaptersService = useMemo(() => new ChaptersService(), [])
  const topicsService = useMemo(() => new TopicsService(), [])

  const [chapters, setChapters] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  // Load all chapters on mount (section is derived from chapter at backend)
  useEffect(() => {
    setLoadingChapters(true)
    chaptersService
      .getChapters({ status: "ACTIVE", listAll: true })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setChapters(data)
      })
      .catch(() => setChapters([]))
      .finally(() => setLoadingChapters(false))
  }, [chaptersService])

  useEffect(() => {
    if (chapterId) {
      setLoadingTopics(true)
      topicsService
        .getTopics({ chapterId, status: "ACTIVE", listAll: true })
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
  }, [chapterId, topicsService])

  useEffect(() => {
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t)

    onChange({
      chapterId: chapterId || undefined,
      topicId: topicId || undefined,
      subject: subject || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    })
  }, [chapterId, topicId, subject, tags, onChange])

  return (
    <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
      <h3 className="text-sm font-bold text-primary/70 mb-4 uppercase tracking-widest">
        Question Metadata
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Chapter *
          </label>
          <select
            value={chapterId}
            onChange={(e) => {
              setChapterId(e.target.value)
              setTopicId("")
            }}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={loadingChapters}
          >
            <option value="">Select Chapter...</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Topic *</label>
          <select
            value={topicId}
            onChange={(e) => setTopicId(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
      </div>

      <div>
        <label className="block text-xs font-semibold text-foreground mb-1">Tags</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g., CAH, Enzyme deficiency"
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </Card>
  )
}



