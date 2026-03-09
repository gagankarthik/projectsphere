import { NextRequest } from "next/server";
import { refreshTokens } from "@/lib/auth/cognito";
import { setAuthCookies, getRefreshToken } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api/response";
import { UnauthorizedError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      throw new UnauthorizedError("No refresh token found");
    }

    const tokens = await refreshTokens(refreshToken);

    await setAuthCookies(
      tokens.accessToken,
      tokens.refreshToken,
      tokens.idToken,
      tokens.expiresIn
    );

    return successResponse({ message: "Token refreshed successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
