

import { Link } from 'wouter'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md">
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-bold mb-4">You're Offline</h1>
        <p className="text-muted-foreground mb-6">
          It looks like you've lost your internet connection. 
          Some content may still be available from your offline downloads.
        </p>
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}