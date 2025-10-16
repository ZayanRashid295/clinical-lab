import { redirect } from "next/navigation";

// This page redirects to the landing page as the default route
export default function RootPage() {
  redirect("/landing-page");
}
