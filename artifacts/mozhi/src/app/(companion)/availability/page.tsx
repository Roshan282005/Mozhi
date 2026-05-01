

import { useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Trash2, Save, Clock } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const TIMES = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
]

interface Slot {
  id: string
  dayOfWeek: number
  startTime: string
  durationMins: 30 | 60
  timezone: string
  isActive: boolean
}

const mockSlots: Slot[] = [
  { id: '1', dayOfWeek: 1, startTime: '10:00', durationMins: 60, timezone: 'Asia/Kolkata', isActive: true },
  { id: '2', dayOfWeek: 1, startTime: '14:00', durationMins: 60, timezone: 'Asia/Kolkata', isActive: true },
  { id: '3', dayOfWeek: 3, startTime: '09:00', durationMins: 60, timezone: 'Asia/Kolkata', isActive: true },
  { id: '4', dayOfWeek: 5, startTime: '11:00', durationMins: 30, timezone: 'Asia/Kolkata', isActive: true },
  { id: '5', dayOfWeek: 6, startTime: '10:00', durationMins: 60, timezone: 'Asia/Kolkata', isActive: true },
  { id: '6', dayOfWeek: 6, startTime: '14:00', durationMins: 60, timezone: 'Asia/Kolkata', isActive: true },
]

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>(mockSlots)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: '1',
    startTime: '10:00',
    durationMins: '60' as '30' | '60',
  })

  const addSlot = () => {
    const newSlotItem: Slot = {
      id: Date.now().toString(),
      dayOfWeek: parseInt(newSlot.dayOfWeek),
      startTime: newSlot.startTime,
      durationMins: parseInt(newSlot.durationMins) as 30 | 60,
      timezone: 'Asia/Kolkata',
      isActive: true,
    }
    setSlots([...slots, newSlotItem])
  }

  const removeSlot = (id: string) => {
    setSlots(slots.filter((s) => s.id !== id))
  }

  const toggleSlot = (id: string) => {
    setSlots(slots.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s)))
  }

  const onSubmit = async () => {
    setIsLoading(true)
    setSuccess(false)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      console.error('Failed to save availability')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const groupedSlots = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    slots: slots.filter((s) => s.dayOfWeek === index),
  })).filter((g) => g.slots.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-xl font-serif font-semibold text-foreground">Mozhi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/profile/edit" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Edit Profile
            </Link>
            <Link href="/availability" className="text-sm font-medium text-primary">
              Availability
            </Link>
            <Link href="/subscribers" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Subscribers
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign out</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2">Availability</h1>
          <p className="text-muted-foreground">
            Set your weekly recurring availability for sessions with explorers.
          </p>
        </div>

        {success && (
          <Alert className="border-green-500 bg-green-50 text-green-800 mb-6">
            <AlertDescription>Availability saved successfully!</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Slot
            </CardTitle>
            <CardDescription>
              Create a recurring weekly time slot for sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 min-w-[150px]">
                <Label>Day</Label>
                <Select
                  value={newSlot.dayOfWeek}
                  onValueChange={(v) => v && setNewSlot({ ...newSlot, dayOfWeek: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, i) => (
                      <SelectItem key={day} value={i.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-[150px]">
                <Label>Start Time</Label>
                <Select
                  value={newSlot.startTime}
                  onValueChange={(v) => v && setNewSlot({ ...newSlot, startTime: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMES.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-[120px]">
                <Label>Duration</Label>
                <Select
                  value={newSlot.durationMins}
                  onValueChange={(v) => v && setNewSlot({ ...newSlot, durationMins: v as '30' | '60' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={addSlot} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Slot
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Your current availability. Toggle slots to enable/disable them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groupedSlots.length > 0 ? (
              <div className="space-y-6">
                {groupedSlots.map(({ day, dayIndex, slots: daySlots }) => (
                  <div key={dayIndex}>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      {day}
                      <Badge variant="secondary">{daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            slot.isActive ? 'bg-card' : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Clock className={`h-5 w-5 ${slot.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div>
                              <p className={`font-medium ${!slot.isActive ? 'text-muted-foreground line-through' : ''}`}>
                                {formatTime(slot.startTime)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {slot.durationMins} minutes · IST
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSlot(slot.id)}
                              className={slot.isActive ? 'text-primary' : 'text-muted-foreground'}
                            >
                              {slot.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSlot(slot.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No availability slots set</p>
                <p className="text-sm text-muted-foreground">
                  Add slots above to start accepting session bookings.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end mt-6">
          <Button onClick={onSubmit} disabled={isLoading} size="lg" className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Availability
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
