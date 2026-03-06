const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function checkDemos() {
    console.log('Fetching demo transactions...');
    const { data, error } = await supabase
        .from('transactions')
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
        console.log('ID:', tx.id);
        console.log('Phone:', metadata.customerPhone);
        console.log('Status:', metadata.demoStatus);
        console.log('---');
    });
}

checkDemos();
