import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.length} chars)` : "NOT SET",
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN ? `set (${process.env.REPLICATE_API_TOKEN.length} chars)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  })
}
