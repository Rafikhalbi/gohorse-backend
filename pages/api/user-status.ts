import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');
  
  const { fid } = req.query;
  if (!fid) {
    return res.status(400).json({ error: 'FID is required' });
  }

  try {
    const { data: finalLives, error: rpcError } = await supabase.rpc('get_user_status', {
      player_fid: parseInt(fid as string)
    });

    if (rpcError) throw rpcError;

    return res.status(200).json({ play_lives: finalLives });

  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch user status', details: error.message });
  }
}