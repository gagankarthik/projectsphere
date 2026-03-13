import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("id_token");
  cookieStore.delete("refresh_token");

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    logout_uri: process.env.NEXT_PUBLIC_APP_URL!,
  });

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/logout?${params}`
  );
}
