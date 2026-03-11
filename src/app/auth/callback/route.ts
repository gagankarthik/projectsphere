import { NextRequest, NextResponse } from "next/server";

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
const CLIENT_SECRET = process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET!;
const DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Log the incoming request for debugging
  console.log("[auth/callback] Received callback with:", {
    code: code ? "present" : "missing",
    state,
    error,
    errorDescription,
    url: request.url
  });

  // Handle OAuth errors
  if (error) {
    console.error("[auth/callback] OAuth error:", { error, errorDescription });
    const errorMessage = errorDescription || error;
    return NextResponse.redirect(
      `${APP_URL}/auth/login?error=${encodeURIComponent(errorMessage)}`
    );
  }

  // Validate code
  if (!code) {
    console.error("[auth/callback] No code received");
    return NextResponse.redirect(
      `${APP_URL}/auth/login?error=${encodeURIComponent("no_code")}`
    );
  }

  // Validate state (CSRF protection)
  const storedState = request.cookies.get("oauth_state")?.value;
  if (state && storedState && state !== storedState) {
    console.error("[auth/callback] State mismatch", { received: state, stored: storedState });
    return NextResponse.redirect(
      `${APP_URL}/auth/login?error=${encodeURIComponent("state_mismatch")}`
    );
  }

  try {
    // IMPORTANT: This redirectUri MUST match EXACTLY what was sent in the authorize request
    // and what's configured in Cognito
    const redirectUri = `${APP_URL}/auth/callback`;
    
    // Log what we're sending to help debug
    console.log("[auth/callback] Exchanging code with redirectUri:", redirectUri);

    // Create Basic Auth credentials
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    // Exchange code for tokens
    const tokenResponse = await fetch(`${DOMAIN}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    // Handle token exchange errors
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[auth/callback] Token exchange failed:", {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: errorText
      });
      
      let errorMessage = "token_exchange_failed";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText.substring(0, 100); // Limit length
      }
      
      return NextResponse.redirect(
        `${APP_URL}/auth/login?error=${encodeURIComponent(errorMessage)}`
      );
    }

    const tokens = await tokenResponse.json();
    console.log("[auth/callback] Token exchange successful");

    // Create/update user in database
    try {
      const { decodeToken } = await import("@/lib/auth/tokens");
      const { getOrCreateUser } = await import("@/lib/db/entities/user");

      // Extract user info from id_token
      let email: string | undefined;
      let name: string | undefined;
      let sub: string | undefined;

      const payload = decodeToken(tokens.id_token);
      if (payload) {
        sub = payload.sub;
        email = payload.email as string | undefined;
        name = payload.name as string | undefined;
        console.log("[auth/callback] Extracted from token:", { sub, email, name });
      }

      // Fallback: fetch from userInfo endpoint if email missing
      if (!email && tokens.access_token) {
        try {
          const uiRes = await fetch(`${DOMAIN}/oauth2/userInfo`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          
          if (uiRes.ok) {
            const userInfo = await uiRes.json();
            email = email || userInfo.email;
            name = name || userInfo.name;
            sub = sub || userInfo.sub;
            console.log("[auth/callback] Fetched from userInfo:", { email, name, sub });
          } else {
            console.error("[auth/callback] userInfo fetch failed:", uiRes.status);
          }
        } catch (uiErr) {
          console.error("[auth/callback] userInfo fetch error:", uiErr);
        }
      }

      // Create or update user in database
      if (sub && email) {
        await getOrCreateUser(email, name || email.split("@")[0], sub);
        console.log("[auth/callback] User created/updated successfully");
      } else {
        console.error("[auth/callback] Missing required user info", { sub, email });
      }
    } catch (dbError) {
      console.error("[auth/callback] Database operation failed:", dbError);
      // Continue with login even if DB operation fails
      // You might want to handle this differently based on your requirements
    }

    // Determine redirect destination
    let redirectTo = "/dashboard";
    if (state && !state.startsWith("http") && state.startsWith("/")) {
      redirectTo = state;
    }

    // Create response with redirect
    const response = NextResponse.redirect(`${APP_URL}${redirectTo}`);

    // Cookie configuration
    const isProduction = process.env.NODE_ENV === "production";
    const cookieBase = {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
      path: "/",
    };

    // Set token cookies with appropriate expiration
    if (tokens.access_token) {
      const accessExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
      response.cookies.set("access_token", tokens.access_token, {
        ...cookieBase,
        expires: accessExpiry,
      });
    }

    if (tokens.id_token) {
      const idExpiry = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);
      response.cookies.set("id_token", tokens.id_token, {
        ...cookieBase,
        expires: idExpiry,
      });
    }

    if (tokens.refresh_token) {
      const refreshExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      response.cookies.set("refresh_token", tokens.refresh_token, {
        ...cookieBase,
        expires: refreshExpiry,
      });
    }

    // Clear the oauth_state cookie
    response.cookies.set("oauth_state", "", {
      ...cookieBase,
      expires: new Date(0),
      maxAge: 0,
    });

    return response;

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[auth/callback] Unexpected error:", errorMessage, err);
    return NextResponse.redirect(
      `${APP_URL}/auth/login?error=${encodeURIComponent("unexpected_error")}`
    );
  }
}