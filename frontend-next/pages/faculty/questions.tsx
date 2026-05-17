import Head from "next/head";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyQuestionsPage } from "@/app/components/faculty/FacultyQuestionsPage";

export default function FacultyQuestionsRoute() {
  return (
    <>
      <Head>
        <title>Institution QBank — Faculty</title>
      </Head>
      <FacultyGate>
        <FacultyLayout title="Institution QBank" subtitle="MCQs visible only to your institution">
          <FacultyQuestionsPage />
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
