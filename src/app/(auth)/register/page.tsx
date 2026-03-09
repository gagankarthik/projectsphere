import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <RegisterForm />
    </Suspense>
  );
}
