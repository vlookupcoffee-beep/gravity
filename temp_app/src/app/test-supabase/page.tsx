
import { createClient } from '@/utils/supabase/server'

export default async function TestSupabase() {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getSession()

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
            <div className="space-y-4">
                <div className="p-4 border rounded bg-gray-50">
                    <h2 className="font-semibold mb-2">Auth Session Status</h2>
                    {error ? (
                        <div className="text-red-600">
                            <p>Error connecting to Supabase:</p>
                            <pre>{JSON.stringify(error, null, 2)}</pre>
                        </div>
                    ) : (
                        <div className="text-green-600">
                            <p>Successfully connected to Supabase!</p>
                            <p>Session: {data.session ? 'Active' : 'No active session'}</p>
                        </div>
                    )}
                </div>

                <div className="text-sm text-gray-500">
                    <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
                </div>
            </div>
        </div>
    )
}
