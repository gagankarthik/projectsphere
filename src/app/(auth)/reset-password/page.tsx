import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
