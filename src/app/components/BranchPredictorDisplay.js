// app/components/BranchPredictorDisplay.jsx
"use client";
import React from 'react';

export default function BranchPredictorDisplay({ predictorState }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h4 className="font-semibold text-sm mb-1">PHT (Pattern History Table)</h4>
        <pre className="text-xs">{JSON.stringify(predictorState.pht, null, 2)}</pre>
      </div>
      <div>
        <h4 className="font-semibold text-sm mb-1">BTB (Branch Target Buffer)</h4>
        <pre className="text-xs">{JSON.stringify(predictorState.btb, null, 2)}</pre>
      </div>
    </div>
  );
}