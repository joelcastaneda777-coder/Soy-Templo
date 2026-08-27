import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const AUTH_ENTRY_PATHS = ["/auth/login", "/auth/registro"];

/** Refresca la sesión, protege admin y aplica onboarding a la app instalada. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const launchedFromPwa = request.nextUrl.searchParams.get("source") === "pwa";
  const isPwa = launchedFromPwa || request.cookies.get("soy_templo_pwa")?.value === "1";
  const onboardingDone = request.cookies.get("soy_templo_onboarding")?.value === "1";

  if (launchedFromPwa) {
    response.cookies.set("soy_templo_pwa", "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          const nextResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => nextResponse.cookies.set(name, value, options));
          if (isPwa) nextResponse.cookies.set("soy_templo_pwa", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 31536000 });
          response = nextResponse;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthFlowPath = path.startsWith("/auth/");
  const isAuthEntryPath = AUTH_ENTRY_PATHS.some((p) => path.startsWith(p));
  const isOnboarding = path.startsWith("/onboarding");
  const isApi = path.startsWith("/api/");

  if (isPwa && !isApi) {
    if (!user && !isAuthFlowPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.search = "";
      url.searchParams.set("next", "/onboarding");
      const redirectResponse = NextResponse.redirect(url);
      redirectResponse.cookies.set("soy_templo_pwa", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 31536000 });
      return redirectResponse;
    }

    if (user && !onboardingDone && !isOnboarding && !isAuthFlowPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (user && onboardingDone && isAuthEntryPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    const { data: isStaff } = await supabase.rpc("is_staff");
    if (!isStaff) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
