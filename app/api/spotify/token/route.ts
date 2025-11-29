import { NextResponse } from "next/server"

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Missing Spotify credentials" }, { status: 500 })
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
      },
      body: "grant_type=client_credentials",
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to get access token" }, { status: response.status })
    }

    return NextResponse.json({ access_token: data.access_token, expires_in: data.expires_in })
  } catch (error) {
    console.error("Error getting access token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
