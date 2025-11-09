"use client"

import { useState, useEffect } from "react"
import { Card } from "@/shared/ui/card"
import { Button } from "@/shared/ui/button"
import QuestionEditor from "./question-editor"
import QuestionList from "./question-list"
import MarkdownUploader from "./markdown-uploader"

interface Question {
  id: string
  stem: string
  options: Array<{ label: string; text: string; correct: boolean }>
  subject: string
  system: string
  explanation: any
  tags: string[]
  createdAt: number
}

const DEMO_QUESTION: Question = {
  id: "demo-question",
  stem: "A 13-year-old girl is brought to the clinic by her mother for a yearly physical examination. The patient feels well but is worried that she has not yet started puberty. Temperature is 36.7°C (98°F), blood pressure is 152/91 mm Hg, pulse is 75/min, and respirations are 18/min. Physical examination is significant for a lack of secondary sexual characteristics; a blind vagina is noted on pelvic examination. Laboratory studies reveal hypokalemia and low testosterone and estradiol levels. Cytogenetic analysis shows a 46,XY karyotype. This patient most likely has deficiency of which of the following enzymes?",
  options: [
    { label: "A", text: "5 alpha-reductase (11%)", correct: false, value: "A" },
    { label: "B", text: "17 alpha-hydroxylase (66%)", correct: true, value: "B" },
    { label: "C", text: "11 beta-hydroxylase (8%)", correct: false, value: "C" },
    { label: "D", text: "17,20-lyase (7%)", correct: false, value: "D" },
    { label: "E", text: "3 beta-hydroxysteroid dehydrogenase (8%)", correct: false, value: "E" },
  ],
  subject: "Pathology",
  system: "Endocrine",
  tags: ["CAH", "Congenital Adrenal Hyperplasia", "Enzyme Deficiency"],
  createdAt: Date.now(),
  explanation: [
    {
      type: "heading",
      level: 2,
      content: "Overview",
    },
    {
      type: "paragraph",
      content:
        "This patient is **genetically male (46,XY)** with features suggestive of **17 alpha-hydroxylase deficiency**, a rare cause of **congenital adrenal hyperplasia (CAH)**. This enzyme deficiency impairs both cortisol and androgen synthesis, leading to accumulation of precursor hormones and shunting toward the mineralocorticoid pathway.",
    },
    {
      type: "heading",
      level: 2,
      content: "Clinical Presentation",
    },
    {
      type: "paragraph",
      content: "The classic triad of 17 alpha-hydroxylase deficiency includes:",
    },
    {
      type: "list",
      items: [
        "**Hypertension** from excess mineralocorticoid (11-deoxycorticosterone)",
        "**Hypokalemia** from aldosterone-like effects",
        "**Sexual underdevelopment** from androgen deficiency",
      ],
    },
    {
      type: "paragraph",
      content:
        "Female external genitalia with XY karyotype (46,XY) results from lack of androgen action during fetal development. The blind-ending vagina occurs because anti-Müllerian hormone (AMH) was produced by the testes, suppressing development of the uterus and fallopian tubes.",
    },
    {
      type: "heading",
      level: 2,
      content: "Enzyme Function",
    },
    {
      type: "paragraph",
      content:
        "The enzyme **17 alpha-hydroxylase** is active in the **adrenal glands and gonads** and is responsible for converting pregnenolone to 17-hydroxypregnenolone and progesterone to 17-hydroxyprogesterone. This enzyme is critical for both **cortisol and androgen synthesis** pathways. Without this enzyme, steroids are shunted toward the mineralocorticoid pathway.",
    },
    {
      type: "heading",
      level: 2,
      content: "Why This Answer?",
    },
    {
      type: "paragraph",
      content:
        "The correct answer is **B. 17 alpha-hydroxylase (66%)**. The clinical presentation uniquely points to this enzyme deficiency:",
    },
    {
      type: "list",
      items: [
        "**Hypertension + Hypokalemia**: These are hallmark findings of 17 alpha-hydroxylase deficiency due to mineralocorticoid excess",
        "**Ambiguous genitalia**: Indicates androgen deficiency in a genetically male patient",
        "**46,XY genetic male**: Rules out pure 5-alpha reductase deficiency (which presents with ambiguous genitalia in males)",
        "**Low testosterone AND estradiol**: Confirms defect in androgen and estrogen production",
        "**Lack of virilization**: Would have occurred with 17,20-lyase deficiency (preserved androgen synthesis)",
      ],
    },
    {
      type: "heading",
      level: 3,
      content: "Why Not Other Answers?",
    },
    {
      type: "list",
      items: [
        "**5-alpha reductase**: Causes ambiguous genitalia but NO hypertension or hypokalemia; testosterone is elevated",
        "**11-beta hydroxylase**: Causes hypertension and hypokalemia, but also presents with virilization (elevated androgen)",
        "**17,20-lyase**: Presents with ambiguous genitalia but NO hypertension (normal mineralocorticoids)",
        "**3-beta HSD**: Presents with salt-wasting crisis and virilization",
      ],
    },
    {
      type: "heading",
      level: 2,
      content: "Comparative CAH Enzyme Deficiencies",
    },
    {
      type: "table",
      rows: [
        [
          "**Enzyme**",
          "**Hypertension**",
          "**Virilization (46,XX)**",
          "**Ambiguous Genitalia (46,XY)**",
          "**Key Feature**",
        ],
        ["17α-hydroxylase", "Yes", "No", "Yes (↓ androgen)", "↑ Mineralocorticoid"],
        ["11β-hydroxylase", "Yes", "Yes", "No (normal male)", "↑ Androgen + Mineralocorticoid"],
        ["21-hydroxylase", "No", "Yes", "No (normal male)", "↑ Androgen, salt-wasting variant"],
        ["5α-reductase", "No", "No", "Yes (↓ DHT)", "Ambiguous genitalia at birth, virilization at puberty"],
        ["3β-HSD", "Varies", "No", "Yes (↓ androgen)", "Salt-wasting crisis possible"],
      ],
    },
    {
      type: "heading",
      level: 2,
      content: "Treatment",
    },
    {
      type: "paragraph",
      content:
        "Management includes **glucocorticoid replacement** (to suppress ACTH and reduce excess mineralocorticoid production) and **mineralocorticoid antagonist** (spironolactone) to manage hypertension and hypokalemia. Hormone replacement therapy should be individualized based on sex of rearing.",
    },
  ],
}

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewQuestion, setShowNewQuestion] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [parsedMarkdownData, setParsedMarkdownData] = useState<any>(null)

  useEffect(() => {
    const saved = localStorage.getItem("uworld_questions")
    if (saved) {
      try {
        setQuestions(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load questions:", e)
      }
    } else {
      setQuestions([DEMO_QUESTION])
    }
    setLoading(false)
  }, [])

  const saveToStorage = (updatedQuestions: Question[]) => {
    localStorage.setItem("uworld_questions", JSON.stringify(updatedQuestions))
    setQuestions(updatedQuestions)
  }

  const handleSaveQuestion = (questionData: any) => {
    if (editingId) {
      const updated = questions.map((q) => (q.id === editingId ? { ...questionData, id: editingId } : q))
      saveToStorage(updated)
    } else {
      const newQuestion = {
        ...questionData,
        id: Date.now().toString(),
        createdAt: Date.now(),
      }
      saveToStorage([...questions, newQuestion])
    }
    setShowNewQuestion(false)
    setEditingId(null)
    setParsedMarkdownData(null)
  }

  const handleDeleteQuestion = (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      saveToStorage(questions.filter((q) => q.id !== id))
    }
  }

  const handleMarkdownParsed = (questionData: any) => {
    setParsedMarkdownData(questionData)
    setShowNewQuestion(true)
    setEditingId(null)
  }

  const editingQuestion = editingId ? questions.find((q) => q.id === editingId) : null
  const filteredQuestions = questions.filter(
    (q) =>
      q.stem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.system.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Question Management</h2>
            <p className="text-muted-foreground mt-1">{questions.length} questions total</p>
          </div>
          <Button
            onClick={() => {
              setShowNewQuestion(true)
              setEditingId(null)
              setParsedMarkdownData(null)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + New Question
          </Button>
        </div>
        <p className="text-muted-foreground">Create and manage medical education questions with rich explanations</p>
      </div>

      {/* Markdown Uploader Section */}
      <div className="mb-8">
        <MarkdownUploader onQuestionParsed={handleMarkdownParsed} />
      </div>

      {/* Search Bar */}
      <Card className="p-4 mb-6 shadow-md">
        <input
          type="text"
          placeholder="Search questions by stem, subject, or system..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </Card>

      {/* Editor or List */}
      {showNewQuestion || editingId ? (
        <QuestionEditor
          question={editingId ? editingQuestion : parsedMarkdownData}
          onSave={handleSaveQuestion}
          onCancel={() => {
            setShowNewQuestion(false)
            setEditingId(null)
            setParsedMarkdownData(null)
          }}
        />
      ) : (
        <>
          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  {questions.length === 0 ? "No questions created yet" : "No questions match your search"}
                </p>
                <Button onClick={() => setShowNewQuestion(true)} variant="outline">
                  {questions.length === 0 ? "Create First Question" : "New Question"}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredQuestions.length} of {questions.length} questions
                </p>
              </div>
              <QuestionList
                questions={filteredQuestions}
                onEdit={(id) => {
                  setEditingId(id)
                  setShowNewQuestion(false)
                }}
                onDelete={handleDeleteQuestion}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
