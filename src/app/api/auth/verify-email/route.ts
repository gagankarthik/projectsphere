import { NextRequest } from "next/server";
import { confirmSignUp, resendConfirmationCode } from "@/lib/auth/cognito";
import { confirmSignUpSchema } from "@/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = confirmSignUpSchema.parse(body);

    await confirmSignUp(validatedData.email, validatedData.code);

    return successResponse({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === "CodeMismatchException") {
        return errorResponse(new BadRequestError("Invalid verification code"));
      }
      if (error.name === "ExpiredCodeException") {
        return errorResponse(new BadRequestError("Verification code has expired. Please request a new one."));
      }
    }
    return errorResponse(error);
  }
}

// Resend verification code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = z.object({ email: z.string().email() }).parse(body);

    await resendConfirmationCode(email);

    return successResponse({
      message: "Verification code sent successfully",
    });
  } catch (error) {
    return errorResponse(error);
  }
}
