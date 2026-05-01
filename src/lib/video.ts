const DAILY_API_KEY = process.env.DAILY_API_KEY || ''
const DAILY_API_URL = 'https://api.daily.co/v1'

export interface DailyRoom {
  name: string
  url: string
  created_at: string
  config: {
    nbf?: number
    exp?: number
    max_participants?: number
    enable_screenshare?: boolean
    enable_chat?: boolean
  }
}

export interface CreateRoomOptions {
  name?: string
  maxParticipants?: number
  enableScreenshare?: boolean
  enableChat?: boolean
  expiresIn?: number
}

export interface HLSVariant {
  bitrate: number
  resolution: string
  label: string
}

export interface TranscodeJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  inputUrl: string
  outputUrl?: string
  qualities: HLSVariant[]
  progress?: number
}

export const HLS_CONFIGS = {
  low: { bitrate: 800000, resolution: '426x240', label: '360p' },
  medium: { bitrate: 2000000, resolution: '854x480', label: '480p' },
  high: { bitrate: 4000000, resolution: '1280x720', label: '720p' },
  hd: { bitrate: 8000000, resolution: '1920x1080', label: '1080p' },
}

export async function createDailyRoom(options: CreateRoomOptions = {}): Promise<{ room?: DailyRoom; error?: string }> {
  if (!DAILY_API_KEY) {
    return { error: 'Daily.co API key not configured' }
  }

  try {
    const roomName = options.name || `mozhi-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    const config: any = {
      max_participants: options.maxParticipants || 2,
      enable_screenshare: options.enableScreenshare ?? true,
      enable_chat: options.enableChat ?? true,
      start_video_off: false,
      start_audio_off: false,
    }

    if (options.expiresIn) {
      config.exp = Math.floor(Date.now() / 1000) + (options.expiresIn * 3600)
    }

    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'public',
        properties: config,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { error: error.error || 'Failed to create room' }
    }

    const room = await response.json()
    return { room }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function getDailyRoom(roomName: string): Promise<{ room?: DailyRoom; error?: string }> {
  if (!DAILY_API_KEY) {
    return { error: 'Daily.co API key not configured' }
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Room not found' }
      }
      const error = await response.json()
      return { error: error.error || 'Failed to get room' }
    }

    const room = await response.json()
    return { room }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function deleteDailyRoom(roomName: string): Promise<{ error?: string }> {
  if (!DAILY_API_KEY) {
    return { error: 'Daily.co API key not configured' }
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { error: error.error || 'Failed to delete room' }
    }

    return { error: undefined }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function createMeetingToken(roomName: string, userId: string, userName: string): Promise<{ token?: string; error?: string }> {
  if (!DAILY_API_KEY) {
    return { error: 'Daily.co API key not configured' }
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          user_id: userId,
          user_name: userName,
          is_owner: false,
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { error: error.error || 'Failed to create token' }
    }

    const data = await response.json()
    return { token: data.token }
  } catch (err: any) {
    return { error: err.message }
  }
}

export function getDailyDomain(): string {
  return process.env.NEXT_PUBLIC_DAILY_DOMAIN || 'mozhi.daily.co'
}

export function getHLSDashUrl(videoId: string): string {
  return `https://${process.env.AWS_CLOUDFRONT_DOMAIN || 'cdn.mozhi.ai'}/hls/${videoId}/manifest.mpd`
}

export function getHLSUrl(videoId: string, quality: string = 'auto'): string {
  return `https://${process.env.AWS_CLOUDFRONT_DOMAIN || 'cdn.mozhi.ai'}/hls/${videoId}/${quality}.m3u8`
}

export function getVideoThumbnail(videoId: string): string {
  return `https://${process.env.AWS_CLOUDFRONT_DOMAIN || 'cdn.mozhi.ai'}/thumbnails/${videoId}.jpg`
}

export function getVideoDownloadUrl(videoId: string, quality: string = '720p'): string {
  return `https://${process.env.AWS_S3_BUCKET || 'mozhi-videos'}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/videos/${videoId}/${quality}.mp4`
}