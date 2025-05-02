import fs from 'fs';
import path from 'path';

export async function GET(req) {
  const url = new URL(req.url);
  const cycle = url.searchParams.get('cycle');

  const logPath = path.join(process.cwd(), 'src', 'app', 'api', 'pipeline', 'execution_log.txt');


  if (!fs.existsSync(logPath)) {
    return new Response(JSON.stringify({ error: 'Log file not found' }), {
      status: 404,
    });
  }

  const logLines = fs.readFileSync(logPath, 'utf-8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('[')); // ignore garbage lines

  const pipelineByCycle = {};

  for (const line of logLines) {
    const match = line.match(/\[(\w+)\s*\]\s+Cycle\s+(\d+)\s*\|\s*(.+)/);
    if (match) {
      const [_, stage, cycleNumStr, desc] = match;
      const cycleNum = parseInt(cycleNumStr);
  
      if (!pipelineByCycle[cycleNum]) {
        pipelineByCycle[cycleNum] = {};
      }
  
      pipelineByCycle[cycleNum][stage.trim()] = desc;
    } else {
      console.log('Skipped:', line); // For debugging
    }
  }
  
  console.log('Parsed Pipeline:', pipelineByCycle); // Debugging output
  

  const cycleNum = parseInt(cycle);

  if (isNaN(cycleNum) || !pipelineByCycle[cycleNum]) {
    return new Response(JSON.stringify({ error: 'No data for this cycle' }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ stages: pipelineByCycle[cycleNum] }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
