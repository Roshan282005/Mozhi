'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  MessageCircle,
  Settings,
  Send,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mockSession = {
  id: '1',
  title: 'Tamil Poetry & Thirukkural Discussion',
  companionName: 'Kavignar Selvi',
  scheduledAt: new Date().toISOString(),
  durationMins: 60,
  status: 'in_progress',
}

const mockMessages = [
  {
    id: '1',
    sender: 'companion',
    senderName: 'Kavignar Selvi',
    body: 'Welcome! Ready to explore the beauty of Thirukkural?',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    sender: 'explorer',
    senderName: 'You',
    body: 'Yes! I\'ve been wanting to understand the deeper meanings.',
    createdAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    sender: 'companion',
    senderName: 'Kavignar Selvi',
    body: 'Wonderful! Let\'s start with Chapter 1 - The Praise of God',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
]

export default function SessionRoomPage() {
  const params = useParams()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState(mockMessages)
  const [timeRemaining, setTimeRemaining] = useState(60 * 60)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'explorer',
        senderName: 'You',
        body: message,
        createdAt: new Date().toISOString(),
      },
    ])
    setMessage('')
  }

  const formatMessageTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={cn(
      "h-screen flex flex-col bg-gray-900",
      isFullscreen ? "fixed inset-0 z-50" : ""
    )}>
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-medium truncate max-w-md">
            {mockSession.title}
          </h1>
          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
            {formatTime(timeRemaining)} remaining
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
          <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => setIsChatOpen(true)}>
                <MessageCircle className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[400px] flex flex-col p-0">
              <CardHeader className="px-4 py-3 border-b">
                <CardTitle className="text-lg">Chat</CardTitle>
              </CardHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col",
                      msg.sender === 'explorer' ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {msg.senderName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[80%]",
                        msg.sender === 'explorer'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm">{msg.body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                  <Button size="icon" onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl aspect-video bg-gray-800 rounded-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarFallback className="bg-primary/20 text-primary text-4xl font-semibold">
                  {mockSession.companionName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {mockSession.companionName}
              </h2>
              <p className="text-gray-400">Waiting for video stream...</p>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-700 rounded-lg border-2 border-gray-600 overflow-hidden flex items-center justify-center">
            {isVideoOff ? (
              <div className="text-center">
                <VideoOff className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Camera Off</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Your video</p>
            )}
          </div>
        </div>
      </main>

      <footer className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center gap-4 shrink-0">
        <Button
          variant={isMuted ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <MicOff className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant={isVideoOff ? "destructive" : "secondary"}
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={() => setIsVideoOff(!isVideoOff)}
        >
          {isVideoOff ? (
            <VideoOff className="h-6 w-6" />
          ) : (
            <Video className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          className="rounded-full h-14 w-14"
        >
          <Phone className="h-6 w-6 rotate-[135deg]" />
        </Button>
      </footer>
    </div>
  )
}
