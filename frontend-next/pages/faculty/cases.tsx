import Head from "next/head";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyCasesPage } from "@/app/components/faculty/FacultyCasesPage";

export default function FacultyCasesRoute() {
  return (
    <>
      <Head>
        <title>Case Studio — Faculty</title>
      </Head>
      <FacultyGate>
        <FacultyLayout title="Case Studio" subtitle="Author institution cases for all MedPrep modes">
          <FacultyCasesPage />
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
