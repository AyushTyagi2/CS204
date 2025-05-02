import fs from 'fs';
import path from 'path';

const filePath = 'C:/Users/asus/OneDrive/Documents/GitHub/Cs204_risc-v_assembler/project_phase_2/phase2+phase3/src/executables_phase3/pipeline.json';
let autoStepInterval = null;

const MAX_INSTRUCTIONS = 20;

// --- GET method ---
export async function GET(req) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (pathname.endsWith("/maxcycle")) {
    return new Response(JSON.stringify({ maxCycles: MAX_INSTRUCTIONS + 5 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(raw);

    return new Response(JSON.stringify(json), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    console.error('GET /api/pipe error:', err);
    return new Response(JSON.stringify({ error: 'Failed to read pipeline data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// --- POST method ---
export async function POST(req) {
  try {
    const { action } = await req.json();
    let pipeline = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    switch (action) {
      case 'step':
        pipeline = stepPipeline(pipeline);
        break;

      case 'reset':
        pipeline = resetPipeline();
        break;

      case 'play':
        if (!autoStepInterval) {
          autoStepInterval = setInterval(() => {
            try {
              let currentData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              if (isSimulationComplete(currentData)) {
                console.log(`Simulation complete at cycle ${currentData[currentData.length - 1].cycle}`);
                clearInterval(autoStepInterval);
                autoStepInterval = null;
                return;
              }
              const updated = stepPipeline(currentData);
              fs.writeFileSync(filePath, JSON.stringify(updated, null, 2));
            } catch (e) {
              console.error('Auto-step error:', e);
              clearInterval(autoStepInterval);
              autoStepInterval = null;
            }
          }, 1000);
        }
        break;

      case 'pause':
        if (autoStepInterval) {
          clearInterval(autoStepInterval);
          autoStepInterval = null;
        }
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    if (action === 'step' || action === 'reset') {
      fs.writeFileSync(filePath, JSON.stringify(pipeline, null, 2));
    }

    return new Response(JSON.stringify(pipeline), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Pipeline control error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// --- Helpers ---
function isSimulationComplete(pipeline) {
  if (!pipeline || !Array.isArray(pipeline) || pipeline.length === 0) return false;

  const lastCycle = pipeline[pipeline.length - 1];
  if (lastCycle.cycle >= MAX_INSTRUCTIONS + 5) return true;

  return !lastCycle.IF && !lastCycle.ID && !lastCycle.EX && !lastCycle.MEM && !lastCycle.WB;
}

function stepPipeline(pipeline) {
  if (!pipeline || pipeline.length === 0) return resetPipeline();

  const lastCycle = pipeline[pipeline.length - 1];
  const newCycleNum = lastCycle.cycle ? lastCycle.cycle + 1 : 1;

  if (newCycleNum > MAX_INSTRUCTIONS + 5) return pipeline;

  // If all stages are null and no new instruction expected, stop adding
  if (!lastCycle.IF && !lastCycle.ID && !lastCycle.EX && !lastCycle.MEM && !lastCycle.WB) {
    return pipeline;
  }

  const newCycle = {
    cycle: newCycleNum,
    IF: null,
    ID: lastCycle.IF,
    EX: lastCycle.ID,
    MEM: lastCycle.EX,
    WB: lastCycle.MEM,
    InterstageBuffers: {
      IF_ID: lastCycle.IF ? lastCycle.IF.instruction : null,
      ID_EX: lastCycle.ID ? lastCycle.ID.instruction : null,
      EX_MEM: lastCycle.EX ? lastCycle.EX.instruction : null,
      MEM_WB: lastCycle.MEM ? lastCycle.MEM.instruction : null
    },
    forwarded: 0
  };

  return [...pipeline, newCycle];
}

function resetPipeline() {
  return [
    {
      cycle: 0,
      IF: null,
      ID: null,
      EX: null,
      MEM: null,
      WB: null,
      InterstageBuffers: {
        IF_ID: null,
        ID_EX: null,
        EX_MEM: null,
        MEM_WB: null
      },
      forwarded: 0
    }
  ];
}
