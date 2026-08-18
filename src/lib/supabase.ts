import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://snyqgbzxchdtdgjlaohx.supabase.co";
// Pega aquí la llave que copiaste, ¡la que empieza con sb_publishable!
const supabaseAnonKey = "sb_publishable_u2lx3FwgX7X3V-X7FFcv4g_T1d9vPhp"; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);