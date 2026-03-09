import { Suspense } from "react";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
