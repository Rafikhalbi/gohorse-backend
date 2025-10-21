import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');
  
  const { fid } = req.body;
  if (!fid) return res.status(400).json({ error: 'FID is required' });

  try {
    const { data: player, error } = await supabase
      .from('Player')
      .select('play_lives')
      .eq('fid', fid)
      .single();

    if (error || !player) {
      return res.status(200).json({ canPlay: true, livesRemaining: 4 });
    }

    if (player.play_lives <= 0) {
      return res.status(200).json({ canPlay: false, message: 'Not enough lives!' });
    }

    const newLives = player.play_lives - 1;
    const { error: updateError } = await supabase
      .from('Player')
      .update({ play_lives: newLives })
      .eq('fid', fid);

    if (updateError) throw updateError;
    
    return res.status(200).json({ canPlay: true, livesRemaining: newLives });

  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to start play session', details: error.message });
  }
}