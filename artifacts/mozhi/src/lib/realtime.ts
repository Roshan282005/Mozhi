

import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null
let channel: RealtimeChannel | null = null

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || '',
      import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    )
  }
  return supabase
}

export interface RealtimeMessage {
  id: string
  room_id: string
  user_id: string
  message: string
  created_at: string
}

export async function joinRoom(roomId: string, onMessage: (message: RealtimeMessage) => void) {
  const client = getSupabaseClient()
  
  await client.realtime.setAuth()

  channel = client
    .channel(`room:${roomId}`, {
      config: { private: true },
    })
    .on('broadcast', { event: 'message_created' }, (payload) => {
      onMessage(payload.payload as RealtimeMessage)
    })
    .subscribe()

  return channel
}

export async function leaveRoom() {
  if (channel) {
    const client = getSupabaseClient()
    await client.removeChannel(channel)
    channel = null
  }
}

export async function sendMessage(roomId: string, message: RealtimeMessage) {
  if (!channel) {
    console.warn('Not connected to room. Call joinRoom first.')
    return
  }

  const client = getSupabaseClient()
  
  await channel.send({
    type: 'broadcast',
    event: 'message_created',
    payload: message,
  })
}

export function isConnected() {
  return channel?.state === 'joined'
}

export { getSupabaseClient as supabaseClient }
export { getSupabaseClient }