import Head from "next/head";
import { FacultyGate } from "@/app/components/faculty/FacultyGate";
import { FacultyLayout } from "@/app/components/faculty/FacultyLayout";
import { FacultyMessagesPage } from "@/app/components/faculty/FacultyMessagesPage";

export default function FacultyMessagesRoute() {
  return (
    <>
      <Head>
        <title>Messages — Faculty</title>
      </Head>
      <FacultyGate>
        <FacultyLayout title="Messages" subtitle="Advise students in one-to-one threads">
          <FacultyMessagesPage />
        </FacultyLayout>
      </FacultyGate>
    </>
  );
}
