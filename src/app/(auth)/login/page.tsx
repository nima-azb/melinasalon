import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
