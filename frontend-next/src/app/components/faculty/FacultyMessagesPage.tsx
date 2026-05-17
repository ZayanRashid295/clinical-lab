"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { facultyApiService } from "@/app/services/faculty/faculty-api.service";
import { FacultyThreadChat } from "@/app/components/faculty/FacultyThreadChat";
import { authService } from "@/shared/services/auth.service";
import {
  threadListItemClass,
  threadListPreviewClass,
  threadListTitleClass,
} from "@/app/components/institution/institution-page-shell";

export function FacultyMessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<any>(null);
  const userId = authService.getCurrentUser()?.id ?? null;

  const loadThreads = useCallback(() => {
    void facultyApiService.listThreads().then(setThreads);
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const q = router.query.thread;
    if (typeof q === "string") setActiveId(q);
  }, [router.query.thread]);

  useEffect(() => {
    if (!activeId) {
      setActiveStudent(null);
      return;
    }
    void facultyApiService.getThread(activeId).then((data) => {
      setActiveStudent(data?.student);
    });
  }, [activeId]);

  const loadThread = useCallback(
    (id: string) => facultyApiService.getThread(id) as Promise<{ messages: any[] }>,
    [],
  );

  return (
    <div className="grid h-[calc(100vh-12rem)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="overflow-y-auto rounded-xl border border-slate-200 dark:border-white/10">
        {threads.map((t) => {
          const active = activeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveId(t.id)}
              className={threadListItemClass(active)}
            >
              <p className={threadListTitleClass(active)}>
                {t.student?.firstName} {t.student?.lastName}
              </p>
              <p className={threadListPreviewClass(active)}>
                {t.lastMessage?.content ?? "No messages"}
              </p>
            </button>
          );
        })}
      </div>

      <FacultyThreadChat
        threadId={activeId}
        currentUserId={userId}
        loadThread={loadThread}
        sendMessage={(id, content) => facultyApiService.sendMessage(id, content)}
        header={
          activeStudent ? (
            <p className="font-medium text-slate-900 dark:text-white">
              {activeStudent.firstName} {activeStudent.lastName}
            </p>
          ) : null
        }
      />
    </div>
  );
}
