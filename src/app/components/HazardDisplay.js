// app/components/HazardDisplay.jsx
import React from 'react';

export default function HazardDisplay({ hazards }) {
  return (
    <div>
      {hazards.data && (
        <div className="text-red-500 mb-2">
          <h4 className="font-semibold text-sm">Data Hazard</h4>
          <pre className="text-xs">{JSON.stringify(hazards.data, null, 2)}</pre>
        </div>
      )}
      {hazards.control && (
        <div className="text-orange-500">
          <h4 className="font-semibold text-sm">Control Hazard</h4>
          <pre className="text-xs">{JSON.stringify(hazards.control, null, 2)}</pre>
        </div>
      )}
      {!hazards.data && !hazards.control && <p className="text-xs">No hazards detected.</p>}
    </div>
  );
}