import { useState, useEffect, useCallback } from 'react'

const OFFLINE_CACHE = 'mozhi-offline-v1'
const VIDEO_CACHE = 'mozhi-videos-v1'

interface OfflineLesson {
  lessonId: string
  courseId: string
  title: string
  videoUrl: string
  cachedAt: number
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)
  const [cachedLessons, setCachedLessons] = useState<OfflineLesson[]>([])
  const [storageUsed, setStorageUsed] = useState(0)
  const [maxStorage, setMaxStorage] = useState(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadCachedLessons()
    checkStorage()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadCachedLessons = useCallback(async () => {
    try {
      const cache = await caches.open(VIDEO_CACHE)
      const requests = await cache.keys()
      
      const lessons: OfflineLesson[] = []
      for (const request of requests) {
        const response = await cache.match(request)
        const data = await response?.json()
        if (data) {
          lessons.push(data)
        }
      }
      setCachedLessons(lessons)
    } catch (e) {
      console.error('Error loading cached lessons:', e)
    }
  }, [])

  const checkStorage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      setStorageUsed(estimate.usage || 0)
      setMaxStorage(estimate.quota || 0)
    }
  }, [])

  const cacheLesson = useCallback(async (lessonId: string, courseId: string, title: string, videoUrl: string) => {
    if (!videoUrl) return false

    try {
      const cache = await caches.open(VIDEO_CACHE)
      
      const response = await fetch(videoUrl, { mode: 'cors' })
      if (!response.ok) {
        console.error('Failed to fetch video')
        return false
      }

      await cache.put(videoUrl, response.clone())
      
      const metadata: OfflineLesson = {
        lessonId,
        courseId,
        title,
        videoUrl,
        cachedAt: Date.now(),
      }
      await cache.put(
        new Request(videoUrl + '-meta'),
        new Response(JSON.stringify(metadata))
      )

      await loadCachedLessons()
      await checkStorage()

      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CACHE_VIDEO',
          videoUrl,
          lessonId,
        })
      }

      return true
    } catch (e) {
      console.error('Error caching lesson:', e)
      return false
    }
  }, [])

  const removeCachedLesson = useCallback(async (lessonId: string) => {
    const lesson = cachedLessons.find(l => l.lessonId === lessonId)
    if (!lesson) return

    try {
      const cache = await caches.open(VIDEO_CACHE)
      await cache.delete(lesson.videoUrl)
      await cache.delete(lesson.videoUrl + '-meta')
      
      await loadCachedLessons()
      await checkStorage()
      
      return true
    } catch (e) {
      console.error('Error removing cached lesson:', e)
      return false
    }
  }, [cachedLessons])

  const isLessonCached = useCallback((lessonId: string) => {
    return cachedLessons.some(l => l.lessonId === lessonId)
  }, [cachedLessons])

  const downloadAllForCourse = useCallback(async (courseId: string, lessons: Array<{ id: string; title: string; videoUrl: string }>) => {
    const downloadableLessons = lessons.filter(l => l.videoUrl && !isLessonCached(l.id))
    
    const results = await Promise.all(
      downloadableLessons.map(lesson => 
        cacheLesson(lesson.id, courseId, lesson.title, lesson.videoUrl)
      )
    )
    
    return {
      total: downloadableLessons.length,
      successful: results.filter(r => r).length,
    }
  }, [cacheLesson, isLessonCached])

  const clearAllOffline = useCallback(async () => {
    try {
      await caches.delete(VIDEO_CACHE)
      await caches.delete(OFFLINE_CACHE)
      setCachedLessons([])
      await checkStorage()
      
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.controller?.postMessage({
          type: 'CLEAR_OFFLINE',
        })
      }
      
      return true
    } catch (e) {
      console.error('Error clearing offline data:', e)
      return false
    }
  }, [])

  const getStoragePercentage = useCallback(() => {
    if (!maxStorage || !storageUsed) return 0
    return Math.round((storageUsed / maxStorage) * 100)
  }, [storageUsed, maxStorage])

  return {
    isOnline,
    cachedLessons,
    storageUsed,
    maxStorage,
    storagePercentage: getStoragePercentage(),
    cacheLesson,
    removeCachedLesson,
    isLessonCached,
    downloadAllForCourse,
    clearAllOffline,
  }
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkInstallable = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      setIsInstalled(isStandalone)
      
      if (!isStandalone && 'serviceWorker' in navigator) {
        setIsInstallable(true)
      }
    }

    checkInstallable()

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false

    const promptEvent = deferredPrompt as any
    promptEvent.prompt()
    
    const { outcome } = await promptEvent.userChoice
    
    setDeferredPrompt(null)
    
    return outcome === 'accepted'
  }, [deferredPrompt])

  const registerSW = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      console.log('SW registered:', registration.scope)

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        }
      })

      return true
    } catch (e) {
      console.error('SW registration failed:', e)
      return false
    }
  }, [])

  return {
    isInstallable,
    isInstalled,
    install,
    registerSW,
  }
}

export function useDownloadProgress() {
  const [downloads, setDownloads] = useState<Map<string, { progress: number; status: string }>>(new Map())

  const addDownload = useCallback((lessonId: string) => {
    setDownloads(prev => {
      const next = new Map(prev)
      next.set(lessonId, { progress: 0, status: 'pending' })
      return next
    })
  }, [])

  const updateProgress = useCallback((lessonId: string, progress: number) => {
    setDownloads(prev => {
      const next = new Map(prev)
      next.set(lessonId, { progress, status: 'downloading' })
      return next
    })
  }, [])

  const completeDownload = useCallback((lessonId: string, success: boolean) => {
    setDownloads(prev => {
      const next = new Map(prev)
      next.set(lessonId, { 
        progress: 100, 
        status: success ? 'completed' : 'failed' 
      })
      return next
    })
  }, [])

  const getProgress = useCallback((lessonId: string) => {
    return downloads.get(lessonId)
  }, [downloads])

  return {
    downloads,
    addDownload,
    updateProgress,
    completeDownload,
    getProgress,
  }
}