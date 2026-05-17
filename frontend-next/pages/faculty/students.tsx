import Head from "next/head";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyStudentsPage } from "@/app/components/faculty/FacultyStudentsPage";

export default function FacultyStudentsRoute() {
  return (
    <>
      <Head>
        <title>Students — Faculty</title>
      </Head>
      <FacultyGate>
        <FacultyLayout title="Students" subtitle="Roster and performance overview">
          <FacultyStudentsPage />
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
