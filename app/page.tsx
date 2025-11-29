"use client"

import { useState, useEffect } from "react"
import { Download, Music2, Loader2, GripVertical, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Track {
  id: string
  name: string
  artist: string
  album: string
  imageUrl: string
}

function SortableTrackItem({
  track,
  index,
  onRemove,
}: {
  track: Track | null
  index: number
  onRemove: (index: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `track-${index}`,
    disabled: !track,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border-2 transition-all",
        track ? "bg-[#2a2a2a] border-[#c4ff0d]" : "bg-[#1a1a1a] border-[#333] border-dashed",
        isDragging && "opacity-50 scale-105 z-50",
      )}
    >
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#c4ff0d] text-black flex items-center justify-center font-bold text-sm shrink-0">
        {index + 1}
      </div>
      {track ? (
        <>
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </div>
          <img
            src={track.imageUrl || "/placeholder.svg"}
            alt={track.name}
            className="w-10 h-10 md:w-12 md:h-12 rounded shrink-0 object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium line-clamp-1 text-sm md:text-base">{track.name}</p>
            <p className="text-gray-400 text-xs md:text-sm line-clamp-1">{track.artist}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-300 hover:bg-red-950 shrink-0 text-xs md:text-sm"
          >
            ลบ
          </Button>
        </>
      ) : (
        <p className="text-gray-500 text-xs md:text-sm ml-2">คลิกเพลงจากผลการค้นหาเพื่อเพิ่ม</p>
      )}
    </div>
  )
}

