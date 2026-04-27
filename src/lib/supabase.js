import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lxjudxjcxhrynnlxodtg.supabase.co'
const SUPABASE_KEY = 'sb_publishable__xMbRgZhwKSq_7qKi3KGJg_6AJkaR7A'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
