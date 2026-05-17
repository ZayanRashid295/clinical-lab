import Head from "next/head";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyCommandCenter } from "@/app/components/faculty/FacultyCommandCenter";

export default function FacultyHomePage() {
  return (
    <>
      <Head>
        <title>Faculty Command Center — MedPrepAI</title>
      </Head>
      <FacultyGate>
        <FacultyLayout
          title="Command Center"
          subtitle="Monitor student activity, assignments, and messages for your institution."
        >
          <FacultyCommandCenter />
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
