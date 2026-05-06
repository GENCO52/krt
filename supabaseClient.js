// Supabase config
const SUPABASE_URL = 'https://kmuvwztjwetjfwvgcmyf.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttdXZ3enRqd2V0amZ3dmdjbXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjAxNDMsImV4cCI6MjA5MzYzNjE0M30.XnTxAiot4sTlK1_tlz0SidQRdThT8R2vS5jZkRfUSog';

// Initialize Supabase Client
const _supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Export it to window so both admin.js and script.js can use it
window.supabaseClient = _supabaseClient;
// Redefining the global 'supabase' to be the client instance for easier use
window.supabase = _supabaseClient;
