import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Tambahkan header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'POST') {
    try {
      const { fid, score, username } = req.body;

      if (!fid || typeof score !== 'number') {
        return res.status(400).json({ error: 'FID and score are required.' });
      }

      const { error } = await supabase.rpc('upsert_player_score', {
        fid_input: fid,
        score_input: score,
        username_input: username,
      });

      if (error) throw error;
      
      return res.status(200).json({ success: true, message: 'Score submitted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ error: 'Failed to submit score', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}