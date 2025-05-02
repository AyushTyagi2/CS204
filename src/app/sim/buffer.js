"use client";
import { useState } from "react";

export default function BufferSimulator() {
  const [buffer, setbuffer] = useState(false);

  const handleToggle = async () => {
    const newValue = !buffer;
    setbuffer(newValue);

    try {
      await fetch("/api/setsimulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Buffer: newValue }), // store as true/false
      });
      console.log("🚀 Posted simulator mode:", newValue ? "Phase 3" : "Phase 1");
    } catch (err) {
      console.error("❌ Failed to update simulator mode:", err);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-gray-700 font-medium">Buffers</span>
      <div
        className={`w-16 h-8 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
          buffer ? "bg-green-500" : "bg-gray-300"
        }`}
        onClick={handleToggle}
      >
        <div
          className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
            buffer ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </div>
    </div>
  );
}
