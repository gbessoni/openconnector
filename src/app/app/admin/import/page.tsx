import { redirect } from "next/navigation";

export default function AdminImportRedirect() {
  redirect("/app/leads/import");
}
