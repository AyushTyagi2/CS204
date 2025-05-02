"use client";
import { useEffect, useState } from "react";

export default function PipelineGrid() {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    fetch("/api/pipeline/timeline")
      .then((res) => res.json())
      .then((data) => {
        console.log("Timeline data:", data);
        setTimeline(data);
      });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pipeline Visualization</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border p-2 text-black bg-gray-200">Instruction</th>
              {[...Array(10)].map((_, i) => (
                <th key={i} className="border p-2 text-black bg-gray-100">
                  Cycle {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeline.map((instr, idx) => (
              <tr key={idx}>
                <td className="border p-2 font-mono">{instr.instruction}</td>
                {[...Array(10)].map((_, cycle) => (
                 <td key={cycle} className="border p-2 text-center text-xs">
                 {instr.stages[cycle + 1] ? (
                   <>
                     <div>{instr.stages[cycle + 1].stage}</div>
                     <div className="text-gray-500">{instr.stages[cycle + 1].raw}</div>
                   </>
                 ) : (
                   ""
                 )}
               </td>
               
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
