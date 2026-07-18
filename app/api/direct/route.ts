import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    ok: true,
    result: {
      idea: body.idea ?? "",
      blueprint: "Luxury Editorial",
      camera: "85mm Portrait",
      lighting: "Soft Key",
      composition: "Medium Shot",
      aspectRatio: "4:5"
    }
  });
}
