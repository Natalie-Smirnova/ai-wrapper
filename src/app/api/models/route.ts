import { NextResponse } from "next/server";
import { listModels } from "@/lib/llm/registry";

export async function GET() {
  return NextResponse.json({ data: listModels() });
}
