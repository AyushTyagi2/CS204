import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    // Define path to stats.txt (in /data/stats.txt)
    const statsFilePath = path.join(
        process.cwd(),
        'src/executables_phase3/stats.txt'
      );

    // Check if the file exists
    if (!fs.existsSync(statsFilePath)) {
      return new Response(JSON.stringify({ error: 'stats.txt file not found' }), { status: 404 });
    }

    // Read the file contents
    const statsContent = fs.readFileSync(statsFilePath, 'utf8');

    // Extract the number using regex
    const cyclesMatch = statsContent.match(/Stat1_Total_Cycles\s+(\d+)/i);
        if (!cyclesMatch) {
      return new Response(JSON.stringify({ error: 'Total Cycles not found in stats.txt' }), { status: 400 });
    }

    const maxCycles = parseInt(cyclesMatch[1], 10);

    // Respond with the parsed value
    return new Response(JSON.stringify({ maxCycles }), { status: 200 });
  } catch (error) {
    console.error('Error reading stats.txt:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
