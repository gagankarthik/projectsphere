import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserById } from "@/lib/db/entities/user";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();

    if (!authUser) {
      return successResponse(null);
    }

    // Get full user data from database
    let user;
    try {
      user = await getUserById(authUser.id);
    } catch (dbError) {
      console.error("[api/auth/me] Database error fetching user:", dbError);
      // Return basic user info from token if DB lookup fails
      return successResponse({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        avatarUrl: undefined,
      });
    }

    if (!user) {
      // User exists in Cognito but not in DB - return token info
      return successResponse({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        avatarUrl: undefined,
      });
    }

    return successResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });
  } catch (error) {
    console.error("[api/auth/me] Error:", error);
    return errorResponse(error);
  }
}
