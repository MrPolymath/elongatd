import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Helper function to handle CORS
function corsResponse(response: NextResponse) {
  // Allow requests from any origin since we're using token auth
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsResponse(new NextResponse(null, { status: 200 }));
}

export async function GET(request: NextRequest) {
  try {
    // Use NextAuth's getToken to validate and return the token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.sub) {
      return corsResponse(
        NextResponse.json({ error: "Authentication required" }, { status: 401 })
      );
    }

    return corsResponse(
      NextResponse.json({
        user: {
          id: token.sub,
          name: token.name,
          image: token.picture,
        },
        expires: token.exp
          ? new Date(Number(token.exp) * 1000).toISOString()
          : undefined,
        accessToken: request.cookies.get("next-auth.session-token")?.value,
      })
    );
  } catch (error) {
    console.error("Error getting session:", error);
    return corsResponse(
      NextResponse.json({ error: "Failed to get session" }, { status: 500 })
    );
  }
}
