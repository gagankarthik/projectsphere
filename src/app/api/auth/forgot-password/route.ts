import { NextRequest } from "next/server";
import { forgotPassword } from "@/lib/auth/cognito";
import { forgotPasswordSchema } from "@/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    await forgotPassword(validatedData.email);

    return successResponse({
      message: "If an account with that email exists, a password reset code has been sent.",
      email: validatedData.email,
    });
  } catch (error: unknown) {
    // Don't reveal if user exists
    if (error instanceof Error && error.name === "UserNotFoundException") {
      return successResponse({
        message: "If an account with that email exists, a password reset code has been sent.",
      });
    }
    return errorResponse(error);
  }
}
