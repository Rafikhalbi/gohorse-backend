import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SessionPayload extends jwt.JwtPayload {
    fid: number;
    username: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
  
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }
    
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token is missing or invalid.' });
        }
        const token = authHeader.split(' ')[1];

        const payload = jwt.verify(token, process.env.JWT_SECRET!) as SessionPayload;
        const { fid, username } = payload; 

        const { score } = req.body;
        if (typeof score !== 'number') {
            return res.status(400).json({ error: 'Score is required and must be a number.' });
        }

        const { error: rpcError } = await supabase.rpc('upsert_player_score', {
            fid_input: fid,
            score_input: score,
            username_input: username
        });
        if (rpcError) throw rpcError;
        
        return res.status(200).json({ success: true, message: 'Score submitted successfully.' });

    } catch (error: any) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(403).json({ error: 'Invalid session token.' });
        }
        return res.status(500).json({ error: 'Failed to submit score', details: error.message });
    }
}