import { NextRequest } from "next/server";
import { signIn } from "@/lib/auth/cognito";
import { setAuthCookies } from "@/lib/auth/session";
import { decodeToken } from "@/lib/auth/tokens";
import { getOrCreateUser } from "@/lib/db/entities/user";
import { signInSchema } from "@/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { BadRequestError, UnauthorizedError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signInSchema.parse(body);

    const tokens = await signIn(validatedData.email, validatedData.password);

    // Decode the ID token to get user info
    const payload = decodeToken(tokens.idToken);
    if (!payload) {
      throw new BadRequestError("Failed to decode token");
    }

    // Create or get user in DynamoDB
    const user = await getOrCreateUser(
      payload.email,
      payload.name || payload.email.split("@")[0],
      payload.sub
    );

    // Set auth cookies
    await setAuthCookies(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.idToken,
      tokens.expiresIn
    );

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.name === "NotAuthorizedException") {
        return errorResponse(new UnauthorizedError("Invalid email or password"));
      }
      if (error.name === "UserNotConfirmedException") {
        return errorResponse(new BadRequestError("Please verify your email before logging in", "EMAIL_NOT_VERIFIED"));
      }
    }
    return errorResponse(error);
  }
}
