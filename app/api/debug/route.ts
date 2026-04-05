import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    EMAIL_USER: process.env.EMAIL_USER ? "設定済み" : "未設定",
    EMAIL_PASS: process.env.EMAIL_PASS ? "設定済み" : "未設定",
  });
}
