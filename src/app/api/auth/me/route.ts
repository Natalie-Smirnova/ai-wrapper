import { NextRequest, NextResponse } from "next/server";
import { authenticate, applySessionCookie } from "@/lib/auth/middleware";
import { getUserById } from "@/lib/db/users";
import { getSessionById } from "@/lib/db/anonymous";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);

    if (auth.userId) {
      const user = await getUserById(auth.userId);
      return applySessionCookie(
        NextResponse.json({
          data: {
            authenticated: true,
            user,
            anonymous: false,
            questions_used: 0,
            questions_limit: 3,
          },
        }),
        auth
      );
    }

    const session = await getSessionById(auth.anonId!);
    return applySessionCookie(
      NextResponse.json({
        data: {
          authenticated: false,
          user: null,
          anonymous: true,
          questions_used: session?.questions_used ?? 0,
          questions_limit: 3,
        },
      }),
      auth
    );
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
