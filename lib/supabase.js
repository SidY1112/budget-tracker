// Creates a client that can connect to the database
import { createClient } from '@supabase/supabase-js'


// Uses the keys from the .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Exports the client so that way any file can import it and query the databse
export const supabase = createClient(supabaseUrl, supabaseAnonKey)