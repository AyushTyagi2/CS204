import React from 'react';

const InterstageBuffer = React.forwardRef(({ fromStage, toStage, data }, ref) => {
  // Color mapping for stage-specific styling
  const colorMap = {
    IF: "green",
    ID: "blue",
    EX: "yellow",
    MEM: "red",
    WB: "indigo"
  };
  
  const fromColor = colorMap[fromStage] || "gray";
  
  // If no data, show empty buffer
  if (!data) {
    return (
      <div 
        ref={ref}
        className="w-36 h-20 flex items-center justify-center relative"
      >
        <div className="w-full h-2 bg-gray-600 absolute"></div>
        <div className="text-gray-400 text-xs mt-6">Empty Buffer</div>
      </div>
    );
  }
  
  // Add special styling if data is being forwarded
  const forwardedClass = data.forwarded ? "border-2 border-yellow-500 ring-2 ring-yellow-400 ring-opacity-50" : "";
  
  return (
    <div
      ref={ref}
      className={`bg-${fromColor}-900 bg-opacity-30 rounded-md px-2 py-1 w-36 h-20 text-center flex flex-col justify-center text-white relative border border-${fromColor}-500 ${forwardedClass}`}
    >
      {/* Buffer connector line */}
      <div className="absolute w-full h-2 bg-gray-600 top-1/2 -translate-y-1/2 z-0"></div>
      
      {/* Buffer title */}
      <div className="font-semibold text-xs mb-1 z-10">
        {fromStage} → {toStage}
      </div>
      
      {/* Buffer data */}
      <div className="flex flex-col items-center z-10 bg-gray-800 bg-opacity-70 rounded p-1">
        {data.instruction && (
          <div className="text-xs overflow-hidden text-ellipsis max-w-24">
            Instr: {typeof data.instruction === 'number' ? `0x${data.instruction.toString(16)}` : data.instruction}
          </div>
        )}
        
        {data.hazard && (
          <div className="text-xs font-bold mt-1">
            ⚠ <span className="text-red-400">Hazard: {data.hazard}</span>
          </div>
        )}
        
        {data.forwarded && (
          <div className="text-xs font-bold mt-1">
            ⚡ <span className="text-yellow-400">Forwarded</span>
          </div>
        )}
        
        {data.op1 && <div className="text-xs mt-1">Op1: {data.op1}</div>}
        {data.op2 && <div className="text-xs mt-1">Op2: {data.op2}</div>}
      </div>
    </div>
  );
});

// Display name for React DevTools
InterstageBuffer.displayName = 'InterstageBuffer';

export default InterstageBuffer;