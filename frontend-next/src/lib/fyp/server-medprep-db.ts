import { promises as fs } from "fs"
import path from "path"
import type { DiagnosisSubmission, SOAPNote } from "./data-models"
import type { MedprepStoredConversation } from "./medprep-conversation-memory-store"

type MedprepDbShape = {
  conversations: MedprepStoredConversation[]
  diagnosisSubmissions: DiagnosisSubmission[]
  soapNotes: SOAPNote[]
}

const DEFAULT_DB: MedprepDbShape = {
  conversations: [],
  diagnosisSubmissions: [],
  soapNotes: [],
}

const DB_DIR = path.join(process.cwd(), ".data")
const DB_FILE = path.join(DB_DIR, "medprep-db.json")

let writeQueue: Promise<void> = Promise.resolve()

async function ensureDbFile(): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true })
  try {
    await fs.access(DB_FILE)
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8")
  }
}

async function readDb(): Promise<MedprepDbShape> {
  await ensureDbFile()
  const raw = await fs.readFile(DB_FILE, "utf-8")
  const parsed = JSON.parse(raw || "{}")
  return {
    conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
    diagnosisSubmissions: Array.isArray(parsed.diagnosisSubmissions) ? parsed.diagnosisSubmissions : [],
    soapNotes: Array.isArray(parsed.soapNotes) ? parsed.soapNotes : [],
  }
}

async function writeDb(next: MedprepDbShape): Promise<void> {
  await ensureDbFile()
  writeQueue = writeQueue.then(() => fs.writeFile(DB_FILE, JSON.stringify(next, null, 2), "utf-8")).then(() => undefined)
  await writeQueue
}

export async function listConversations(): Promise<MedprepStoredConversation[]> {
  const db = await readDb()
  return db.conversations
}

export async function getConversationById(conversationId: string): Promise<MedprepStoredConversation | null> {
  const db = await readDb()
  return db.conversations.find((item) => item.id === conversationId) || null
}

export async function upsertConversation(conversation: MedprepStoredConversation): Promise<void> {
  const db = await readDb()
  const index = db.conversations.findIndex((item) => item.id === conversation.id)
  if (index >= 0) db.conversations[index] = conversation
  else db.conversations.push(conversation)
  await writeDb(db)
}

export async function appendDiagnosisSubmission(submission: DiagnosisSubmission): Promise<void> {
  const db = await readDb()
  db.diagnosisSubmissions.push(submission)
  await writeDb(db)
}

export async function listDiagnosisSubmissions(): Promise<DiagnosisSubmission[]> {
  const db = await readDb()
  return db.diagnosisSubmissions
}

export async function upsertSoapNote(soapNote: SOAPNote): Promise<void> {
  const db = await readDb()
  const index = db.soapNotes.findIndex((item) => item.conversationId === soapNote.conversationId)
  if (index >= 0) db.soapNotes[index] = soapNote
  else db.soapNotes.push(soapNote)
  await writeDb(db)
}

export async function getSoapNoteByConversationId(conversationId: string): Promise<SOAPNote | null> {
  const db = await readDb()
  return db.soapNotes.find((item) => item.conversationId === conversationId) || null
}

export async function listSoapNotesByStudent(studentId: string): Promise<SOAPNote[]> {
  const db = await readDb()
  return db.soapNotes.filter((item) => item.studentId === studentId)
}
