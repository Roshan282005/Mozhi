'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, MapPin, Search, Filter, X } from 'lucide-react'

const mockCompanions = [
  {
    id: '1',
    displayName: 'Kavignar Selvi',
    city: 'Chennai',
    country: 'India',
    styleTags: ['Poetry', 'Thirukkural', 'Literature'],
    avgRating: 4.9,
    reviewCount: 47,
    priceFrom: 4,
    avatarUrl: '',
  },
  {
    id: '2',
    displayName: 'Muthusamy Iyer',
    city: 'Madurai',
    country: 'India',
    styleTags: ['Carnatic Music', 'Bhakti', 'Temple Traditions'],
    avgRating: 4.8,
    reviewCount: 62,
    priceFrom: 5,
    avatarUrl: '',
  },
  {
    id: '3',
    displayName: 'Meenakshi Ammal',
    city: 'Singapore',
    country: 'Singapore',
    styleTags: ['Storytelling', 'Folk Tales', 'Dance'],
    avgRating: 5.0,
    reviewCount: 28,
    priceFrom: 4,
    avatarUrl: '',
  },
  {
    id: '4',
    displayName: 'Ramaswamy Bhagavathar',
    city: 'Berlin',
    country: 'Germany',
    styleTags: ['Classical Dance', 'Temple Arts', 'History'],
    avgRating: 4.7,
    reviewCount: 35,
    priceFrom: 5,
    avatarUrl: '',
  },
  {
    id: '5',
    displayName: 'Lakshmi Narayanan',
    city: 'London',
    country: 'United Kingdom',
    styleTags: ['Yoga', 'Philosophy', 'Meditation'],
    avgRating: 4.9,
    reviewCount: 51,
    priceFrom: 4,
    avatarUrl: '',
  },
  {
    id: '6',
    displayName: 'Dheena Aachi',
    city: 'Toronto',
    country: 'Canada',
    styleTags: ['Tamil Language', 'Grammar', 'Literature'],
    avgRating: 4.6,
    reviewCount: 42,
    priceFrom: 3,
    avatarUrl: '',
  },
]

const countries = ['All Countries', 'India', 'Singapore', 'Germany', 'United Kingdom', 'Canada', 'USA', 'UAE']
const styleTags = ['Poetry', 'Music', 'Dance', 'Storytelling', 'Philosophy', 'Literature', 'Temple Traditions']

export default function CompanionsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All Countries')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const filteredCompanions = mockCompanions.filter((companion) => {
    const matchesSearch = companion.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companion.styleTags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCountry = selectedCountry === 'All Countries' || companion.country === selectedCountry
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => companion.styleTags.includes(tag))
    return matchesSearch && matchesCountry && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-primary">மொழி</span>
            <span className="text-xl font-serif font-semibold text-foreground">Mozhi</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/companions" className="text-sm font-medium text-primary">
              Companions
            </Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              How it Works
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">Find Your Companion</h1>
            <p className="text-muted-foreground">
              Browse our approved Tamil cultural guides and find your perfect match.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 shrink-0">
              <div className="sticky top-24 space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Name or specialty..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Country</label>
                  <Select value={selectedCountry} onValueChange={(v) => v && setSelectedCountry(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium">Style Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {styleTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTags([])}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-4 text-sm text-muted-foreground">
                {filteredCompanions.length} companion{filteredCompanions.length !== 1 ? 's' : ''} found
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCompanions.map((companion) => (
                  <Card key={companion.id} className="overflow-hidden group hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-16 w-16 border-2 border-primary/10">
                          <AvatarImage src={companion.avatarUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {companion.displayName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{companion.displayName}</h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{companion.city}, {companion.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {companion.styleTags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-accent text-accent" />
                            <span className="font-semibold">{companion.avgRating}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ({companion.reviewCount})
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">From </span>
                          <span className="font-semibold text-primary">€{companion.priceFrom}/mo</span>
                        </div>
                      </div>

                      <Button className="w-full mt-4" asChild>
                        <Link href={`/companions/${companion.id}`}>View Profile</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredCompanions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No companions found matching your criteria.</p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('')
                    setSelectedCountry('All Countries')
                    setSelectedTags([])
                  }}>
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t bg-card">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl font-serif font-bold text-primary">மொழி</span>
              <span className="text-lg font-serif font-semibold text-foreground">Mozhi</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Mozhi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
