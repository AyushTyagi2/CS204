"use client";
import { useState } from "react";

export default function RiscVSimulator() {
  const [registers, setRegisters] = useState(
    Array.from({ length: 32 }, (_, i) => ({ name: `x${i}`, value: 0 }))
  );
  const [memory, setMemory] = useState([]);
  const [code, setCode] = useState("# Write your RISC-V assembly code here\n");
  
  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4 text-center">RISC-V Simulator</h1>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Code Editor */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg col-span-2">
          <h2 className="text-xl font-semibold mb-2">Code Editor</h2>
          <textarea
            className="w-full h-64 p-2 bg-gray-700 text-white rounded-md border border-gray-600"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Run Code
          </button>
        </div>
        
        {/* Registers Panel */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2">Registers</h2>
          <div className="grid grid-cols-2 gap-2">
            {registers.map((reg, idx) => (
              <div key={idx} className="flex justify-between bg-gray-700 p-2 rounded-md">
                <span className="text-gray-400">{reg.name}</span>
                <span className="text-white">{reg.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Memory Panel */}
      <div className="bg-gray-800 p-4 mt-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-2">Memory</h2>
        {memory.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {memory.map((mem, idx) => (
              <div key={idx} className="flex justify-between bg-gray-700 p-2 rounded-md">
                <span className="text-gray-400">{mem.address}</span>
                <span className="text-white">{mem.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No memory updates</p>
        )}
      </div>
    </div>
  );
}
