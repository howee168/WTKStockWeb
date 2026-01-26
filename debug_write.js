
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipqgxhbnowmjqefmyfod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcWd4aGJub3dtanFlZm15Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjgxNTksImV4cCI6MjA4NDEwNDE1OX0.Ei99xNSdUuHAXq1lES6snLmxZfDMvz7i2zS1_QA1jtk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWrite() {
    console.log('Attempting to insert test item...');
    const testItem = {
        name: 'TEST_ITEM_DEBUG_2',
        code: 'DEBUG_002',
        minlevel: 999,
        currentstock: 50,
        description: 'Debug Item',
        unit: 'PCS',
        type: 'General'
    };

    const { data, error } = await supabase.from('items').insert([testItem]).select().single();

    if (error) {
        console.error('Insert Failed:', error);
    } else {
        console.log('Insert Success:', data);
    }
}

testWrite();
