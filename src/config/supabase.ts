import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://nwheyzkgnikvgdpmwfzs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53aGV5emtnbmlrdmdkcG13ZnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjk1NDcsImV4cCI6MjA3Mjc0NTU0N30.DR1FkE2vUUob2MQIhrBpVycmu8EVJYAZ00EiowFKQWY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})

// Export types for use throughout the app
export type { User, Session } from '@supabase/supabase-js'
