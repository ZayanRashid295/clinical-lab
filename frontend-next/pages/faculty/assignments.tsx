import Head from "next/head";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyAssignmentsPage } from "@/app/components/faculty/FacultyAssignmentsPage";

export default function FacultyAssignmentsRoute() {
  return (
    <>
      <Head>
        <title>Assignments — Faculty</title>
      </Head>
      <FacultyGate>
        <FacultyLayout title="Assignments" subtitle="Create and publish work for your roster">
          <FacultyAssignmentsPage />
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
