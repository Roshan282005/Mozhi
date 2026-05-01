'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, Plus, X, Upload, Save } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

const profileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  showLocation: z.boolean(),
  languagesSpoken: z.array(z.string()),
  styleTags: z.array(z.string()),
  sessionStyleDesc: z.string().max(200).optional(),
  demoSessionEnabled: z.boolean(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function CompanionProfileEditPage() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newLanguage, setNewLanguage] = useState('')
  const [newTag, setNewTag] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: 'Kavignar Selvi',
      bio: 'Award-winning Tamil poet with over 20 years of experience in classical and contemporary Tamil literature.',
      city: 'Chennai',
      country: 'India',
      showLocation: true,
      languagesSpoken: ['Tamil', 'English', 'Sanskrit'],
      styleTags: ['Poetry', 'Thirukkural', 'Literature'],
      sessionStyleDesc: 'Interactive sessions focused on deep understanding and appreciation.',
      demoSessionEnabled: true,
    },
  })

  const languagesSpoken = watch('languagesSpoken') || []
  const styleTags = watch('styleTags') || []

  const addLanguage = () => {
    if (newLanguage.trim() && !languagesSpoken.includes(newLanguage.trim())) {
      setValue('languagesSpoken', [...languagesSpoken, newLanguage.trim()])
      setNewLanguage('')
    }
  }

  const removeLanguage = (lang: string) => {
    setValue('languagesSpoken', languagesSpoken.filter((l) => l !== lang))
  }

  const addTag = () => {
    if (newTag.trim() && !styleTags.includes(newTag.trim())) {
      setValue('styleTags', [...styleTags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tag: string) => {
    setValue('styleTags', styleTags.filter((t) => t !== tag))
  }

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    setSuccess(false)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      console.error('Failed to save profile')
    } finally {
      setIsLoading(false)
    }
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
            <Link href="/profile/edit" className="text-sm font-medium text-primary">
              Edit Profile
            </Link>
            <Link href="/availability" className="text-sm font-medium text-muted-foreground hover:text-foreground">
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
          <h1 className="text-3xl font-serif font-bold mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Manage your public profile information and preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {success && (
            <Alert className="border-green-500 bg-green-50 text-green-800">
              <AlertDescription>Profile saved successfully!</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload a photo to help explorers recognize you.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  KS
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG up to 5MB
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>This information will be visible on your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  {...register('displayName')}
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  rows={4}
                  className={errors.bio ? 'border-destructive' : ''}
                />
                {errors.bio && (
                  <p className="text-sm text-destructive">{errors.bio.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {watch('bio')?.length || 0}/500 characters
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register('country')} />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Location</Label>
                  <p className="text-sm text-muted-foreground">
                    Display your city and country on your profile
                  </p>
                </div>
                <Switch {...register('showLocation')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Languages Spoken</CardTitle>
              <CardDescription>Select the languages you can conduct sessions in.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {languagesSpoken.map((lang) => (
                  <Badge key={lang} variant="secondary" className="gap-1 pr-1">
                    {lang}
                    <button
                      type="button"
                      onClick={() => removeLanguage(lang)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a language..."
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                />
                <Button type="button" variant="outline" onClick={addLanguage}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Style Tags</CardTitle>
              <CardDescription>Add tags to describe your cultural expertise.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {styleTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Suggestions: Poetry, Music, Dance, Storytelling, Philosophy, Thirukkural, Carnatic, Temple Arts, Folk Tales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Upload introduction and sample content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Introduction Video</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a video introducing yourself (max 2 minutes)
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sample Content</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload audio or video sample of your style
                  </p>
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sessionStyleDesc">Session Style Description</Label>
                <Textarea
                  id="sessionStyleDesc"
                  {...register('sessionStyleDesc')}
                  rows={3}
                  placeholder="Describe your session style and what explorers can expect..."
                />
                <p className="text-xs text-muted-foreground">
                  {watch('sessionStyleDesc')?.length || 0}/200 characters
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Demo Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow explorers to request a free 15-minute demo
                  </p>
                </div>
                <Switch {...register('demoSessionEnabled')} />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/companions/1">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
