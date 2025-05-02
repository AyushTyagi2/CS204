// app/components/PipelineDiagram.jsx
import React from 'react';

export default function PipelineDiagram({ stage, data }) {
  return (
    <div className="p-2">
      <h3 className="font-semibold text-sm">{stage} Stage</h3>
      {stage === 'IF' && (
        <div>
          <p className="text-xs">Instruction: {data.instruction}</p>
          <p className="text-xs">PC: {data.pc}</p>
        </div>
      )}
      {stage === 'ID' && (
        <div>
          <p className="text-xs">Instruction: {data.instruction}</p>
          <pre className="text-xs">{JSON.stringify(data.decoded, null, 2)}</pre>
        </div>
      )}
      {stage === 'EX' && (
        <div>
          <p className="text-xs">ALU Result: {data.aluResult}</p>
          {/* Add more EX stage details later */}
        </div>
      )}
      {stage === 'MEM' && (
        <div>
          <p className="text-xs">Address: {data.memoryAddress}</p>
          <p className="text-xs">Data Read: {data.dataRead}</p>
          {/* Add more MEM stage details later */}
        </div>
      )}
      {stage === 'WB' && (
        <div>
          <p className="text-xs">Write Reg: {data.writeRegister}</p>
          <p className="text-xs">Value: {data.writeValue}</p>
          {/* Add more WB stage details later */}
        </div>
      )}
    </div>
  );
}