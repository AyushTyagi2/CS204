// app/components/InstructionDetails.jsx
import React from 'react';

export default function InstructionDetails({ state }) {
  return (
    <div>
      <div className="mb-2 border-b">
        <h4 className="font-semibold text-sm">IF Stage</h4>
        <pre className="text-xs">{JSON.stringify(state.IF, null, 2)}</pre>
      </div>
      <div className="mb-2 border-b">
        <h4 className="font-semibold text-sm">ID Stage</h4>
        <pre className="text-xs">{JSON.stringify(state.ID, null, 2)}</pre>
      </div>
      <div className="mb-2 border-b">
        <h4 className="font-semibold text-sm">EX Stage</h4>
        <pre className="text-xs">{JSON.stringify(state.EX, null, 2)}</pre>
      </div>
      <div className="mb-2 border-b">
        <h4 className="font-semibold text-sm">MEM Stage</h4>
        <pre className="text-xs">{JSON.stringify(state.MEM, null, 2)}</pre>
      </div>
      <div>
        <h4 className="font-semibold text-sm">WB Stage</h4>
        <pre className="text-xs">{JSON.stringify(state.WB, null, 2)}</pre>
      </div>
    </div>
  );
}