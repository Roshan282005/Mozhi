

import { useState } from 'react'
import { Link } from 'wouter'
import { useRouter } from '@/lib/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Phone, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { signInWithGoogle } from '@/lib/firebase'

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signInWithGoogle()

      if (result.error) {
        setError(result.error)
        setIsLoading(false)
        return
      }

      if (result.user) {
        const response = await fetch('/api/auth/firebase-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: result.user.idToken,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            userType,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          setError(data.error?.message || 'Login failed')
          setIsLoading(false)
          return
        }

        setUser(data.data)
        router.push(userType === 'teacher' ? '/companion/profile/edit' : '/dashboard')
      }
    } catch (err: any) {
      setError('Google sign in failed')
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('Attempting login with:', { email: data.email, userType })
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, userType }),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Login error response:', errorText)
        setError(`Server error: ${response.status}`)
        setIsLoading(false)
        return
      }

      const result = await response.json()
      console.log('Login result:', result)

      if (!result.success) {
        setError(result.error?.message || 'Login failed')
        setIsLoading(false)
        return
      }

      setUser(result.data)
      router.push(userType === 'teacher' ? '/companion/profile/edit' : '/dashboard')
    } catch (err: any) {
      console.error('Login exception:', err)
      setError(err.message || 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const userTypeLabel = userType === 'student' ? 'Student' : 'Teacher'

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
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="hidden lg:block">
            <style>{`
              .macbook { width: 320px; height: 200px; position: relative; perspective: 800px; }
              .macbook-shadow { position: absolute; width: 140px; height: 0px; left: 90px; top: 330px; transform: rotateX(80deg); box-shadow: 0 0 80px 50px rgba(0,0,0,0.25); animation: shadow-anim 6s ease infinite; }
              .macbook-inner { z-index: 20; position: absolute; width: 320px; height: 200px; transform-style: preserve-3d; transform: rotateX(-15deg) rotateY(0deg); animation: rotate-anim 6s ease infinite; }
              .screen { width: 320px; height: 200px; position: absolute; left: 0; bottom: 0; border-radius: 12px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); transform-style: preserve-3d; box-shadow: inset 0 2px 10px rgba(255,255,255,0.1); }
              .screen-lid { width: 320px; height: 200px; position: absolute; left: 0; bottom: 0; border-radius: 12px; background: linear-gradient(135deg, #2d3436 0%, #1e272e 100%); transform-style: preserve-3d; transform-origin: bottom; animation: lid-swing 6s ease infinite; }
              .camera { width: 6px; height: 6px; border-radius: 50%; background: #0a0a0a; position: absolute; left: 50%; top: 8px; margin-left: -3px; border: 1px solid #333; }
              .display { width: 280px; height: 160px; margin: 24px auto; background: linear-gradient(135deg, #667eea22 0%, #764ba222 100%); border-radius: 4px; position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
              .display-wallpaper { position: absolute; inset: 0; background: linear-gradient(135deg, #C0572B 0%, #D4A847 50%, #2D5A3D 100%); opacity: 0.9; }
              .display-logo { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
              .display-logo-text { font-family: serif; font-size: 28px; font-weight: bold; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
              .keyboard { width: 300px; height: 90px; position: absolute; left: 10px; bottom: -20px; border-radius: 8px; background: linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%); transform: rotateX(-90deg); transform-origin: top; box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
              .keyboard-keys { display: flex; flex-wrap: wrap; gap: 4px; padding: 10px; justify-content: center; }
              .key { width: 12px; height: 12px; background: #2d3436; border-radius: 2px; box-shadow: 0 -2px 0 #1e272e; animation: key-press 6s ease infinite; }
              .key.space { width: 80px; }
              .notch { width: 50px; height: 8px; background: #1e272e; border-radius: 0 0 8px 8px; margin: 0 auto; position: relative; top: -4px; }
              @keyframes rotate-anim { 0%,100% { transform: rotateX(-15deg) rotateY(0deg); } 25% { transform: rotateX(-10deg) rotateY(-15deg); } 50% { transform: rotateX(-20deg) rotateY(10deg); } 75% { transform: rotateX(-10deg) rotateY(-5deg); } }
              @keyframes shadow-anim { 0%,100% { box-shadow: 0 0 80px 50px rgba(0,0,0,0.25); } 50% { box-shadow: 0 0 100px 60px rgba(0,0,0,0.2); } }
              @keyframes lid-swing { 0%,100% { transform: rotateX(0deg); } 25% { transform: rotateX(10deg); } 50% { transform: rotateX(-5deg); } 75% { transform: rotateX(5deg); } }
              @keyframes key-press { 0%,100% { transform: translateY(0); } 10%,90% { transform: translateY(-2px); } }
            `}</style>
            
            <div className="macbook">
              <div className="macbook-inner">
                <div className="screen">
                  <div className="screen-lid">
                    <div className="camera"></div>
                    <div className="display">
                      <div className="display-wallpaper"></div>
                      <div className="display-logo">
                        <span className="display-logo-text">மொழி</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="keyboard">
                  <div className="notch"></div>
                  <div className="keyboard-keys">
                    {[...Array(15)].map((_, i) => <div key={i} className="key" style={{animationDelay: `${i * 0.1}s`}}></div>)}
                    <div className="key space" style={{animationDelay: `0.5s`}}></div>
                    {[...Array(6)].map((_, i) => <div key={i+16} className="key" style={{animationDelay: `${(i+16) * 0.1}s`}}></div>)}
                  </div>
                </div>
              </div>
              <div className="macbook-shadow"></div>
            </div>
          </div>

          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-serif">Welcome Back</CardTitle>
              <CardDescription>Sign in to continue your Tamil cultural journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={userType === 'student' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setUserType('student')}
                >
                  <BookOpen className="h-4 w-4" />
                  Student
                </Button>
                <Button
                  type="button"
                  variant={userType === 'teacher' ? 'default' : 'outline'}
                  className="flex-1 gap-2"
                  onClick={() => setUserType('teacher')}
                >
                  <Phone className="h-4 w-4" />
                  Teacher
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">Forgot?</Link>
                  </div>
                  <Input id="password" type="password" placeholder="Enter password" {...register('password')} className={errors.password ? 'border-destructive' : ''} />
                  {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in as {userTypeLabel}...</> : `Sign In as ${userTypeLabel}`}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full" type="button" onClick={handleGoogleSignIn} disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="w-full" type="button" asChild>
                  <Link href="/phone">
                    <Phone className="mr-2 h-4 w-4" />
                    Phone
                  </Link>
                </Button>
              </div>
            </CardContent>
            <CardFooter className="justify-center">
              <p className="text-sm text-muted-foreground">
                {userType === 'student' 
                  ? <>Don't have a student account? <Link href="/register" className="text-primary hover:underline font-medium">Sign up as Student</Link></>
                  : <>Want to teach? <Link href="/register?userType=teacher" className="text-primary hover:underline font-medium">Apply as Teacher</Link></>
                }
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}