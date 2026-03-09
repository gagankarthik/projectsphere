import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
