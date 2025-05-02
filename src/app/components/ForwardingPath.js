// app/components/ForwardingPaths.jsx
"use client";

import React from 'react';

export default function ForwardingPaths({ forwarding }) {
  return (
    <div>
      {forwarding.length > 0 ? (
        <ul className="list-disc pl-5 text-xs">
          {forwarding.map((path, index) => (
            <li key={index}>
              Forwarding from {path.fromStage} to {path.toStage} for register {path.register} (value: {path.value})
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs">No forwarding occurred.</p>
      )}
    </div>
  );
}