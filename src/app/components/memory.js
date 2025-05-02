"use client";
import { useState, useEffect } from "react";

const Memory = ({ data, className = "" }) => {
  const MEMORY_SIZE = 1024; // Number of memory words
  const [memory, setMemory] = useState(Array(MEMORY_SIZE).fill("0x00000000"));

  useEffect(() => {
    if (data?.memory) {
      const memoryData = data.memory;
      const BASE_ADDRESS = 0x10000000;
  
      const updatedMemory = Array(MEMORY_SIZE)
        .fill(0)
        .map((_, index) => {
          const addr = BASE_ADDRESS + index * 4;
          const hexKey = `0x${addr.toString(16).padStart(8, "0")}`;
  
          const value = memoryData[hexKey] !== undefined ? memoryData[hexKey] : 0;
          return `0x${value.toString(16).padStart(8, "0")}`;
        });
  
      setMemory(updatedMemory);
    }
  }, [data]);
  

  return (
    <div className={`w-full h-full bg-[#191919] p-4 ${className}`}>
      <h2 className="text-lg font-bold mb-2">Memory</h2>

      {/* Scrollable Memory List */}
      <div className="h-full overflow-y-auto memory-section scrollbar-hide border border-gray-600 rounded-lg p-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          {memory.map((value, index) => (
            <div key={index} className="flex justify-between p-1 bg-[#2b2b2b] rounded">
              <span className="text-gray-400">0x{(index * 4).toString(16).padStart(8, "0")}</span>
              <span className="font-mono text-[#df7e08]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Memory;