export default function PlaylistGenerator() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [selectedTracks, setSelectedTracks] = useState<(Track | null)[]>(Array(12).fill(null))
  const [isSearching, setIsSearching] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<string>("")

  useEffect(() => {
    getAccessToken()
  }, [])

  const getAccessToken = async () => {
    try {
      const response = await fetch("/api/spotify/token")
      const data = await response.json()
      if (data.access_token) {
        setAccessToken(data.access_token)
      }
    } catch (error) {
      console.error("Error getting access token:", error)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim() || !accessToken) {
      setSearchResults([])
      setIsTyping(false)
      return
    }

    setIsTyping(true)

    const timeoutId = setTimeout(() => {
      searchTracks()
      setIsTyping(false)
    }, 1500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, accessToken])

  const searchTracks = async () => {
    if (!searchQuery.trim() || !accessToken) return

    setIsSearching(true)

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      const data = await response.json()
      const tracks: Track[] = data.tracks.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        artist: item.artists[0].name,
        album: item.album.name,
        imageUrl: item.album.images[0]?.url || "",
      }))

      setSearchResults(tracks)
    } catch (error) {
      console.error("Error searching tracks:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const addTrack = (track: Track) => {
    const emptyIndex = selectedTracks.findIndex((t) => t === null)
    if (emptyIndex !== -1) {
      const newTracks = [...selectedTracks]
      newTracks[emptyIndex] = track
      setSelectedTracks(newTracks)
      setSearchResults([])
      setSearchQuery("")
    }
  }

  const removeTrack = (index: number) => {
    const newTracks = [...selectedTracks]
    newTracks[index] = null
    setSelectedTracks(newTracks)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = Number.parseInt(active.id.toString().replace("track-", ""))
      const newIndex = Number.parseInt(over.id.toString().replace("track-", ""))

      setSelectedTracks((tracks) => arrayMove(tracks, oldIndex, newIndex))
    }
  }

  const generateImage = async () => {
    setIsGenerating(true)
    setDownloadStatus("กำลังโหลดเทมเพลต...")

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      setIsGenerating(false)
      return
    }

    canvas.width = 1080
    canvas.height = 1350

    const templateImg = new Image()
    templateImg.crossOrigin = "anonymous"
    templateImg.src = "/template.jpg"

    templateImg.onload = async () => {
      setDownloadStatus("กำลังวาดเทมเพลต...")

      ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)

      ctx.save()

      const centerX = 540
      const centerY = 600
      ctx.translate(centerX, centerY)
      ctx.rotate((-3.8 * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)

      setDownloadStatus("กำลังโหลดภาพปกอัลบั้ม...")

      const imagePromises = selectedTracks.map(async (track) => {
        if (!track) return null
        const img = new Image()
        img.crossOrigin = "anonymous"
        return new Promise<HTMLImageElement | null>((resolve) => {
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = track.imageUrl
        })
      })

      const loadedImages = await Promise.all(imagePromises)

      setDownloadStatus("กำลังสร้างรายการเพลง...")

      await document.fonts.load("600 20px Kanit")
      await document.fonts.load("400 16px Kanit")

      const startX = 200
      const startY = 340
      const lineHeight = 70
      const imageSize = 50
      const columnGap = 340
      const textX = imageSize + 12
      const cornerRadius = 6

      const drawRoundedImage = (
        img: HTMLImageElement,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
      ) => {
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.clip()
        ctx.drawImage(img, x, y, width, height)
        ctx.restore()
      }

      for (let i = 0; i < selectedTracks.length; i++) {
        const track = selectedTracks[i]
        const column = i < 6 ? 0 : 1
        const row = i < 6 ? i : i - 6
        const x = startX + column * columnGap
        const y = startY + row * lineHeight

        if (track && loadedImages[i]) {
          drawRoundedImage(loadedImages[i]!, x, y - imageSize / 2, imageSize, imageSize, cornerRadius)

          ctx.fillStyle = "#1a1a1a"
          ctx.font = "600 17px Kanit"

          const songName = track.name
          const maxWidth = 250
          let displayName = songName

          if (ctx.measureText(songName).width > maxWidth) {
            while (ctx.measureText(displayName + "...").width > maxWidth && displayName.length > 0) {
              displayName = displayName.slice(0, -1)
            }
            displayName += "..."
          }

          ctx.fillText(displayName, x + textX, y - 5)

          ctx.font = "400 14px Kanit"
          ctx.fillStyle = "#666"
          let artistName = track.artist
          if (ctx.measureText(artistName).width > maxWidth) {
            while (ctx.measureText(artistName + "...").width > maxWidth && artistName.length > 0) {
              artistName = artistName.slice(0, -1)
            }
            artistName += "..."
          }
          ctx.fillText(artistName, x + textX, y + 14)
        }
      }

      ctx.restore()

      setDownloadStatus("กำลังดาวน์โหลด...")

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "my-playlist.png"
          a.click()
          URL.revokeObjectURL(url)

          setDownloadStatus("ดาวน์โหลดเสร็จสิ้น!")
          setTimeout(() => {
            setDownloadStatus("")
            setIsGenerating(false)
          }, 2000)
        }
      })
    }

    templateImg.onerror = () => {
      setDownloadStatus("เกิดข้อผิดพลาดในการโหลดเทมเพลต")
      setIsGenerating(false)
    }
  }

  const selectedCount = selectedTracks.filter((t) => t !== null).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#2a2a2a]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-end mb-4">
          <Link href="/profile">
            <Button variant="outline" className="bg-[#1a1a1a] border-[#333] hover:bg-[#2a2a2a] text-white">
              <User className="w-4 h-4 mr-2" />
              โปรไฟล์ Spotify
            </Button>
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music2 className="w-10 h-10 md:w-12 md:h-12 text-[#c4ff0d]" />
            <h1 className="text-3xl md:text-5xl font-bold text-white">สร้าง Playlist ของคุณ</h1>
          </div>
          <p className="text-lg md:text-xl text-gray-400">เลือก 12 เพลงจาก Spotify และสร้างเป็นภาพสวยๆ</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-6">
            <Card className="p-4 md:p-6 bg-[#1a1a1a] border-[#333]">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">ค้นหาเพลง</h2>

              <div className="text-sm text-gray-400 mb-3">เลือกแล้ว: {selectedCount}/12 เพลง</div>

              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="ค้นหาชื่อเพลง หรือศิลปิน..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#2a2a2a] border-[#444] text-white placeholder:text-gray-500"
                />
              </div>

              {(isTyping || isSearching) && (
                <div className="space-y-2 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
                      <Skeleton className="w-12 h-12 rounded shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isTyping && !isSearching && searchResults.length > 0 && (
                <div className="space-y-2 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#2a2a2a]">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors cursor-pointer"
                      onClick={() => addTrack(track)}
                    >
                      <img
                        src={track.imageUrl || "/placeholder.svg"}
                        alt={track.name}
                        className="w-12 h-12 rounded shrink-0 object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium line-clamp-1">{track.name}</p>
                        <p className="text-gray-400 text-sm line-clamp-1">{track.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-4 md:p-6 bg-[#1a1a1a] border-[#333]">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-4">เพลงที่เลือก</h2>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={selectedTracks.map((_, i) => `track-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 mb-6 max-h-[400px] md:max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-[#1a1a1a]">
                    {selectedTracks.map((track, index) => (
                      <SortableTrackItem key={`track-${index}`} track={track} index={index} onRemove={removeTrack} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Button
                onClick={generateImage}
                disabled={selectedCount !== 12 || isGenerating}
                className="w-full bg-[#c4ff0d] text-black hover:bg-[#b0e600] font-bold text-base md:text-lg py-5 md:py-6"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    กำลังสร้างภาพ...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    ดาวน์โหลดภาพ Playlist
                  </>
                )}
              </Button>

              {downloadStatus && (
                <p className="text-center text-[#c4ff0d] text-sm mt-3 font-medium animate-pulse">{downloadStatus}</p>
              )}

              {selectedCount !== 12 && !isGenerating && (
                <p className="text-center text-gray-400 text-sm mt-2">กรุณาเลือกครบ 12 เพลงก่อนดาวน์โหลด</p>
              )}
            </Card>
          </div>
        </div>

        <Card className="mt-6 md:mt-8 p-4 md:p-6 bg-[#1a1a1a] border-[#333]">
          <h3 className="text-lg md:text-xl font-bold text-white mb-3">วิธีใช้งาน</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-gray-300">
            <li>ค้นหาเพลงที่ต้องการโดยพิมพ์ชื่อเพลงหรือศิลปิน</li>
            <li>คลิกเพลงจากผลการค้นหาเพื่อเพิ่มเข้าสู่รายการ</li>
            <li>ลากเพื่อเปลี่ยนตำแหน่งเพลงในรายการ</li>
            <li>เลือกครบ 12 เพลง</li>
            <li>กดปุ่ม "ดาวน์โหลดภาพ Playlist" เพื่อสร้างและดาวน์โหลดภาพ</li>
          </ol>
        </Card>
      </div>
    </div>
  )
}
