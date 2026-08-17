import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (!payload) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user: payload }, { status: 200 });
}
