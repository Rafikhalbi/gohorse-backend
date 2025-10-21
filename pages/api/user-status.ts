import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_LIVES = 5;
const REGEN_HOURS = 1;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end('Method Not Allowed');
  
  const { fid } = req.query;
  if (!fid) return res.status(400).json({ error: 'FID is required' });

  try {
    let { data: player, error } = await supabase
      .from('Player')
      .select('play_lives, last_life_update')
      .eq('fid', fid as string)
      .maybeSingle();

    if (error) {
        throw error;
    }

    if (!player) {
      return res.status(200).json({ play_lives: MAX_LIVES });
    }

    const now = new Date();
    const lastUpdate = new Date(player.last_life_update);
    const hoursPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

    let livesToAdd = 0;
    if (hoursPassed >= REGEN_HOURS) {
        livesToAdd = Math.floor(hoursPassed / REGEN_HOURS);
    }
    
    let currentLives = player.play_lives;
    let newLives = Math.min(MAX_LIVES, currentLives + livesToAdd);
    
    if (newLives > currentLives) {
      const { data: updatedPlayer, error: updateError } = await supabase
        .from('Player')
        .update({ play_lives: newLives, last_life_update: now.toISOString() })
        .eq('fid', fid as string)
        .select('play_lives')
        .maybeSingle();
      
      if (updateError) throw updateError;
      currentLives = updatedPlayer!.play_lives;
    }

    return res.status(200).json({ play_lives: currentLives });

  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch user status', details: error.message });
  }
}