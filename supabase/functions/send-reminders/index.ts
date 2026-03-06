import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DemoMetadata {
    isDemo?: boolean;
    demoStatus?: string;
    demoReturnDate?: string;
    customerPhone?: string;
    demoItemName?: string;
    pic?: string;
    [key: string]: any;
}

interface Transaction {
    id: string;
    remarks?: string;
    date: string;
    [key: string]: any;
}

interface DemoWithMetadata extends Transaction, DemoMetadata { }

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Initialize Supabase Client
        // Note: These are automatically provided by Supabase in the Edge Function environment.
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase environment variables are not initialized. This usually happens if the function is not deployed correctly or secrets are misconfigured.')
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 2. Fetch Transactions
        const now = new Date()

        // Check if we are targeting a specific transaction or running a batch
        let body: any = {}
        try {
            body = await req.json()
        } catch (e) {
            // No body is fine for batch runs
        }

        const targetTxId = body.transactionId

        // We fetch recently updated transactions. Since 'isDemo' is stored in 'remarks' metadata,
        // we cannot filter by 'is_demo' column in SQL. We fetch and filter in Deno.
        let query = supabase.from('transactions').select('*')

        if (targetTxId) {
            query = query.eq('id', targetTxId)
        } else {
            query = query.order('date', { ascending: false }).limit(1000)
        }

        const { data: transactions, error: txError } = await query

        if (txError) throw txError

        // Helper to parse metadata
        const parseMetadata = (remarks?: string): DemoMetadata | null => {
            const cleanRemarks = remarks || '';
            if (cleanRemarks.includes('|||JSON|||')) {
                try {
                    return JSON.parse(cleanRemarks.split('|||JSON|||')[1]);
                } catch (e) {
                    return null;
                }
            }
            return null;
        };

        // 3. Group by Customer Phone
        const remindersToSend: Record<string, DemoWithMetadata[]> = {}

        transactions.forEach((t: Transaction) => {
            const metadata = parseMetadata(t.remarks);
            if (!metadata) return;

            // Filter for Pending Demos
            if (!metadata.isDemo || metadata.demoStatus !== 'PENDING') return;

            // Check date if it's a batch run
            if (!targetTxId) {
                if (!metadata.demoReturnDate) return;
                if (new Date(metadata.demoReturnDate) >= now) return;
            }

            const phone = metadata.customerPhone ? metadata.customerPhone.replace(/\D/g, '') : null;
            if (phone) {
                if (!remindersToSend[phone]) remindersToSend[phone] = [];
                remindersToSend[phone].push({ ...t, ...metadata });
            }
        });

        // 4. Send WhatsApp Messages
        const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
        const PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

        if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
            console.warn("WhatsApp Secrets missing. Skipping send.")
            return new Response(JSON.stringify({
                message: "Simulated success (secrets missing)",
                remindersCount: Object.values(remindersToSend).flat().length
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const useTemplate = body.useTemplate === true // Allow forcing template for testing

        const sendPromises = Object.entries(remindersToSend).map(async ([phoneStr, items]) => {
            let phone = phoneStr;
            // Normalize Malaysia numbers: if starts with '0', prepend '6'
            if (phone.startsWith('0')) {
                phone = '6' + phone
            }
            // Ensure it has at least 10 digits (basic guard)
            if (phone.length < 10) {
                console.warn(`Invalid phone number length: ${phone}`)
                return { phone, success: false, error: 'Invalid phone number format' }
            }

            let payload: any;
            const formatDate = (d: string) => {
                if (!d) return 'N/A'
                try {
                    return new Date(d).toLocaleDateString()
                } catch (e) { return d }
            }

            if (useTemplate) {
                // Connection Test: Use Meta's default 'hello_world' template
                payload = {
                    messaging_product: "whatsapp",
                    to: phone,
                    type: "template",
                    template: {
                        name: "hello_world",
                        language: { code: "en" }
                    }
                }
            } else {
                // Official Reminder: Use custom 'reminder_automation' template
                // {{model_name}}, {{date_out}}, {{place_pic}}
                const item = items[0]
                payload = {
                    messaging_product: "whatsapp",
                    to: phone,
                    type: "template",
                    template: {
                        name: "reminder_automation",
                        language: { code: "en" },
                        components: [
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", parameter_name: "model_name", text: item.demoItemName || 'Item' },
                                    { type: "text", parameter_name: "date_out", text: formatDate(item.date) },
                                    { type: "text", parameter_name: "place_pic", text: item.pic || 'N/A' }
                                ]
                            }
                        ]
                    }
                }
            }

            try {
                const res = await fetch(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                })

                const data = await res.json()
                console.log("WhatsApp API Response:", JSON.stringify(data, null, 2));
                const success = res.ok

                return {
                    phone,
                    success,
                    status: res.status,
                    error: data.error?.message || (success ? null : 'Unknown API error'),
                    message_id: data.messages?.[0]?.id
                }
            } catch (err: any) {
                return {
                    phone,
                    success: false,
                    error: err.message
                }
            }
        });

        const results = await Promise.all(sendPromises);
        const allSuccess = results.every(r => r.success);

        return new Response(JSON.stringify({
            success: allSuccess,
            results,
            message: allSuccess ? "All reminders processed" : "Some reminders failed to send"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
