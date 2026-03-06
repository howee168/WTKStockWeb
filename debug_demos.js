import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ipqgxhbnowmjqefmyfod.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlwcWd4aGJub3dtanFlZm15Zm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MjgxNTksImV4cCI6MjA4NDEwNDE1OX0.Ei99xNSdUuHAXq1lES6snLmxZfDMvz7i2zS1_QA1jtk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDemos() {
    console.log('Fetching demo transactions...');
    const { data, error } = await supabase.from('transactions')
        .select('*')
        .ilike('remarks', '%isDemo%');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} potential demo transactions.`);
    data.forEach(tx => {
        let metadata = {};
        if (tx.remarks.includes('|||JSON|||')) {
            try {
                metadata = JSON.parse(tx.remarks.split('|||JSON|||')[1]);
            } catch (e) { }
        }
        console.log(`ID: ${tx.id}`);
        console.log(`Phone: ${metadata.customerPhone}`);
        console.log(`Status: ${metadata.demoStatus}`);
        console.log('---');
    });
}

checkDemos();
