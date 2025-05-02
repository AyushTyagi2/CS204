'use client';
import { useEffect, useState } from 'react';
import PipelineStepVisualizer from '../components/pipelineVisualizer'; // ✅ Correct component

export default function Phase3Page() {
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    fetch('/api/pipeline/timeline')
      .then((res) => res.json())
      .then((data) => setTimeline(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-orange-600">RISC-V Pipeline Timeline</h1>

      {timeline.length > 0 ? (
        <PipelineStepVisualizer timeline={timeline} /> // ✅ Changed from TimelineGrid to PipelineStepVisualizer
      ) : (
        <p className="text-gray-500">Loading or no data available...</p>
      )}
    </div>
  );
}
