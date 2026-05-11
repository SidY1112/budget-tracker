import { supabase } from '@/lib/supabase'

export default async function Home() {
  const { data, error } = await supabase.from('categories').select('*')

  if (error) {
    console.error(error)
    return <div>Error connecting to database</div>
  }

  return (
    <div>
      <h1>Budget Tracker</h1>
      <p>Connected to Supabase successfully!</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}