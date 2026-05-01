

import { Suspense, useState } from 'react'
import { Link } from 'wouter'
import { useRouter, useSearchParams } from '@/lib/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Users, BookOpen } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { signInWithGoogle } from '@/lib/firebase'

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const studentSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const teacherSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  bio: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type StudentForm = z.infer<typeof studentSchema>
type TeacherForm = z.infer<typeof teacherSchema>

function RegisterFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userType, setUserType] = useState<'student' | 'teacher'>(searchParams.get('userType') === 'teacher' ? 'teacher' : 'student')

  const studentForm = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  })

  const teacherForm = useForm<TeacherForm>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', displayName: '', bio: '', city: '', country: '' },
  })

  const handleGoogleSignUp = async () => {
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
          setError(data.error?.message || 'Registration failed')
          setIsLoading(false)
          return
        }

        setUser(data.data)
        router.push(userType === 'teacher' ? '/companion/profile/edit' : '/dashboard')
      }
    } catch (err: any) {
      setError('Google sign up failed')
      setIsLoading(false)
    }
  }

  const onSubmit = async () => {
    setIsLoading(true)
    setError(null)

    const formData = userType === 'student' ? studentForm.getValues() : teacherForm.getValues()
    const payload = {
      ...formData,
      userType,
      confirmPassword: undefined,
      languagesSpoken: userType === 'teacher' ? ['Tamil'] : undefined,
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!result.success) {
      setError(result.error?.message || 'Registration failed')
      setIsLoading(false)
      return
    }

    setUser(result.data)
    router.push(userType === 'teacher' ? '/companion/profile/edit' : '/dashboard')
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif">Create Your Account</CardTitle>
        <CardDescription>Join Mozhi and start your Tamil cultural journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Button
            type="button"
            variant={userType === 'student' ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => setUserType('student')}
          >
            <Users className="h-4 w-4" />
            Student
          </Button>
          <Button
            type="button"
            variant={userType === 'teacher' ? 'default' : 'outline'}
            className="flex-1 gap-2"
            onClick={() => setUserType('teacher')}
          >
            <BookOpen className="h-4 w-4" />
            Teacher
          </Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
          {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

          {userType === 'student' ? (
            <div className="space-y-2">
              <Label htmlFor="student-fullName">Full Name</Label>
              <Input id="student-fullName" placeholder="Priya Ramanathan" {...studentForm.register('fullName')} className={studentForm.formState.errors.fullName ? 'border-destructive' : ''} />
              {studentForm.formState.errors.fullName && <p className="text-sm text-destructive">{studentForm.formState.errors.fullName.message}</p>}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="teacher-fullName">Full Name</Label>
                <Input id="teacher-fullName" placeholder="Kavignar Selvi" {...teacherForm.register('fullName')} className={teacherForm.formState.errors.fullName ? 'border-destructive' : ''} />
                {teacherForm.formState.errors.fullName && <p className="text-sm text-destructive">{teacherForm.formState.errors.fullName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-displayName">Display Name</Label>
                <Input id="teacher-displayName" placeholder="How you'll appear to students" {...teacherForm.register('displayName')} className={teacherForm.formState.errors.displayName ? 'border-destructive' : ''} />
                {teacherForm.formState.errors.displayName && <p className="text-sm text-destructive">{teacherForm.formState.errors.displayName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="teacher-bio">Bio (optional)</Label>
                <Input id="teacher-bio" placeholder="Tell us about yourself" {...teacherForm.register('bio')} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="teacher-city">City</Label>
                  <Input id="teacher-city" placeholder="City" {...teacherForm.register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacher-country">Country</Label>
                  <Input id="teacher-country" placeholder="Country" {...teacherForm.register('country')} />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              {...(userType === 'student' ? studentForm.register('email') : teacherForm.register('email'))} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="At least 8 characters" 
              {...(userType === 'student' ? studentForm.register('password') : teacherForm.register('password'))} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="Confirm password" 
              {...(userType === 'student' ? studentForm.register('confirmPassword') : teacherForm.register('confirmPassword'))} 
            />
          </div>

          {userType === 'teacher' && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Your profile will be reviewed before going live. Teachers need approval to receive students.</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : `Create ${userType === 'student' ? 'Student' : 'Teacher'} Account`}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
        </div>

        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link></p>
      </CardFooter>
    </Card>
  )
}

export default function RegisterPage() {
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
        <Suspense fallback={<Card className="w-full max-w-md"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></CardContent></Card>}>
          <RegisterFormContent />
        </Suspense>
      </main>
    </div>
  )
}