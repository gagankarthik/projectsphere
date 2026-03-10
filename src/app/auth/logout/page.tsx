import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function LogoutPage() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("id_token");
  cookieStore.delete("refresh_token");

  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    logout_uri: process.env.NEXT_PUBLIC_APP_URL!,
  });

  redirect(`${process.env.NEXT_PUBLIC_COGNITO_DOMAIN}/logout?${params}`);
}
