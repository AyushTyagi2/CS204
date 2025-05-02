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
    IF: '🔍',
    ID: '🦉',
    EX: '🧙',
    MEM: '📚',
    WB: '🖋️'
  };
  
  const stageNames = {
    IF: 'Fetch',
    ID: 'Decode',
    EX: 'Execute',
    MEM: 'Memory',
    WB: 'Write Back'
  };

  const getStageBlock = (cycle, stage) => {
    const info = cycle[stage];
    if (!info) return <div className="text-gray-500 text-center h-full flex items-center justify-center">-</div>;
    
    return (
      <div className={`rounded-md p-2 w-full h-full flex flex-col border-l-4 ${info.Hazard 
        ? 'border-l-red-500 bg-gray-900' 
        : 'border-l-amber-500 bg-gray-800'}`}>
        <div className="flex items-center gap-1 text-amber-400 font-medium mb-2">
          <span>{stageCharacters[stage]}</span>
          <span>{stageNames[stage]}</span>
        </div>
        {info.instruction && <div className="text-xs text-gray-300">📜 {info.instruction}</div>}
        {info.pc && <div className="text-xs text-gray-300">📍 {info.pc}</div>}
        {info.Hazard && (
          <div className="text-xs font-bold text-red-400 mt-1 flex items-center gap-1">
            ⚠️ {info.Hazard}
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
      <div className="mt-4 p-3 bg-gray-800 rounded-md border-l-4 border-l-amber-500">
        <h3 className="font-medium text-amber-400 mb-2">🔮 Branch Predictor</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pr-4 py-2 text-gray-300">📍 PC</th>
                <th className="pr-4 py-2 text-gray-300">🧠 BHT Prediction</th>
                <th className="pr-4 py-2 text-gray-300">🎯 BTB Target</th>
              </tr>
            </thead>
            <tbody>
              {[...allPCs].map(pc => (
                <tr key={pc} className="border-b border-gray-700 last:border-0">
                  <td className="pr-4 py-2 text-gray-300">{pc}</td>
                  <td className="pr-4 py-2 text-gray-300">{bht[pc] ?? '-'}</td>
                  <td className="pr-4 py-2 text-gray-300">{btb[pc] ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderClock = (cycleNumber) => {
    return (
      <div className="flex flex-col items-center mb-4">
        <div className="text-amber-500 font-mono font-bold">Clock Cycles: {cycleNumber}</div>
        <div className="w-full h-8 flex items-center">
          <svg width="100%" height="24" viewBox="0 0 1000 24">
            <path 
              d="M0,12 L50,12 L50,2 L100,2 L100,12 L150,12 L150,2 L200,2 L200,12 L250,12 L250,2 L300,2 L300,12 L350,12 L350,2 L400,2 L400,12 L450,12 L450,2 L500,2 L500,12 L550,12 L550,2 L600,2 L600,12 L650,12 L650,2 L700,2 L700,12 L750,12 L750,2 L800,2 L800,12 L850,12 L850,2 L900,2 L900,12 L950,12 L950,2 L1000,2" 
              stroke="#FF9800" 
              strokeWidth="2" 
              fill="none"
            />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-black text-gray-200">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-amber-500">Pipeline Visualizer</h1>
        <div className="flex gap-2">
          <button className="bg-amber-500 text-black px-3 py-1 rounded-md text-sm font-medium">Save</button>
          <button className="bg-gray-700 text-gray-200 px-3 py-1 rounded-md text-sm font-medium">Reset</button>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-800">
        {renderClock(pipelineData.length > 0 ? pipelineData[pipelineData.length-1].cycle || pipelineData.length : 1)}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "calc(100vh - 160px)" }}>
        <div className="flex flex-col gap-4">
          {pipelineData.map((cycle, i) => (
            <div key={i} className="border border-gray-700 rounded-md p-4 bg-gray-900">
              <h2 className="text-amber-500 font-mono mb-3">Cycle {cycle.cycle || i + 1}</h2>
              
              <div className="grid grid-cols-5 gap-3">
                {["IF", "ID", "EX", "MEM", "WB"].map(stage => (
                  <div key={stage} className="min-h-16">
                    {getStageBlock(cycle, stage)}
                  </div>
                ))}
              </div>
              
              {renderBranchPredictor(cycle.BranchPredictor)}
            </div>
          ))}
        </div>
      </div>
      
      <footer className="p-3 text-center text-xs text-gray-500 border-t border-gray-800">
        © 2025 ADDA. All rights reserved.
      </footer>
    </div>
  );
}