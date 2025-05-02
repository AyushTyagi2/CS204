'use client';
import { useEffect, useState } from 'react';

export default function PipelineVisualizer() {
  const [pipelineData, setPipelineData] = useState([]);

  useEffect(() => {
    fetch('/api/pipe')
      .then(res => res.json())
      .then(data => setPipelineData(data))
      .catch(err => console.error('Failed to load pipeline data:', err));
  }, []);

  const stageCharacters = {
    IF: '🔍 Fetchy the Scout',
    ID: '🦉 Decody the Owl',
    EX: '🧙 Magico the Wizard',
    MEM: '📚 Libby the Librarian',
    WB: '🖋️ Scribby the Scribe'
  };

  const getStageBlock = (cycle, stage) => {
    const info = cycle[stage];
    if (!info) return <div className="text-gray-400 text-center">-</div>;

    return (
      <div className={`rounded-lg p-2 border shadow-inner w-full bg-white flex flex-col items-center ${info.Hazard ? 'border-red-500 bg-red-100 animate-pulse' : 'border-gray-300'}`}>
        <div className="text-sm font-semibold">{stageCharacters[stage]}</div>
        {info.instruction && <div className="text-xs">📜 {info.instruction}</div>}
        {info.pc && <div className="text-xs">📍 {info.pc}</div>}
        {info.Hazard && (
          <div className="text-xs font-bold text-red-600 mt-1">
            ⚠️ {info.Hazard} Hazard!
          </div>
        )}
      </div>
    );
  };

  const renderBranchPredictor = (predictor) => {
    if (!predictor) return null;

    const bht = predictor.BHT || {};
    const btb = predictor.BTB || {};
    const allPCs = new Set([...Object.keys(bht), ...Object.keys(btb)]);

    return (
      <div className="mt-4 p-2 bg-yellow-100 rounded-md shadow-sm">
        <h3 className="font-semibold text-yellow-700 mb-2">🔮 Branch Predictor</h3>
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b">
              <th className="pr-4">📍 PC</th>
              <th className="pr-4">🧠 BHT Prediction</th>
              <th className="pr-4">🎯 BTB Target</th>
            </tr>
          </thead>
          <tbody>
            {[...allPCs].map(pc => (
              <tr key={pc} className="border-b last:border-0">
                <td className="pr-4">{pc}</td>
                <td className="pr-4">{bht[pc] ?? '-'}</td>
                <td className="pr-4">{btb[pc] ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🚂 Pippy the Pipeline</h1>
      <div className="flex flex-col gap-6">
        {pipelineData.map((cycle, i) => (
          <div key={i} className="text-black border rounded-xl p-4 bg-blue-50 shadow">
            <h2 className="text-lg font-semibold mb-2">🌀 Cycle {cycle.cycle || i + 1}</h2>

            <div className="grid grid-cols-5 gap-4">
              {["IF", "ID", "EX", "MEM", "WB"].map(stage => (
                <div key={stage}>
                  {getStageBlock(cycle, stage)}
                </div>
              ))}
            </div>

            {renderBranchPredictor(cycle.BranchPredictor)}
          </div>
        ))}
      </div>
    </div>
  );
}
