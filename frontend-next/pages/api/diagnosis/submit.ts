import type { NextApiRequest, NextApiResponse } from "next"
import { diagnosisService } from "@/lib/fyp/diagnosis-service"
import { sampleCases, type DiagnosisSubmission, type MedicalCase } from "@/lib/fyp/data-models"
import { appendDiagnosisSubmission, listDiagnosisSubmissions } from "@/lib/fyp/server-medprep-db"

type SubmitDiagnosisRequest = {
  conversationId: string
  studentId: string
  submittedDiagnosis: string
  caseId: string
  medicalCase?: MedicalCase
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body
      const {
        conversationId,
        studentId,
        submittedDiagnosis,
        caseId,
        medicalCase: providedMedicalCase,
      }: SubmitDiagnosisRequest = body || {}

      if (!conversationId || !studentId || !submittedDiagnosis || !caseId) {
        return res.status(400).json({ error: "Missing required fields" })
      }

      let medicalCase = sampleCases.find((c) => c.id === caseId)
      if (!medicalCase && providedMedicalCase && providedMedicalCase.id === caseId) {
        medicalCase = providedMedicalCase
      }

      if (!medicalCase) {
        return res.status(404).json({ error: "Case not found" })
      }

      const submission = diagnosisService.submitDiagnosis(
        conversationId,
        studentId,
        submittedDiagnosis,
        medicalCase
      )
      await appendDiagnosisSubmission(submission)

      return res.status(200).json({
        submission,
        feedback: {
          isCorrect: submission.isCorrect,
          actualDiagnosis: submission.actualDiagnosis,
          submittedDiagnosis: submission.submittedDiagnosis,
          message: submission.isCorrect
            ? "Correct diagnosis! Well done!"
            : `Incorrect. The actual diagnosis is ${submission.actualDiagnosis}.`,
          caseMetadata: submission.caseMetadata,
        },
      })
    } catch (error) {
      console.error("Error submitting diagnosis:", error)
      const details = error instanceof Error ? error.message : "Unknown error"
      return res.status(500).json({ error: "Failed to submit diagnosis", details })
    }
  }

  if (req.method === "GET") {
    try {
      const studentId = typeof req.query.studentId === "string" ? req.query.studentId : undefined
      const conversationId =
        typeof req.query.conversationId === "string" ? req.query.conversationId : undefined

      const submissions = await listDiagnosisSubmissions()

      const computeStats = (items: DiagnosisSubmission[]) => {
        const totalSubmissions = items.length
        const correctDiagnoses = items.filter((item) => item.isCorrect).length
        const accuracy = totalSubmissions > 0 ? (correctDiagnoses / totalSubmissions) * 100 : 0
        const rareItems = items.filter((item) => item.caseMetadata.isRare)
        const commonItems = items.filter((item) => !item.caseMetadata.isRare)
        const rareDiseaseAccuracy =
          rareItems.length > 0 ? (rareItems.filter((item) => item.isCorrect).length / rareItems.length) * 100 : 0
        const commonDiseaseAccuracy =
          commonItems.length > 0 ? (commonItems.filter((item) => item.isCorrect).length / commonItems.length) * 100 : 0
        return { totalSubmissions, correctDiagnoses, accuracy, rareDiseaseAccuracy, commonDiseaseAccuracy }
      }

      if (studentId) {
        const studentSubmissions = submissions.filter((item) => item.studentId === studentId)
        const base = computeStats(studentSubmissions)
        const specialtyBreakdown: Record<string, { total: number; correct: number; accuracy: number }> = {}
        studentSubmissions.forEach((item) => {
          const key = item.caseMetadata.specialty
          if (!specialtyBreakdown[key]) specialtyBreakdown[key] = { total: 0, correct: 0, accuracy: 0 }
          specialtyBreakdown[key].total += 1
          if (item.isCorrect) specialtyBreakdown[key].correct += 1
        })
        Object.keys(specialtyBreakdown).forEach((key) => {
          const stat = specialtyBreakdown[key]
          stat.accuracy = stat.total > 0 ? (stat.correct / stat.total) * 100 : 0
        })
        return res.status(200).json({ submissions: studentSubmissions, stats: { ...base, specialtyBreakdown } })
      }

      if (conversationId) {
        return res.status(200).json({ submissions: submissions.filter((item) => item.conversationId === conversationId) })
      }

      const globalBase = computeStats(submissions)
      const specialtyMap: Record<string, { total: number; correct: number }> = {}
      submissions.forEach((item) => {
        const key = item.caseMetadata.specialty
        if (!specialtyMap[key]) specialtyMap[key] = { total: 0, correct: 0 }
        specialtyMap[key].total += 1
        if (item.isCorrect) specialtyMap[key].correct += 1
      })
      const topSpecialties = Object.entries(specialtyMap)
        .map(([specialty, stats]) => ({
          specialty,
          accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
          submissions: stats.total,
        }))
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 10)
      const globalStats = {
        totalSubmissions: globalBase.totalSubmissions,
        overallAccuracy: globalBase.accuracy,
        rareDiseaseAccuracy: globalBase.rareDiseaseAccuracy,
        commonDiseaseAccuracy: globalBase.commonDiseaseAccuracy,
        topSpecialties,
      }
      return res.status(200).json({ globalStats })
    } catch (error) {
      console.error("Error fetching diagnosis data:", error)
      const details = error instanceof Error ? error.message : "Unknown error"
      return res.status(500).json({ error: "Failed to fetch diagnosis data", details })
    }
  }

  res.setHeader("Allow", ["POST", "GET"])
  return res.status(405).json({ error: "Method not allowed" })
}
