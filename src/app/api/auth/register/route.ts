import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { createUser, getUserById } from "@/lib/db/users";

export async function POST(req: NextRequest) {
  try {
    // Verify Bearer token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authorization required" } },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const {
      data: { user: verifiedUser },
      error: authError,
    } = await db.auth.getUser(token);

    if (authError || !verifiedUser) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid token" } },
        { status: 401 }
      );
    }

    const { id, email, display_name } = await req.json();

    if (!id || !email) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "id and email are required" } },
        { status: 400 }
      );
    }

    // Verify the token owner matches the requested id
    if (verifiedUser.id !== id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Token does not match user id" } },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existing = await getUserById(id);
    if (existing) {
      return NextResponse.json({ data: { id: existing.id } });
    }

    const user = await createUser({ id, email, display_name });
    return NextResponse.json({ data: { id: user.id } }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: (e as Error).message } },
      { status: 500 }
    );
  }
}
