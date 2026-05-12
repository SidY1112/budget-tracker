import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Supabase requires middleware to refresh the session cookie on every matching request —
// without this, the session can expire mid-visit even if the user is active
function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // Writes updated cookies to both the request and the response so the refreshed
        // session token is forwarded to the server component and sent back to the browser
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response }
}

// Guards dashboard routes and prevents authenticated users from reaching auth pages
export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request)

  // getUser() hits the Supabase auth server to verify the token — more secure than
  // reading the session from the cookie directly, which can be spoofed
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Unauthenticated users have no session, so send them to login instead of a broken dashboard
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Showing the login/signup forms to an already-authenticated user would be confusing
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Return the Supabase response (not a plain NextResponse.next()) to preserve any
  // cookie updates Supabase wrote during session refresh
  return response
}

export const config = {
  // Limit middleware to only the routes that need auth checks — running on every
  // route (including static assets) would add unnecessary latency
  matcher: ['/dashboard/:path*', '/login', '/signup'],
}
