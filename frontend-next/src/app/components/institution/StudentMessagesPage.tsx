"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { studentInstitutionApiService } from "@/app/services/faculty/student-institution-api.service";
import { FacultyThreadChat } from "@/app/components/faculty/FacultyThreadChat";
import { authService } from "@/shared/services/auth.service";
import { Building2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  INSTITUTION_PAGE_OUTER,
  InstitutionPageHeader,
  threadListItemClass,
  threadListPreviewClass,
  threadListTitleClass,
} from "@/app/components/institution/institution-page-shell";

export function StudentMessagesPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFaculty, setActiveFaculty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userId = authService.getCurrentUser()?.id ?? null;

  const loadThreads = useCallback(() => {
    void studentInstitutionApiService.listMessageThreads().then(setThreads);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const c = await studentInstitutionApiService.getContext();
        setCtx(c);
        loadThreads();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadThreads]);

  useEffect(() => {
    const facultyId = router.query.facultyId;
    if (typeof facultyId === "string" && ctx?.linked) {
      void studentInstitutionApiService.openFacultyThread(facultyId).then((data) => {
        if (data?.thread?.id) {
          setActiveId(data.thread.id);
          setActiveFaculty(data.faculty);
        }
        loadThreads();
      });
    }
  }, [router.query.facultyId, ctx?.linked, loadThreads]);

  useEffect(() => {
    if (!activeId) {
      setActiveFaculty(null);
      return;
    }
    void studentInstitutionApiService.getThread(activeId).then((data) => {
      setActiveFaculty(data?.faculty);
    });
  }, [activeId]);

  const loadThread = useCallback(
    (id: string) =>
      studentInstitutionApiService.getThread(id) as Promise<{ messages: any[] }>,
    [],
  );

  const contactPrimary = async () => {
    if (!ctx?.primaryFaculty?.id) return;
    const data = await studentInstitutionApiService.openFacultyThread(
      ctx.primaryFaculty.id,
    );
    if (data?.thread?.id) {
      setActiveId(data.thread.id);
      setActiveFaculty(data.faculty ?? ctx.primaryFaculty);
      loadThreads();
    }
  };

  if (loading) {
    return (
      <div className={INSTITUTION_PAGE_OUTER}>
        <InstitutionPageHeader title="Faculty messages" />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (ctx && !ctx.linked) {
    return (
      <div className={INSTITUTION_PAGE_OUTER}>
        <InstitutionPageHeader title="Faculty messages" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center text-slate-600 dark:text-slate-400">
          <Building2 className="mb-4 h-12 w-12 opacity-40" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Not linked to an institution
          </p>
          <p className="mt-2 max-w-md text-sm">
            Link your institution email to message faculty.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={INSTITUTION_PAGE_OUTER}>
      <InstitutionPageHeader
        title="Faculty messages"
        subtitle={ctx?.institution?.name}
        actions={
          ctx?.primaryFaculty ? (
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600/60 bg-slate-800/80 text-slate-100 hover:bg-slate-700/80 dark:border-white/15 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15"
              onClick={() => void contactPrimary()}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Dr. {ctx.primaryFaculty.firstName}
            </Button>
          ) : null
        }
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-b border-white/10 bg-slate-900/40 lg:border-b-0 lg:border-r">
          <div className="shrink-0 border-b border-white/10 px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-400">
            Conversations ({threads.length})
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">
                No conversations yet. Message your faculty contact to start.
              </p>
            ) : (
              threads.map((t) => {
                const active = activeId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    className={threadListItemClass(active)}
                  >
                    <p className={threadListTitleClass(active)}>
                      Dr. {t.faculty?.firstName} {t.faculty?.lastName}
                    </p>
                    <p className={threadListPreviewClass(active)}>
                      {t.lastMessage?.content ?? "No messages yet"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-h-[240px] flex-1 flex-col p-3 sm:p-4 lg:min-h-0">
          <FacultyThreadChat
            threadId={activeId}
            currentUserId={userId}
            loadThread={loadThread}
            sendMessage={(id, content) =>
              studentInstitutionApiService.sendMessage(id, content)
            }
            className="h-full min-h-0 flex-1 rounded-2xl border-slate-200/80 shadow-sm dark:border-white/10"
            header={
              activeFaculty ? (
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  Dr. {activeFaculty.firstName} {activeFaculty.lastName}
                </p>
              ) : (
                <p className="text-sm text-slate-500">Select a conversation</p>
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
