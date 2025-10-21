import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_LIVES = 5;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }
  
  const { fid, username } = req.body;
  if (!fid) {
    return res.status(400).json({ error: 'FID is required' });
  }

  try {
    const { data: newLives, error: rpcError } = await supabase.rpc('start_play_session', {
      player_fid: fid,
      player_username: username
    });

    if (rpcError) throw rpcError;

    if (newLives === -1) {
      return res.status(200).json({ canPlay: false, message: 'Not enough lives!' });
    }
    
    const payload = { fid, username };
    const sessionToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '5m' });

    return res.status(200).json({ 
        canPlay: true, 
        livesRemaining: newLives,
        sessionToken: sessionToken
    });

  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to start play session', details: error.message });
  }
}