'use client'

import { useCallback, useState } from 'react'

export function useVideoUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const getUploadUrl = useCallback(async (fileName: string, fileType: string, lessonId: string, courseId?: string) => {
    try {
      const response = await fetch('/api/upload/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getSimpleUploadUrl',
          fileName,
          fileType,
          lessonId,
          courseId,
        }),
      })
      const result = await response.json()
      return result.data
    } catch (e) {
      console.error('Error getting upload URL:', e)
      return null
    }
  }, [])

  const uploadVideo = useCallback(async (file: File, lessonId: string, courseId?: string) => {
    setUploading(true)
    setError(null)
    setProgress(0)

    try {
      const urlData = await getUploadUrl(file.name, file.type, lessonId, courseId)
      
      if (!urlData?.videoUrl) {
        throw new Error('Failed to get upload URL')
      }

      return urlData.videoUrl
    } catch (e: any) {
      setError(e.message)
      setUploading(false)
      throw e
    }
  }, [getUploadUrl])

  return {
    uploading,
    progress,
    error,
    uploadVideo,
    getUploadUrl,
  }
}

export async function uploadFileToS3(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string } | null> {
  const formData = new FormData()
  formData.append('file', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch {
          reject(new Error('Invalid response'))
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.open('POST', '/api/upload/video')
    xhr.send(formData)
  })
}