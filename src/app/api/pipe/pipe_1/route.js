import fs from 'fs';
import path from 'path';

export async function GET(request) {
  const filePath = path.join(
    'C:',
    'Users',
    'asus',
    'OneDrive',
    'Documents',
    'GitHub',
    'Cs204_risc-v_assembler',
    'project_phase_2',
    'phase2+phase3',
    'src',
    'executables_phase1',
    'pipeline.json'
  );

  try {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return new Response(JSON.stringify({ error: 'Failed to read pipeline.json' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
