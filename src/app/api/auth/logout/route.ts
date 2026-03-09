import { NextRequest } from "next/server";
import { signOut } from "@/lib/auth/cognito";
import { clearAuthCookies, getAccessToken } from "@/lib/auth/session";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getAccessToken();

    if (accessToken) {
      try {
        await signOut(accessToken);
      } catch (error) {
        // Continue with local logout even if Cognito signout fails
        console.error("Cognito signout failed:", error);
      }
    }

    await clearAuthCookies();

    return successResponse({ message: "Logged out successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
