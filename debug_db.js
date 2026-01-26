
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipqgxhbnowmjqefmyfod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcWd4aGJub3dtanFlZm15Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjgxNTksImV4cCI6MjA4NDEwNDE1OX0.Ei99xNSdUuHAXq1lES6snLmxZfDMvz7i2zS1_QA1jtk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Fetching one item...');
    const { data, error } = await supabase.from('items').select('*').limit(1);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Column Names found in DB:');
        console.log(Object.keys(data[0]));
        console.log('Sample Data:');
        console.log(data[0]);
    } else {
        console.log('No items found or table empty.');
    }
}

inspect();
