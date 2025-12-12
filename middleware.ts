import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return req.cookies.get(name)?.value;
                },
                set(name, value, options) {
                    res.cookies.set({ name, value, ...options });
                },
                remove(name, options) {
                    res.cookies.set({ name, value: "", ...options, maxAge: 0 });
                },
            },
        }
    );

    // This refreshes the auth session cookie if needed
    await supabase.auth.getUser();

    return res;
}

// Apply middleware to all routes except Next internals/static
export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};