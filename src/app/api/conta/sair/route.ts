import { NextResponse } from "next/server";
import { apagarCookieConta } from "@/lib/conta";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  apagarCookieConta(res);
  return res;
}
