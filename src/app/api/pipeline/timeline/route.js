import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'src', 'app', 'api', 'pipeline', 'execution_log.txt');

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Log file not found' }, { status: 404 });
  }

  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  const timeline = [];

  const stageRegex = /\[(IF|ID|EX|MEM|WB)\s*\]\s+Cycle (\d+)\s+\|(?:.*?instruction\s+(0x[0-9a-f]+))?/i;

  let lastInstruction = null;

  for (const line of lines) {
    const match = line.match(stageRegex);
    if (!match) continue;

    const stage = match[1];                  // IF, ID, EX, etc.
    const cycle = parseInt(match[2]);        // Cycle number
    const instrHex = match[3];               // Instruction address (may be undefined)

    // If the line gives us an instruction address, update lastInstruction
    if (instrHex) {
      lastInstruction = instrHex;
    }

    // If we still don't know which instruction this is for, skip it
    if (!lastInstruction) continue;

    // Find or create the instruction entry
    let instrEntry = timeline.find(entry => entry.instruction === lastInstruction);
    if (!instrEntry) {
      instrEntry = { instruction: lastInstruction, stages: {} };
      timeline.push(instrEntry);
    }

    // Store the stage info
    instrEntry.stages[cycle] = { stage, raw: line.trim() };
  }

  return NextResponse.json(timeline);
}
