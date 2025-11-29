"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Music, Crown, User, Mail, Globe, ExternalLink, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Buffer } from "buffer"

interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images: { url: string }[]
  country: string
  product: string
  followers: { total: number }
  external_urls: { spotify: string }
}

export default function ProfilePage() {
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    // Check URL params for token or error
    const params = new URLSearchParams(window.location.search)
    const token = params.get("access_token")
    const errorParam = params.get("error")
    const details = params.get("details")

    if (errorParam) {
      setError(errorParam)
      setErrorDetails(details)
      setLoading(false)
      // Clear URL params
      window.history.replaceState({}, "", "/profile")
      return
    }

    if (token) {
      setAccessToken(token)
      // Clear URL params for security
      window.history.replaceState({}, "", "/profile")
      fetchUserProfile(token)
    } else {
      // Check localStorage for existing token
      const storedToken = localStorage.getItem("spotify_user_token")
      if (storedToken) {
        setAccessToken(storedToken)
        fetchUserProfile(storedToken)
      } else {
        setLoading(false)
      }
    }
  }, [])

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("spotify_user_token")
          setAccessToken(null)
          setLoading(false)
          return
        }
        throw new Error("Failed to fetch profile")
      }

      const userData = await response.json()
      setUser(userData)
      localStorage.setItem("spotify_user_token", token)
    } catch (err) {
      console.error("Error fetching profile:", err)
      setError("ไม่สามารถดึงข้อมูลโปรไฟล์ได้")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
    const baseUrl = window.location.origin
    const redirectUri = `${baseUrl}/api/auth/callback`
    const scopes = ["user-read-email", "user-read-private"]

    // Encode the baseUrl in state so we can use it in callback
    const state = Buffer.from(JSON.stringify({ baseUrl })).toString("base64")

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(" "))}&state=${encodeURIComponent(state)}`

    console.log("[v0] Redirecting to:", authUrl)
    console.log("[v0] Redirect URI:", redirectUri)

    window.location.href = authUrl
  }

  const handleLogout = () => {
    localStorage.removeItem("spotify_user_token")
    setAccessToken(null)
    setUser(null)
  }

  const isPremium = user?.product === "premium"

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">โปรไฟล์ Spotify</h1>
            <p className="text-muted-foreground">เชื่อมต่อบัญชี Spotify ของคุณ</p>
          </div>
        </div>

        {loading ? (
          // Loading skeleton
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : !accessToken ? (
          // Login card
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-[#1DB954] rounded-full flex items-center justify-center mb-4">
                <Music className="h-10 w-10 text-black" />
              </div>
              <CardTitle className="text-2xl">เชื่อมต่อ Spotify</CardTitle>
              <CardDescription>เข้าสู่ระบบด้วยบัญชี Spotify เพื่อตรวจสอบสถานะ Premium และดูโปรไฟล์ของคุณ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center">
                  <p>เกิดข้อผิดพลาด: {error}</p>
                  {errorDetails && <p className="mt-1 text-xs opacity-80">{errorDetails}</p>}
                </div>
              )}
              <Button
                onClick={handleLogin}
                className="w-full bg-[#1DB954] hover:bg-[#1ed760] text-black font-semibold h-12"
              >
                <Music className="mr-2 h-5 w-5" />
                เข้าสู่ระบบด้วย Spotify
              </Button>
              <p className="text-xs text-muted-foreground text-center">เราจะขอสิทธิ์ในการอ่านอีเมลและข้อมูลโปรไฟล์ของคุณเท่านั้น</p>
              <p className="text-xs text-muted-foreground/50 text-center break-all">
                Redirect URI: {typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback` : ""}
              </p>
            </CardContent>
          </Card>
        ) : user ? (
          // User profile card
          <div className="space-y-6">
            <Card className="bg-card border-border overflow-hidden">
              {/* Profile header with gradient */}
              <div className="h-24 bg-gradient-to-r from-[#1DB954] to-[#191414]" />

              <CardHeader className="relative pt-0">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12">
                  {/* Profile image */}
                  <div className="relative">
                    {user.images?.[0]?.url ? (
                      <Image
                        src={user.images[0].url || "/placeholder.svg"}
                        alt={user.display_name}
                        width={96}
                        height={96}
                        className="rounded-full border-4 border-card"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-card">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {isPremium && (
                      <div className="absolute -bottom-1 -right-1 bg-[#FFD700] rounded-full p-1">
                        <Crown className="h-4 w-4 text-black" />
                      </div>
                    )}
                  </div>

                  {/* Name and badge */}
                  <div className="text-center md:text-left flex-1">
                    <CardTitle className="text-2xl">{user.display_name}</CardTitle>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                      <Badge
                        variant={isPremium ? "default" : "secondary"}
                        className={isPremium ? "bg-[#FFD700] text-black hover:bg-[#FFD700]" : ""}
                      >
                        {isPremium ? (
                          <>
                            <Crown className="h-3 w-3 mr-1" />
                            Premium
                          </>
                        ) : (
                          "Free"
                        )}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {user.followers?.total?.toLocaleString()} ผู้ติดตาม
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Premium status card */}
                <div
                  className={`p-4 rounded-lg border ${isPremium ? "bg-[#FFD700]/10 border-[#FFD700]/30" : "bg-muted/50 border-border"}`}
                >
                  <div className="flex items-center gap-3">
                    {isPremium ? (
                      <CheckCircle className="h-6 w-6 text-[#FFD700]" />
                    ) : (
                      <XCircle className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold">{isPremium ? "คุณเป็นสมาชิก Premium" : "คุณใช้งานแบบ Free"}</p>
                      <p className="text-sm text-muted-foreground">
                        {isPremium ? "คุณสามารถเข้าถึงฟีเจอร์พิเศษทั้งหมดได้" : "อัปเกรดเป็น Premium เพื่อเข้าถึงฟีเจอร์เพิ่มเติม"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User info */}
                <div className="space-y-3">
                  {user.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.country && (
                    <div className="flex items-center gap-3 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>ประเทศ: {user.country}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>ID: {user.id}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => window.open(user.external_urls.spotify, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    เปิดใน Spotify
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={handleLogout}>
                    ออกจากระบบ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Back to playlist creator */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <Link href="/">
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Music className="h-4 w-4 mr-2" />
                    ไปสร้าง Playlist ของคุณ
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  )
}
