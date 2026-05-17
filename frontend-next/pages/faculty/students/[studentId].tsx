import Head from "next/head";
import { useRouter } from "next/router";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyStudentDetailPage } from "@/app/components/faculty/FacultyStudentDetailPage";

export default function FacultyStudentDetailRoute() {
  const router = useRouter();
  const studentId =
    typeof router.query.studentId === "string" ? router.query.studentId : "";

  return (
    <>
      <Head>
        <title>Student detail — Faculty</title>
      </Head>
      <FacultyGate>
        <FacultyLayout title="Student profile">
          {studentId ? (
            <FacultyStudentDetailPage studentId={studentId} />
          ) : (
            <p className="text-slate-500">Loading…</p>
          )}
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
