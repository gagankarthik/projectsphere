import { NextRequest } from "next/server";
import { confirmForgotPassword } from "@/lib/auth/cognito";
import { resetPasswordSchema } from "@/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    await confirmForgotPassword(
      validatedData.email,
      validatedData.code,
      validatedData.newPassword
    );

    return successResponse({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === "CodeMismatchException") {
        return errorResponse(new BadRequestError("Invalid reset code"));
      }
      if (error.name === "ExpiredCodeException") {
        return errorResponse(new BadRequestError("Reset code has expired. Please request a new one."));
      }
    }
    return errorResponse(error);
  }
}
