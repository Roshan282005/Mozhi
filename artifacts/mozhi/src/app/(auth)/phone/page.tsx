

import { useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Phone } from 'lucide-react'

export default function PhoneLoginPage() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const sendOTP = async () => {
    if (!phone) {
      setError('Please enter your phone number')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, action: 'send' }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error?.message || 'Failed to send code')
        setIsLoading(false)
        return
      }

      setStep('verify')
    } catch {
      setError('Failed to send code')
    }
    setIsLoading(false)
  }

  const verifyOTP = async () => {
    if (!code) {
      setError('Please enter the verification code')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, action: 'verify', code }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error?.message || 'Invalid code')
        setIsLoading(false)
        return
      }

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch {
      setError('Verification failed')
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background">
      <header className="py-6">
        <div className="container">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="text-2xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-xl font-serif font-semibold text-foreground">Mozhi</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif flex items-center justify-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Login
            </CardTitle>
            <CardDescription>
              {step === 'phone' ? 'Enter your phone number to get started' : 'Enter the code sent to your phone'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === 'phone' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={sendOTP} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Send Code'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
                <Button className="w-full" onClick={verifyOTP} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Verify'
                  )}
                </Button>
                <Button
                  variant="link"
                  className="w-full"
                  onClick={() => {
                    setStep('phone')
                    setCode('')
                    setError(null)
                  }}
                >
                  Change phone number
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link href="/login" className="text-sm text-primary hover:underline">
              Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}