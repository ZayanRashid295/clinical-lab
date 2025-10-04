import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/prisma/prisma.service";

@Injectable()
export class LearningProgressService {
  constructor(private prisma: PrismaService) {}

  async getLearningProgress(userId: string) {
    const sessions = await this.prisma.learningSession.findMany({
      where: { userId },
      include: { case: true },
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.isComplete === true
    ).length;
    const averageScore =
      sessions.reduce((acc, s) => acc + (s.score || 0), 0) / totalSessions || 0;

    const difficultyStats = {
      beginner: sessions.filter((s) => s.case.difficulty === "beginner").length,
      intermediate: sessions.filter((s) => s.case.difficulty === "intermediate")
        .length,
      advanced: sessions.filter((s) => s.case.difficulty === "advanced").length,
    };

    const specialtyStats = sessions.reduce(
      (acc, s) => {
        const specialty = s.case.specialty;
        acc[specialty] = (acc[specialty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalSessions,
      completedSessions,
      completionRate:
        totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      averageScore,
      difficultyStats,
      specialtyStats,
      recentSessions: sessions.slice(0, 5).map((s) => ({
        id: s.id,
        caseTitle: s.case.title,
        score: s.score,
        isComplete: s.isComplete,
        createdAt: s.createdAt,
      })),
    };
  }

  async updateLearningProgress(userId: string, sessionData: any) {
    // This would typically update progress metrics, achievements, etc.
    // For now, we'll just return the current progress
    return this.getLearningProgress(userId);
  }

  async getLearningAnalytics(userId: string) {
    const sessions = await this.prisma.learningSession.findMany({
      where: { userId },
      include: { case: true },
      orderBy: { createdAt: "desc" },
    });

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentSessions = sessions.filter((s) => s.createdAt >= last30Days);

    const dailyProgress = recentSessions.reduce(
      (acc, s) => {
        const date = s.createdAt.toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const scoreTrend = recentSessions.map((s) => ({
      date: s.createdAt.toISOString().split("T")[0],
      score: s.score || 0,
    }));

    return {
      dailyProgress,
      scoreTrend,
      totalStudyTime: sessions.reduce((acc, s) => acc + (s.duration || 0), 0),
      averageSessionDuration:
        sessions.length > 0
          ? sessions.reduce((acc, s) => acc + (s.duration || 0), 0) /
            sessions.length
          : 0,
    };
  }

  async getLeaderboard() {
    const users = await this.prisma.user.findMany({
      include: {
        learningSessions: {
          include: { case: true },
        },
      },
    });

    const leaderboard = users
      .map((user) => {
        const sessions = user.learningSessions;
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(
          (s) => s.isComplete === true
        ).length;
        const averageScore =
          sessions.reduce((acc, s) => acc + (s.score || 0), 0) /
            totalSessions || 0;

        return {
          userId: user.id,
          name: `${user.firstName} ${user.lastName}`,
          totalSessions,
          completedSessions,
          averageScore,
          completionRate:
            totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        };
      })
      .filter((user) => user.totalSessions > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    return leaderboard;
  }
}
