import TwitterProvider from "next-auth/providers/twitter";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { Account } from "next-auth";

// Extend the built-in session type
interface ExtendedSession extends Session {
  accessToken?: string;
}

// Extend the built-in token type
interface ExtendedToken extends JWT {
  accessToken?: string;
}

export const authOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      version: "2.0",
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/twitter`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: JWT; account: Account | null }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token as ExtendedToken;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: ExtendedToken;
    }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  // Add these to ensure proper OAuth callback handling
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
};
