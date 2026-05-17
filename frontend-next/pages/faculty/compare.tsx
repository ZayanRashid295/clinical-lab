import Head from "next/head";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyComparePage } from "@/app/components/faculty/FacultyComparePage";

export default function FacultyCompareRoute() {
  return (
    <>
      <Head>
        <title>Compare students — Faculty</title>
      </Head>
      <FacultyGate>
        <FacultyLayout title="Compare students" subtitle="Side-by-side MedPrep metrics">
          <FacultyComparePage />
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
