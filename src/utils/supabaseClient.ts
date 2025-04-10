import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Debug logs
console.log('Supabase URL:', supabaseUrl ? 'URL exists' : 'URL missing');
console.log('Supabase Key:', supabaseKey ? 'Key exists' : 'Key missing');
console.log('OpenWeather Key:', process.env.REACT_APP_OPENWEATHER_API_KEY ? 'Key exists' : 'Key missing');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey); 