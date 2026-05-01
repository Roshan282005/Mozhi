'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const { setUser, user } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      router.push(user.role === 'TEACHER' ? '/teacher' : '/dashboard')
      return
    }

    const timer = setTimeout(() => {
      if (!user) {
        setError('Sign in timed out. Please try again.')
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [user, router])

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive mb-4">{error}</p>
          <a href="/login" className="text-primary hover:underline">Back to Sign In</a>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Completing sign in...</p>
      </CardContent>
    </Card>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background">
      <Suspense fallback={<Card className="w-full max-w-md"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}