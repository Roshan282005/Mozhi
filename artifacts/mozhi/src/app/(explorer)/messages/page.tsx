

import { useState } from 'react'
import { Link } from 'wouter'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Send, Search } from 'lucide-react'

const mockConversations = [
  {
    id: '1',
    companion: { id: '1', displayName: 'Kavignar Selvi', avatarUrl: '' },
    lastMessage: 'Looking forward to our next session on Tamil poetry!',
    unread: true,
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    companion: { id: '3', displayName: 'Meenakshi Ammal', avatarUrl: '' },
    lastMessage: "I've prepared some folk tales for our session.",
    unread: false,
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

const mockMessages = [
  { id: '1', sender: 'companion', body: 'Welcome to our session! Ready to explore Thirukkural?', createdAt: '10:00 AM' },
  { id: '2', sender: 'explorer', body: "Yes! I've been meaning to understand the deeper meanings.", createdAt: '10:01 AM' },
  { id: '3', sender: 'companion', body: "Wonderful! Let's start with Chapter 1 - The Praise of God", createdAt: '10:02 AM' },
]

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState(mockConversations[0])
  const [message, setMessage] = useState('')

  const formatTime = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diff = now.getTime() - then.getTime()
    const hours = diff / (1000 * 60 * 60)
    if (hours < 24) return then.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleSend = () => {
    if (!message.trim()) return
    setMessage('')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-xl font-serif font-semibold text-foreground">Mozhi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link href="/sessions" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sessions</Link>
            <Link href="/subscriptions" className="text-sm font-medium text-muted-foreground hover:text-foreground">Subscriptions</Link>
          </nav>
          <Button variant="ghost" asChild><Link href="/login">Sign out</Link></Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Messages</h1>
            <p className="text-muted-foreground">Chat with your companions.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          <div className="lg:col-span-1 space-y-2 overflow-y-auto">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-9" />
            </div>
            {mockConversations.map((conv) => (
              <Card 
                key={conv.id} 
                className={`cursor-pointer hover:border-primary transition-colors ${selectedConv.id === conv.id ? 'border-primary' : ''}`}
                onClick={() => setSelectedConv(conv)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conv.companion.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {conv.companion.displayName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`font-medium truncate ${conv.unread ? 'text-primary' : ''}`}>
                          {conv.companion.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatTime(conv.updatedAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unread && <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2 flex flex-col border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-card">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConv.companion.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedConv.companion.displayName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{selectedConv.companion.displayName}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'explorer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-lg px-4 py-2 ${msg.sender === 'explorer' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm">{msg.body}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'explorer' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.createdAt}
                    </p>
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button size="icon" onClick={handleSend}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}