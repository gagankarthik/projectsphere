import { NextRequest, NextResponse } from "next/server";
import { decodeToken } from "@/lib/auth/tokens";
import { getOrCreateUser } from "@/lib/db/entities/user";

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export async function GET(request: NextRequest) {
  const appUrl = getAppUrl();
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors from Cognito
  if (error) {
    console.error("[auth/callback] OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent("No authorization code")}`
    );
  }

  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const clientSecret = process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET;
  const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;

  if (!clientId || !clientSecret || !cognitoDomain) {
    console.error("[auth/callback] Missing Cognito configuration");
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent("Server configuration error")}`
    );
  }

  try {
    const redirectUri = `${appUrl}/auth/callback`;
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${cognitoDomain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[auth/callback] Token exchange failed:", tokenResponse.status, errorText);
      return NextResponse.redirect(
        `${appUrl}/auth/login?error=${encodeURIComponent("Token exchange failed")}`
      );
    }

    const tokens = await tokenResponse.json();

    // Extract user info and create/update user in database
    const payload = decodeToken(tokens.id_token);
    if (payload?.sub && payload?.email) {
      try {
        const name = payload.name || payload.email.split("@")[0];
        await getOrCreateUser(payload.email, name, payload.sub);
      } catch (dbError) {
        console.error("[auth/callback] Database error:", dbError);
      }
    }

    // Redirect to dashboard
    const response = NextResponse.redirect(`${appUrl}/dashboard`);

    // Set authentication cookies
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    if (tokens.access_token) {
      response.cookies.set("access_token", tokens.access_token, {
        ...cookieOptions,
        maxAge: tokens.expires_in || 3600,
      });
    }

    if (tokens.id_token) {
      response.cookies.set("id_token", tokens.id_token, {
        ...cookieOptions,
        maxAge: tokens.expires_in || 3600,
      });
    }

    if (tokens.refresh_token) {
      response.cookies.set("refresh_token", tokens.refresh_token, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;

  } catch (err) {
    console.error("[auth/callback] Unexpected error:", err);
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent("Authentication failed")}`
    );
  }
}
