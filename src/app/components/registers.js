"use client";
import { useState, useEffect } from "react";
const RegisterFile = ({ data, className = "" }) => {
  const [registers, setRegisters] = useState(Array(32).fill("0x00000000"));

  useEffect(() => {
    if (data?.registers) {
      // Convert JSON register values to hexadecimal format
      const updatedRegisters = Array(32)
        .fill(0)
        .map((_, index) => {
          const regKey = `R${index}`;
          return data.registers[regKey] !== undefined
            ? `0x${data.registers[regKey].toString(16).padStart(8, "0")}`
            : "0x00000000";
        });

      setRegisters(updatedRegisters);
    }
  }, [data]); // Update when new data arrives

  return (
    <div className={`w-full h-full bg-gray-700 p-4 ${className}`}>
      <h2 className="text-lg font-bold mb-2">Registers</h2>

      {/* Scrollable Register List */}
      <div className="h-full memory-section overflow-y-auto scrollbar-hide border border-gray-600 rounded-lg p-2">
        <div className="grid grid-cols-1 gap-2 text-sm">
          {registers.map((value, index) => (
            <div key={index} className="flex justify-between p-1 bg-gray-800 rounded">
              <span className="text-gray-400">x{index}</span>
              <span className="font-mono text-blue-400">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RegisterFile;
