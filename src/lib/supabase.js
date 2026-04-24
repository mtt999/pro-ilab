import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lxjudxjcxhrynxlodtg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4anVkeGpjeGhyeW5ubHhvZHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTIyNzAsImV4cCI6MjA5MjYyODI3MH0.0VvPrP_uhRVXq6xzAGogTh9IPCIi_Wsb1LsSVSgb_JI'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY)
