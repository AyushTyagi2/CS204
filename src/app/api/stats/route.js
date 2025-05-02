// src/app/api/stats/route.js

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    'src/executables_phase3/stats.txt'
  );

  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'stats.txt not found' }, { status: 404 });
    }

    const data = fs.readFileSync(filePath, 'utf-8').trim();

    if (!data) {
      return NextResponse.json({ error: 'stats.txt is empty' }, { status: 204 });
    }

    const lines = data.split('\n');
    const stats = {};
    for (const line of lines) {
      const [key, ...valueParts] = line.trim().split(/\s+/); // flexible spacing
      if (key && valueParts.length > 0) {
        const value = valueParts.join(' ').trim();
        stats[key] = isNaN(value) ? value : Number(value);
      }
    }
    

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error reading stats.txt:', error);
    return NextResponse.json({ error: 'Failed to read stats.txt' }, { status: 500 });
  }
}
