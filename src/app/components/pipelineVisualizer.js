"use client";
import { useEffect, useState } from "react";
export default function PipelineStepVisualizer({ timeline }) {
  const [pipeline, setPipeline] = useState([]);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [maxCycle, setMaxCycle] = useState(10);

  useEffect(() => {
    if (!timeline || timeline.length === 0) return;

    const grouped = {};
    let highestCycle = 0;

    timeline.forEach((entry) => {
      if (!grouped[entry.instruction]) {
        grouped[entry.instruction] = {};
      }
      grouped[entry.instruction][entry.cycle] = `[${entry.stage}] Cycle ${entry.cycle} | ${entry.raw}`;
      highestCycle = Math.max(highestCycle, entry.cycle);
    });

    const result = Object.entries(grouped).map(([instruction, stages]) => ({
      instruction,
      stages,
    }));
    setPipeline(result);
    setMaxCycle(highestCycle);
  }, [timeline]);

  // ...rest of your component remains unchanged
  

  const handleNext = () => {
    setVisibleSteps((prev) => prev + 1);
  };

  // Count how many total blocks we can reveal
  const flatStages = pipeline.flatMap((row) =>
    Object.entries(row.stages).map(([cycle, content]) => ({
      instruction: row.instruction,
      cycle: parseInt(cycle),
      content,
    }))
  );

  // Sort them cycle-wise (so they animate by time)
  const visibleBlocks = flatStages
    .sort((a, b) => a.cycle - b.cycle)
    .slice(0, visibleSteps);

  const blockMap = new Map();
  visibleBlocks.forEach((block) => {
    const key = `${block.instruction}-${block.cycle}`;
    blockMap.set(key, block.content);
  });

  return (
    <div className="p-6 bg-black  text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Pipeline Visualization</h1>

      <button
        onClick={handleNext}
        className="bg-green-600 text-white px-4 py-2 rounded mb-6 hover:bg-green-700 transition"
      >
        Next
      </button>

      <div className="overflow-x-auto border border-gray-700 rounded">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1 bg-gray-800">Instruction</th>
              {[...Array(10)].map((_, i) => (
                <th key={i} className="border px-2 py-1 bg-gray-900">
                  Cycle {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pipeline.map((row, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1 font-mono bg-gray-800">{row.instruction}</td>
                {[...Array(10)].map((_, cycleIdx) => {
                  const content = blockMap.get(`${row.instruction}-${cycleIdx + 1}`);
                  return (
                    <td
                      key={cycleIdx}
                      className="border px-2 py-1 text-xs text-gray-300 font-mono transition-all duration-300 ease-in-out"
                    >
                      {content && (
                        <div className="animate-fade-in">
                          {content}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
