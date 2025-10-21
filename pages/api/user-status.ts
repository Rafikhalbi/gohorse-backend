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
  if (!fid) {
    return res.status(400).json({ error: 'FID is required' });
  }

  try {
    const numericFid = parseInt(fid as string);
    let { data: player, error } = await supabase
      .from('Player')
      .select('play_lives, last_life_update')
      .eq('fid', numericFid)
      .maybeSingle();

    if (error) {
        throw error;
    }

    if (!player) {
      // Pemain baru, buat entri di database dengan 5 nyawa
      const { error: insertError } = await supabase
        .from('Player')
        .insert({ fid: numericFid, play_lives: MAX_LIVES });

      if (insertError) {
        console.error("Failed to create new player:", insertError);
      }
      
      return res.status(200).json({ play_lives: MAX_LIVES });
    }

    const now = new Date();
    const lastUpdate = new Date(player.last_life_update);
    const hoursPassed = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60));

    let livesToAdd = 0;
    if (hoursPassed >= REGEN_HOURS) {
        livesToAdd = Math.floor(hoursPassed / REGEN_HOURS);
    }
    
    let finalLives = player.play_lives;
    let newCalculatedLives = Math.min(MAX_LIVES, finalLives + livesToAdd);
    
    if (newCalculatedLives > finalLives) {
      const { error: updateError } = await supabase
        .from('Player')
        .update({ play_lives: newCalculatedLives, last_life_update: now.toISOString() })
        .eq('fid', numericFid);
      
      if (updateError) {
        console.error("Failed to update regenerated lives:", updateError);
      } else {
        finalLives = newCalculatedLives;
      }
    }

    return res.status(200).json({ play_lives: finalLives });

  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch user status', details: error.message });
  }
}