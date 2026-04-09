"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/shared/ui/card"
import { QuestionMetadata } from "./types"
import { SystemsService } from "@/app/services/systems/systems.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { SubtopicsService } from "@/app/services/content/subtopics.service"

interface MetadataSectionProps {
  value: QuestionMetadata
  onChange: (metadata: QuestionMetadata) => void
}

export default function MetadataSection({ value, onChange }: MetadataSectionProps) {
  const [systemId, setSystemId] = useState(value.systemId || "")
  const [topicId, setTopicId] = useState(value.topicId || "")
  const [subtopicId, setSubtopicId] = useState(value.subtopicId || "")
  const [subject, setSubject] = useState(value.subject || "")
  const [tags, setTags] = useState(value.tags?.join(", ") || "")

  const systemsService = useMemo(() => new SystemsService(), [])
  const topicsService = useMemo(() => new TopicsService(), [])
  const subtopicsService = useMemo(() => new SubtopicsService(), [])

  const [systems, setSystems] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [subtopics, setSubtopics] = useState<any[]>([])
  const [loadingSystems, setLoadingSystems] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)
  const [loadingSubtopics, setLoadingSubtopics] = useState(false)

  useEffect(() => {
    setLoadingSystems(true)
    systemsService
      .getSystems({ status: "ACTIVE", listAll: true })
      .then((response) => {
        const data = Array.isArray(response) ? response : (response as any)?.data || []
        setSystems(data)
      })
      .catch(() => setSystems([]))
      .finally(() => setLoadingSystems(false))
  }, [systemsService])

  useEffect(() => {
    if (systemId) {
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
  }, [systemId, topicsService])

  useEffect(() => {
    if (topicId) {
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
  }, [topicId, subtopicsService])

  useEffect(() => {
    const parsedTags = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t)

    onChange({
      systemId: systemId || undefined,
      topicId: topicId || undefined,
      subtopicId: subtopicId || undefined,
      subject: subject || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    })
  }, [systemId, topicId, subtopicId, subject, tags, onChange])

  return (
    <Card className="p-4 shadow-md border border-border/40 bg-card/60 backdrop-blur-sm rounded-xl">
      <h3 className="text-sm font-bold text-primary/70 mb-4 uppercase tracking-widest">
        Question Metadata
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            System *
          </label>
          <select
            value={systemId}
            onChange={(e) => {
              setSystemId(e.target.value)
              setTopicId("")
              setSubtopicId("")
            }}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={loadingSystems}
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
          <label className="block text-xs font-semibold text-foreground mb-1">Topic *</label>
          <select
            value={topicId}
            onChange={(e) => {
              setTopicId(e.target.value)
              setSubtopicId("")
            }}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          <label className="block text-xs font-semibold text-foreground mb-1">Subtopic *</label>
          <select
            value={subtopicId}
            onChange={(e) => setSubtopicId(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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



