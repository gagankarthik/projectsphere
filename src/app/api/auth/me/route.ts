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
    const user = await getUserById(authUser.id);

    if (!user) {
      return successResponse(null);
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
