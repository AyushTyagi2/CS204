import { useState, useEffect } from "react";

const Memory = ({ data, className = "" }) => {
  const MEMORY_SIZE = 1024; // Number of memory words
  const [memory, setMemory] = useState(Array(MEMORY_SIZE).fill("0x00000000"));

  useEffect(() => {
    if (data?.memory) {
      // Update memory values from data
      const updatedMemory = Array(MEMORY_SIZE)
        .fill(0)
        .map((_, index) => {
          const addr = index * 4; // Word-aligned memory addresses
          return data.memory[addr] !== undefined
            ? `0x${data.memory[addr].toString(16).padStart(8, "0")}`
            : "0x00000000";
        });

      setMemory(updatedMemory);
    }
  }, [data]); // Update when new memory data arrives

  return (
    <div className={`w-full h-full bg-gray-700 p-4 ${className}`}>
      <h2 className="text-lg font-bold mb-2">Memory</h2>

      {/* Scrollable Memory List */}
      <div className="h-full overflow-y-auto memory-section scrollbar-hide border border-gray-600 rounded-lg p-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          {memory.map((value, index) => (
            <div key={index} className="flex justify-between p-1 bg-gray-800 rounded">
              <span className="text-gray-400">0x{(index * 4).toString(16).padStart(8, "0")}</span>
              <span className="font-mono text-green-400">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Memory;
