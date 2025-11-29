import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const state = searchParams.get("state")

  let baseUrl = request.nextUrl.origin

  // Decode state to get the original redirect URI
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64").toString())
      if (decoded.baseUrl) {
        baseUrl = decoded.baseUrl
      }
    } catch (e) {
      console.error("Error decoding state:", e)
    }
  }

  if (error) {
    return NextResponse.redirect(new URL("/profile?error=" + error, baseUrl))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/profile?error=no_code", baseUrl))
  }

  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  const redirectUri = `${baseUrl}/api/auth/callback`

  console.log("[v0] Exchange token with redirect_uri:", redirectUri)

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    })

    const data = await response.json()

    console.log("[v0] Token response status:", response.status)

    if (!response.ok) {
      console.error("[v0] Token error:", data)
      return NextResponse.redirect(
        new URL(
          `/profile?error=token_error&details=${encodeURIComponent(data.error_description || data.error)}`,
          baseUrl,
        ),
      )
    }

    // Redirect to profile page with token
    const redirectUrl = new URL("/profile", baseUrl)
    redirectUrl.searchParams.set("access_token", data.access_token)
    redirectUrl.searchParams.set("refresh_token", data.refresh_token || "")
    redirectUrl.searchParams.set("expires_in", data.expires_in)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Error exchanging code for token:", error)
    return NextResponse.redirect(new URL("/profile?error=exchange_error", baseUrl))
  }
}
