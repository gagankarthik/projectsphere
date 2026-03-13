import { NextRequest, NextResponse } from "next/server";

// Temporary debug endpoint - REMOVE after debugging
export async function GET(request: NextRequest) {
  const config = {
    hasAwsRegion: !!process.env.NEXT_PUBLIC_AWS_REGION,
    hasAwsAccessKey: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    hasAwsSecretKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    awsRegion: process.env.NEXT_PUBLIC_AWS_REGION || "(not set)",
    usersTable: process.env.NEXT_PUBLIC_DYNAMODB_USERS_TABLE || "(not set)",
    workspacesTable: process.env.NEXT_PUBLIC_DYNAMODB_WORKSPACES_TABLE || "(not set)",
    workspaceMembersTable: process.env.NEXT_PUBLIC_DYNAMODB_WORKSPACE_MEMBERS_TABLE || "(not set)",
    cognitoUserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "(not set)",
    cognitoClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ? "set" : "(not set)",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "(not set)",
    // SES debugging
    hasSesSmtp: !!process.env.NEXT_PUBLIC_AWS_SMTP,
    hasSesSmtpPassword: !!process.env.NEXT_PUBLIC_AWS_SMTP_PASSWORD,
    sesFromEmail: process.env.NEXT_PUBLIC_AWS_SES_FROM_EMAIL || "(not set)",
  };

  return NextResponse.json({
    message: "Debug info - remove this endpoint after debugging",
    config,
    timestamp: new Date().toISOString(),
  });
}
