import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tambahkan header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (req.method === 'GET') {
    try {
      const { fid } = req.query;

      if (!fid) {
        return res.status(400).json({ error: 'FID is required' });
      }

      const { data, error } = await supabase.rpc('get_player_rank', { player_fid: parseInt(fid as string) });

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      return res.status(200).json(data[0]);
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to fetch user rank', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}