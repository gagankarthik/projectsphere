import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { AuthTokens } from "@/types/auth";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
});

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";

export async function signUp(email: string, password: string, name: string): Promise<{ userSub: string }> {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "name", Value: name },
    ],
  });

  const response = await cognitoClient.send(command);

  if (!response.UserSub) {
    throw new Error("Failed to create user");
  }

  return { userSub: response.UserSub };
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });

  await cognitoClient.send(command);
}

export async function resendConfirmationCode(email: string): Promise<void> {
  const command = new ResendConfirmationCodeCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });

  await cognitoClient.send(command);
}

export async function signIn(email: string, password: string): Promise<AuthTokens> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const response = await cognitoClient.send(command);

  if (!response.AuthenticationResult) {
    throw new Error("Authentication failed");
  }

  const { AccessToken, RefreshToken, IdToken, ExpiresIn } = response.AuthenticationResult;

  if (!AccessToken || !RefreshToken || !IdToken) {
    throw new Error("Missing authentication tokens");
  }

  return {
    accessToken: AccessToken,
    refreshToken: RefreshToken,
    idToken: IdToken,
    expiresIn: ExpiresIn || 3600,
  };
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: "REFRESH_TOKEN_AUTH",
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  const response = await cognitoClient.send(command);

  if (!response.AuthenticationResult) {
    throw new Error("Token refresh failed");
  }

  const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;

  if (!AccessToken || !IdToken) {
    throw new Error("Missing authentication tokens");
  }

  return {
    accessToken: AccessToken,
    refreshToken: refreshToken,
    idToken: IdToken,
    expiresIn: ExpiresIn || 3600,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const command = new ForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });

  await cognitoClient.send(command);
}

export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const command = new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });

  await cognitoClient.send(command);
}

export async function signOut(accessToken: string): Promise<void> {
  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });

  await cognitoClient.send(command);
}

export async function getUser(accessToken: string): Promise<{
  email: string;
  name: string;
  sub: string;
}> {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await cognitoClient.send(command);

  const email = response.UserAttributes?.find((attr) => attr.Name === "email")?.Value;
  const name = response.UserAttributes?.find((attr) => attr.Name === "name")?.Value;
  const sub = response.UserAttributes?.find((attr) => attr.Name === "sub")?.Value;

  if (!email || !sub) {
    throw new Error("Missing user attributes");
  }

  return {
    email,
    name: name || email.split("@")[0],
    sub,
  };
}
