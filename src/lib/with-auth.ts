import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { Session } from "next-auth";

/**
 * Validates the request is authenticated.
 * Returns the session if authenticated.
 * Throws a 401 Response if not.
 *
 * @example
 * export async function GET() {
 *   const session = await withAuth();
 *   // session.user.id is guaranteed to exist
 *   ...
 * }
 */
export async function withAuth(): Promise<Session & { user: { id: string } }> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session as Session & { user: { id: string } };
}
