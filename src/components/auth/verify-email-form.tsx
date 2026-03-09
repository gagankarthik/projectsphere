"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { confirmSignUpSchema, type ConfirmSignUpInput } from "@/validations/auth";
import { useAuth } from "@/hooks/use-auth";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, resendVerificationCode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const email = searchParams.get("email") || "";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmSignUpInput>({
    resolver: zodResolver(confirmSignUpSchema),
    defaultValues: {
      email,
    },
  });

  const onSubmit = async (data: ConfirmSignUpInput) => {
    try {
      setError(null);
      setSuccess(null);
      await verifyEmail(data.email, data.code);
      router.push("/login?verified=true");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError("Email address is required");
      return;
    }

    try {
      setIsResending(true);
      setError(null);
      setSuccess(null);
      await resendVerificationCode(email);
      setSuccess("A new verification code has been sent to your email");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to resend verification code");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification code to{" "}
          <span className="font-medium">{email || "your email"}</span>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
              {success}
            </div>
          )}
          <input type="hidden" {...register("email")} />
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              {...register("code")}
              aria-invalid={!!errors.code}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Verify email
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={handleResendCode}
            disabled={isResending}
          >
            {isResending ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Resend code
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
