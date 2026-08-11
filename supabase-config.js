/* ==========================================================================
   AL HALAL VENTURES - SUPABASE CLIENT CONFIGURATION
   Project: alhalalventures87-source's Project
   ========================================================================== */

const SUPABASE_URL = 'https://appbclcmrgtictfnjrpy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwcGJjbGNtcmd0aWN0Zm5qcnB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0MjMxODksImV4cCI6MjEwMTk5OTE4OX0.YRFOVHbGntEuIjIrscArMV7Vitu9aaWHEsQHZZnSyhg';

// Initialize global Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
