import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vfhjwlnwuctuvqsxkmoz.supabase.co';
// Need the service role key to alter table, or I can just tell the user to run the SQL query
// Since I don't have the DB password, I can't easily alter the table directly from a script without the connection string.
// I will just ask the user to run the SQL query in Supabase!
