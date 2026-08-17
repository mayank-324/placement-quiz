import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signToken } from "@/lib/auth";
import { compare } from "bcryptjs";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Check if user exists
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();

        if (error || !user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Verify password
        let isPasswordValid = false;
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            // It's a bcrypted password
            isPasswordValid = await compare(password, user.password);
        } else {
            // Legacy plaintext fallback
            isPasswordValid = (user.password === password);
        }

        if (!isPasswordValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Generate JWT token
        const token = await signToken({ userId: user.id, role: user.role });

        let redirectTo = '/quiz';
        if (user.role === 'admin') {
            redirectTo = '/admin';
        } else {
             // Check if student has already attempted
             const { data: attempt } = await supabase
                 .from('attempts')
                 .select('id')
                 .eq('user_id', user.id)
                 .maybeSingle();

             if (attempt) {
                 redirectTo = '/thank-you';
             }
        }

        // Create response and set cookie
        const response = NextResponse.json({ success: true, redirectTo }, { status: 200 });
        
        response.cookies.set({
            name: "auth_token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
