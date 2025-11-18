"use client"

import { useState, useEffect } from "react"
import { BlockData } from "../types"
import { SectionsService } from "@/app/services/content/sections.service"
import { ChaptersService } from "@/app/services/content/chapters.service"
import { TopicsService } from "@/app/services/content/topics.service"
import { QuestionsService } from "@/app/services/questions/questions.service"

interface InternalLinkEditorProps {
  data: BlockData
  onChange: (data: BlockData) => void
}

export default function InternalLinkEditor({ data, onChange }: InternalLinkEditorProps) {
  const [linkText, setLinkText] = useState(data.linkText || "")
  const [targetType, setTargetType] = useState<'question' | 'topic' | 'chapter' | 'section'>(data.targetType || 'question')
  const [targetId, setTargetId] = useState(data.targetId || "")
  const [description, setDescription] = useState(data.description || "")
  
  const [sections, setSections] = useState<any[]>([])
  const [chapters, setChapters] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const sectionsService = new SectionsService()
  const chaptersService = new ChaptersService()
  const topicsService = new TopicsService()
  const questionsService = new QuestionsService()

  useEffect(() => {
    loadData()
  }, [targetType])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (targetType) {
        case 'section':
          const sectionsData = await sectionsService.getSections({ limit: 100, status: "ACTIVE" })
          setSections(Array.isArray(sectionsData) ? sectionsData : (sectionsData as any)?.data || [])
          break
        case 'chapter':
          const chaptersData = await chaptersService.getChapters({ limit: 100, status: "ACTIVE" })
          setChapters(Array.isArray(chaptersData) ? chaptersData : (chaptersData as any)?.data || [])
          break
        case 'topic':
          const topicsData = await topicsService.getTopics({ limit: 100, status: "ACTIVE" })
          setTopics(Array.isArray(topicsData) ? topicsData : (topicsData as any)?.data || [])
          break
        case 'question':
          const questionsData = await questionsService.getQuestions({ limit: 100, status: "ACTIVE" })
          setQuestions(Array.isArray(questionsData) ? questionsData : (questionsData as any)?.data || [])
          break
      }
    } catch (error) {
      console.error(`Failed to load ${targetType}s:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    const newData = { ...data, [field]: value }
    onChange(newData)
    
    if (field === 'linkText') setLinkText(value)
    if (field === 'targetType') {
      setTargetType(value)
      setTargetId("") // Reset target when type changes
    }
    if (field === 'targetId') setTargetId(value)
    if (field === 'description') setDescription(value)
  }

  const getOptions = () => {
    switch (targetType) {
      case 'section':
        return sections.map(s => ({ id: s.id, name: s.name }))
      case 'chapter':
        return chapters.map(c => ({ id: c.id, name: c.name }))
      case 'topic':
        return topics.map(t => ({ id: t.id, name: t.name }))
      case 'question':
        return questions.map(q => ({ id: q.id, name: q.question?.substring(0, 100) || `Question ${q.id}` }))
      default:
        return []
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Link Text</label>
        <input
          type="text"
          value={linkText}
          onChange={(e) => handleChange('linkText', e.target.value)}
          placeholder="Click here to view..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Link Type</label>
        <select
          value={targetType}
          onChange={(e) => handleChange('targetType', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
        >
          <option value="question">Question</option>
          <option value="topic">Topic</option>
          <option value="chapter">Chapter</option>
          <option value="section">Section</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Select {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
        </label>
        {loading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <select
            value={targetId}
            onChange={(e) => handleChange('targetId', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
          >
            <option value="">Select {targetType}...</option>
            {getOptions().map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Description (Optional)</label>
        <textarea
          value={description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of the link..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
        />
      </div>
    </div>
  )
}










