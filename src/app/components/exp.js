"use client";
import React, { useState, useEffect, useRef } from 'react';

// Import the InterstageBuffer component from its file
import InterstageBuffer from './interstage';

const PipelineSimulator = () => {
  const [pipelineData, setPipelineData] = useState([]);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [instructionMap, setInstructionMap] = useState({});
  const [simulationComplete, setSimulationComplete] = useState(false);
  const bufferRefs = useRef({});
  const [arrows, setArrows] = useState([]);
  const containerRef = useRef(null);
  const [completedInstructions, setCompletedInstructions] = useState(0);
  const [lastProcessedStep, setLastProcessedStep] = useState(null);

  // Effect for initial data fetch
  useEffect(() => {
    async function fetchPipelineData() {
      try {
        const [response1, response2] = await Promise.all([
          fetch('/api/pipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'step' }),
          }),
          fetch('/api/pipe/pipe_1')
        ]);
        
        if (!response1.ok || !response2.ok) {
          throw new Error('Failed to fetch one or both pipeline data sources');
        }

        const data = await response1.json();
        setPipelineData(data);
        
        const data1 = await response2.json();
        
        const pcMap = {};
        data1.forEach(entry => {
          const instr = entry?.instruction;
          if (instr?.pc && instr?.instruction) {
            pcMap[instr.pc] = instr.instruction;
          }
        });

        setInstructionMap(pcMap);
      } catch (error) {
        console.error('Error fetching pipeline data:', error);
      }
    }
    fetchPipelineData();
  }, []);

  // Update completed instructions count whenever pipelineData changes
  useEffect(() => {
    // Count unique instructions that have reached WB stage
    const completedPCs = new Set();
    pipelineData.forEach(cycle => {
      if (cycle.WB && cycle.WB.pc) {
        completedPCs.add(cycle.WB.pc);
      }
    });
    setCompletedInstructions(completedPCs.size);
  }, [pipelineData]);

  // Effect for drawing forwarding arrows with improved positioning
  useEffect(() => {
    const updateArrows = () => {
      if (!containerRef.current) return;
      
      // Get container offsets for better positioning
      const containerRect = containerRef.current.getBoundingClientRect();
      const newArrows = [];
      
      // Process each cycle and check for forwarding
      for (let i = 0; i < pipelineData.length - 1; i++) {
        const cycle = pipelineData[i];
        
        // Skip if no forwarding
        if (!cycle || !cycle.forwarded) continue;
        
        // Determine forwarding type and get references
        if (cycle.forwarded === 1 || cycle.forwarded === 3) {
          // EX to ID forwarding (ALU result)
          // Find the next cycle's ID stage that needs the result
          const exRef = bufferRefs.current[`${i}_EX`];
          
          // Look for the next cycle with an ID stage
          let nextCycleWithID = -1;
          for (let j = i + 1; j < Math.min(i + 3, pipelineData.length); j++) {
            if (pipelineData[j] && pipelineData[j].ID) {
              nextCycleWithID = j;
              break;
            }
          }
          
          if (nextCycleWithID !== -1) {
            const idRef = bufferRefs.current[`${nextCycleWithID}_ID`];
            
            if (exRef?.current && idRef?.current) {
              const exRect = exRef.current.getBoundingClientRect();
              const idRect = idRef.current.getBoundingClientRect();
              
              // Create arrow data with relative positioning
              newArrows.push({
                x1: exRect.left - containerRect.left + (exRect.width * 0.25),
                y1: exRect.top - containerRect.top,
                x2: idRect.left - containerRect.left + (idRect.width * 0.75),
                y2: idRect.bottom - containerRect.top,
                color: '#FF5733',
                label: 'EX → ID',
                type: 'ALU Result'
              });
            }
          }
        }
        
        // If forwarded is 2 or 3, we have MEM to ID forwarding
        if (cycle.forwarded === 2 || cycle.forwarded === 3) {
          const memRef = bufferRefs.current[`${i}_MEM`];
          
          // Look for the next cycle with an ID stage
          let nextCycleWithID = -1;
          for (let j = i + 1; j < Math.min(i + 3, pipelineData.length); j++) {
            if (pipelineData[j] && pipelineData[j].ID) {
              nextCycleWithID = j;
              break;
            }
          }
          
          if (nextCycleWithID !== -1) {
            const idRef = bufferRefs.current[`${nextCycleWithID}_ID`];
            
            if (memRef?.current && idRef?.current) {
              const memRect = memRef.current.getBoundingClientRect();
              const idRect = idRef.current.getBoundingClientRect();
              
              newArrows.push({
                x1: memRect.left - containerRect.left + (memRect.width * 0.25),
                y1: memRect.top - containerRect.top,
                x2: idRect.left - containerRect.left + (idRect.width * 0.75),
                y2: idRect.bottom - containerRect.top,
                color: '#3366FF',
                label: 'MEM → ID',
                type: 'Memory Load'
              });
            }
          }
        }
      }
      
      setArrows(newArrows);
    };
    
    // Add small delay to ensure DOM elements are properly rendered
    const timer = setTimeout(updateArrows, 200);
    return () => clearTimeout(timer);
  }, [pipelineData, currentCycle]);

  // Helper function to check if a response is the end of simulation
  const isEndOfSimulation = (data) => {
    return (
      !data || 
      data.length === 0 || 
      (data.length === 1 && Object.keys(data[0]).length <= 1) ||
      (data.length === 1 && !data[0].IF && !data[0].ID && !data[0].EX && !data[0].MEM && !data[0].WB) ||
      (lastProcessedStep && JSON.stringify(data) === JSON.stringify(lastProcessedStep))
    );
  };

  // Unified control handler with improved end detection
  const handleControl = async (action) => {
    if (action === 'play') {
      setIsPlaying(true);
      setSimulationComplete(false);
  
      const id = setInterval(async () => {
        try {
          const res = await fetch('/api/pipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'step' })
          });
  
          if (!res.ok) throw new Error('Failed to fetch step data');
  
          const newStep = await res.json();
          
          // Store last processed step to detect repetition
          setLastProcessedStep(newStep);
  
          // Improved check for end of simulation
          if (isEndOfSimulation(newStep)) {
            clearInterval(id);
            setIsPlaying(false);
            setSimulationComplete(true);
            console.log("End of pipeline simulation reached");
            return;
          }
  
          // Filter out garbage cycles with minimal content
          const filteredNewStep = newStep.filter(step => 
            step && (
              Object.keys(step).length > 1 || 
              (step.IF || step.ID || step.EX || step.MEM || step.WB)
            )
          );
          
          if (filteredNewStep.length === 0) {
            clearInterval(id);
            setIsPlaying(false);
            setSimulationComplete(true);
            console.log("No valid steps remaining");
            return;
          }
          
          // Check if we're just getting the same data repeatedly
          const lastCycle = pipelineData[pipelineData.length - 1];
          const newLastCycle = filteredNewStep[filteredNewStep.length - 1];
          
          if (lastCycle && newLastCycle && 
              JSON.stringify(lastCycle) === JSON.stringify(newLastCycle)) {
            console.log("Detected repeating data, ending simulation");
            clearInterval(id);
            setIsPlaying(false);
            setSimulationComplete(true);
            return;
          }
  
          setPipelineData(prev => [...prev, ...filteredNewStep]);
          setCurrentCycle(prev => prev + filteredNewStep.length);
  
        } catch (err) {
          console.error(`Error during play:`, err);
          clearInterval(id);
          setIsPlaying(false);
        }
      }, 800); // Adjust delay (ms) to control animation speed
  
      setIntervalId(id);
    }
    else if (action === 'pause') {
      clearInterval(intervalId);
      setIsPlaying(false);
    }
    else if (action === 'stop') {
      clearInterval(intervalId);
      setIsPlaying(false);
      setCurrentCycle(0);
      setSimulationComplete(false);
      setLastProcessedStep(null);
  
      try {
        const res = await fetch('/api/pipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stop' })
        });
  
        if (!res.ok) throw new Error('Failed to fetch updated pipeline data');
        const resetData = await res.json();
        setPipelineData(resetData);
  
      } catch (err) {
        console.error(`Error executing stop:`, err);
      }
    }
    else if (action === 'step') {
      try {
        const res = await fetch('/api/pipe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
  
        if (!res.ok) throw new Error('Failed to fetch updated pipeline data');
  
        const updatedData = await res.json();
        setLastProcessedStep(updatedData);
        
        // Check for end of simulation
        if (isEndOfSimulation(updatedData)) {
          setSimulationComplete(true);
          console.log("End of pipeline simulation reached");
          return;
        }
        
        // Filter out garbage cycles
        const filteredData = updatedData.filter(step => 
          step && (
            Object.keys(step).length > 1 || 
            (step.IF || step.ID || step.EX || step.MEM || step.WB)
          )
        );
        
        if (filteredData.length === 0) {
          setSimulationComplete(true);
          console.log("No valid steps remaining");
          return;
        }
        
        // Check if we're just getting the same data repeatedly
        const lastCycle = pipelineData[pipelineData.length - 1];
        const newLastCycle = filteredData[filteredData.length - 1];
        
        if (lastCycle && newLastCycle && 
            JSON.stringify(lastCycle) === JSON.stringify(newLastCycle)) {
          console.log("Detected repeating data, ending simulation");
          setSimulationComplete(true);
          return;
        }
        
        setPipelineData(prev => [...prev, ...filteredData]);
        setCurrentCycle(prev => prev + filteredData.length);
      } catch (err) {
        console.error(`Error executing step:`, err);
      }
    }
  };

  // Improved SVG Arrows with better labels and styling
  const ForwardingArrows = () => (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
      {arrows.map((arrow, idx) => (
        <g key={idx}>
          <defs>
            <marker
              id={`arrowhead-${idx}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={arrow.color || "#FF5733"} />
            </marker>
          </defs>
          {/* Improved curved path for better visibility */}
          <path
            d={`M ${arrow.x1} ${arrow.y1} 
               C ${arrow.x1 - 50} ${arrow.y1 - 40}, 
                 ${arrow.x2 + 50} ${arrow.y2 + 40}, 
                 ${arrow.x2} ${arrow.y2}`}
            stroke={arrow.color || "#FF5733"}
            strokeWidth="2"
            fill="none"
            markerEnd={`url(#arrowhead-${idx})`}
            strokeDasharray="5,3"
          />
          {/* Enhanced label with type information */}
          <g>
            <rect 
              x={(arrow.x1 + arrow.x2) / 2 - 50} 
              y={(arrow.y1 + arrow.y2) / 2 - 25} 
              width="100" 
              height="36" 
              fill="rgba(0,0,0,0.7)" 
              rx="5" 
              ry="5"
            />
            <text 
              x={(arrow.x1 + arrow.x2) / 2} 
              y={(arrow.y1 + arrow.y2) / 2 - 10}
              fontSize="12" 
              fill={arrow.color || "#FF5733"}
              textAnchor="middle"
              fontWeight="bold"
            >
              {arrow.label}
            </text>
            <text 
              x={(arrow.x1 + arrow.x2) / 2} 
              y={(arrow.y1 + arrow.y2) / 2 + 5}
              fontSize="10" 
              fill="white"
              textAnchor="middle"
            >
              {arrow.type}
            </text>
          </g>
        </g>
      ))}
    </svg>
  );

  // End of Pipeline Component
  const SimulationCompleteIndicator = () => (
    <div className="absolute bottom-4 right-4 bg-gradient-to-r from-green-600 to-green-800 p-4 rounded-lg shadow-lg text-white animate-pulse">
      <div className="flex items-center">
        <span className="text-2xl mr-2">✅</span>
        <div>
          <p className="font-bold text-lg">Pipeline Execution Complete</p>
          <p className="text-sm">All instructions have been processed</p>
        </div>
      </div>
    </div>
  );

  // Helper function to format instruction text
  const formatInstruction = (instrValue) => {
    if (!instrValue) return "Unknown";
    
    // If it's already a string, use it
    if (typeof instrValue === 'string') {
      return instrValue.substring(0, 12);
    }
    
    // If it's a number, format as hex
    return `0x${instrValue.toString(16)}`.substring(0, 12);
  };

  // Calculate accurate CPI
  const calculateCPI = () => {
    if (completedInstructions === 0) return "N/A";
    return ((currentCycle + 1) / completedInstructions).toFixed(2);
  };

  return (
    <div className="flex flex-col items-center p-8 bg-gray-800 text-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-extrabold mb-8 text-purple-400 drop-shadow-md">
        The Enchanted Instruction Journey
      </h1>

      {/* Clock Cycle and Stages */}
      <div 
        ref={containerRef}
        className="max-h-[600px] overflow-x-auto overflow-y-auto max-w-full relative"
      >
        {/* Forwarding arrows overlay */}
        <ForwardingArrows />
        
        {/* Show completion indicator when simulation is done */}
        {simulationComplete && <SimulationCompleteIndicator />}
        
        <div className="mb-8 min-w-[1600px]">
          {/* Pipeline Headers */}
          <div className="grid grid-cols-10 gap-2 items-center mb-2">
            <div className="font-semibold text-center text-lg text-gray-300">Cycle</div>
            <div className="font-semibold text-center text-lg text-green-400">Fetchy's Lookout (IF)</div>
            <div className="text-center text-sm text-green-300">✨Buffer</div>
            <div className="font-semibold text-center text-lg text-blue-400">Decody's Wisdom Tree (ID)</div>
            <div className="text-center text-sm text-blue-300">🔮Buffer</div>
            <div className="font-semibold text-center text-lg text-yellow-400">Magico's Workshop (EX)</div>
            <div className="text-center text-sm text-yellow-300">🌀Buffer</div>
            <div className="font-semibold text-center text-lg text-red-400">Libby's Grand Library (MEM)</div>
            <div className="text-center text-sm text-red-300">📜Buffer</div>
            <div className="font-semibold text-center text-lg text-indigo-400">Scribby's Scriptorium (WB)</div>
          </div>

          {/* Render the pipeline cycles with improved styling */}
          {pipelineData.slice(0, currentCycle + 1).map((entry, cycleIndex) => {
            // Skip rendering empty/garbage cycles
            if (!entry || (Object.keys(entry).length <= 1 && !entry.IF && !entry.ID && !entry.EX && !entry.MEM && !entry.WB)) {
              return null;
            }
            
            // Initialize refs for this cycle
            if (!bufferRefs.current[`${cycleIndex}_IF`]) {
              bufferRefs.current[`${cycleIndex}_IF`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_ID`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_EX`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_MEM`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_WB`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_IF_ID`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_ID_EX`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_EX_MEM`] = React.createRef();
              bufferRefs.current[`${cycleIndex}_MEM_WB`] = React.createRef();
            }
            
            // Extract cycle number - use explicit cycle property if available, otherwise use index
            const cycleNumber = cycleIndex + 1; // Always use index-based numbering for consistent display
            
            // Determine if this is the last cycle of the simulation
            const isLastCycle = simulationComplete && cycleIndex === pipelineData.length - 1;
            
            return (
              <div key={cycleIndex} className={`grid grid-cols-10 gap-2 items-center mb-4 ${isLastCycle ? 'relative' : ''}`}>
                {/* Cycle Number */}
                <div className={`bg-gray-700 rounded-lg p-2 flex items-center justify-center h-20 ${isLastCycle ? 'border-2 border-green-400' : ''}`}>
                  <span className="text-xl font-bold text-white">{cycleNumber}</span>
                </div>
                
                {/* IF stage */}
                <div 
                  ref={bufferRefs.current[`${cycleIndex}_IF`]}
                  className={`bg-green-900 bg-opacity-40 rounded-lg p-2 flex items-center w-36 h-20 justify-center ${
                    entry.IF?.Hazard === 'Control' ? 'border-2 border-red-500 shadow-lg shadow-red-500/50' : 
                    'border border-green-500'}`}
                >
                  {entry.IF ? (
                    <div className={`flex flex-col items-center justify-center w-full h-full rounded-md ${entry.IF.Hazard === 'Control' ? 'bg-red-900 bg-opacity-40' : 'bg-green-800 bg-opacity-40'}`}>
                      <span className="text-white text-xs font-bold">PC: {entry.IF.pc}</span>
                      <span className="text-white text-xs">
                        {formatInstruction(instructionMap[entry.IF.pc] || entry.IF.instruction)}
                      </span>
                      {entry.IF.Hazard === 'Control' && (
                        <span className="text-xs font-bold text-red-400 mt-1 flex items-center">
                          <span className="animate-pulse mr-1">⚠</span> Control Hazard
                        </span>
                      )}
                    </div>
                  ) : '-'}
                </div>

                {/* IF/ID Buffer */}
                <div ref={bufferRefs.current[`${cycleIndex}_IF_ID`]} className="relative">
                  <InterstageBuffer 
                    fromStage="IF" 
                    toStage="ID"
                    data={entry.InterstageBuffers?.IF_ID ? {
                      instruction: formatInstruction(entry.InterstageBuffers.IF_ID),
                      hazard: entry.IF?.Hazard
                    } : null}
                  />
                </div>
                
                {/* ID stage with enhanced data hazard highlighting */}
                <div 
                  ref={bufferRefs.current[`${cycleIndex}_ID`]}
                  className={`bg-blue-900 bg-opacity-40 rounded-lg p-2 flex items-center w-36 h-20 justify-center ${
                    entry.ID?.Hazard === 'Data' ? 'border-2 border-red-500 shadow-lg shadow-red-500/50' : 
                    entry.forwarded > 0 ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/50' : 
                    'border border-blue-500'}`}
                >
                  {entry.ID ? (
                    <div className={`flex flex-col items-center justify-center w-full h-full rounded-md ${
                      entry.ID.Hazard === 'Data' ? 'bg-red-900 bg-opacity-40' : 
                      entry.forwarded > 0 ? 'bg-yellow-900 bg-opacity-30' : 
                      'bg-blue-800 bg-opacity-40'}`}
                    >
                      <span className="text-white text-xs font-bold">PC: {entry.ID.pc}</span>
                      <span className="text-white text-xs">
                        {formatInstruction(instructionMap[entry.ID.pc] || entry.ID.instruction)}
                      </span>
                      {entry.ID.Hazard === 'Data' && (
                        <span className="text-xs font-bold text-red-400 mt-1 flex items-center">
                          <span className="animate-pulse mr-1">⚠</span> Data Hazard
                        </span>
                      )}
                      {entry.forwarded > 0 && (
                        <span className="text-xs font-bold text-yellow-400 mt-1 flex items-center">
                          <span className="animate-pulse mr-1">⚡</span> 
                          {entry.forwarded === 1 ? "EX Forward" : 
                           entry.forwarded === 2 ? "MEM Forward" : 
                           "EX+MEM Forward"}
                        </span>
                      )}
                    </div>
                  ) : '-'}
                </div>

                {/* ID/EX Buffer */}
                <div ref={bufferRefs.current[`${cycleIndex}_ID_EX`]} className="relative">
                  <InterstageBuffer
                    fromStage="ID"
                    toStage="EX"
                    data={entry.InterstageBuffers?.ID_EX ? {
                      instruction: formatInstruction(entry.InterstageBuffers.ID_EX),
                      hazard: entry.ID?.Hazard,
                      forwarded: entry.forwarded > 0 ? `Type: ${entry.forwarded}` : null
                    } : null}
                  />
                </div>

                {/* EX stage */}
                <div 
                  ref={bufferRefs.current[`${cycleIndex}_EX`]}
                  className={`bg-yellow-900 bg-opacity-40 rounded-lg p-2 flex items-center w-36 h-20 justify-center ${
                    entry.forwarded === 1 || entry.forwarded === 3 ? 'border-2 border-yellow-400 shadow-md shadow-yellow-400/30' : 
                    'border border-yellow-500'}`}
                >
                  {entry.EX ? (
                    <div className={`flex flex-col items-center justify-center w-full h-full rounded-md bg-yellow-800 bg-opacity-40 ${
                      entry.forwarded === 1 || entry.forwarded === 3 ? 'ring-1 ring-yellow-300' : ''}`}>
                      <span className="text-white text-xs font-bold">PC: {entry.EX.pc}</span>
                      <span className="text-white text-xs">
                        {formatInstruction(instructionMap[entry.EX.pc] || "Unknown")}
                      </span>
                      {(entry.EX.op1 !== undefined || entry.EX.op2 !== undefined) && (
                        <div className="flex space-x-1 text-white text-xs mt-1">
                         
                        </div>
                      )}
                      {(entry.forwarded === 1 || entry.forwarded === 3) && (
                        <span className="text-yellow-300 text-xs mt-1">Forwarding</span>
                      )}
                    </div>
                  ) : '-'}
                </div>

                {/* EX/MEM Buffer */}
                <div ref={bufferRefs.current[`${cycleIndex}_EX_MEM`]} className="relative">
                  <InterstageBuffer 
                    fromStage="EX" 
                    toStage="MEM"
                    data={entry.InterstageBuffers?.EX_MEM ? {
                      instruction: formatInstruction(entry.InterstageBuffers.EX_MEM),
                      
                      forwarding: (entry.forwarded === 1 || entry.forwarded === 3) ? true : false
                    } : null}
                  />
                </div>

                {/* MEM stage */}
                <div 
                  ref={bufferRefs.current[`${cycleIndex}_MEM`]}
                  className={`bg-red-900 bg-opacity-40 rounded-lg p-2 flex items-center w-36 h-20 justify-center ${
                    entry.forwarded === 2 || entry.forwarded === 3 ? 'border-2 border-blue-400 shadow-md shadow-blue-400/30' : 
                    'border border-red-500'}`}
                >
                  {entry.MEM ? (
                    <div className={`flex flex-col items-center justify-center w-full h-full rounded-md bg-red-800 bg-opacity-40 ${
                      entry.forwarded === 2 || entry.forwarded === 3 ? 'ring-1 ring-blue-300' : ''}`}>
                      <span className="text-white text-xs font-bold">PC: {entry.MEM.pc}</span>
                      <span className="text-white text-xs">
                        {formatInstruction(instructionMap[entry.MEM.pc] || "Unknown")}
                      </span>
                      {(entry.forwarded === 2 || entry.forwarded === 3) && (
                        <span className="text-blue-300 text-xs mt-1">Forwarding</span>
                      )}
                      {entry.MEM.addr && <span className="text-white text-xs">Addr: {entry.MEM.addr}</span>}
                    </div>
                  ) : '-'}
                </div>

                {/* MEM/WB Buffer */}
                <div ref={bufferRefs.current[`${cycleIndex}_MEM_WB`]} className="relative">
                  <InterstageBuffer 
                    fromStage="MEM" 
                    toStage="WB"
                    data={entry.InterstageBuffers?.MEM_WB ? {
                      instruction: formatInstruction(entry.InterstageBuffers.MEM_WB),
                      forwarding: (entry.forwarded === 2 || entry.forwarded === 3) ? true : false
                    } : null}
                  />
                </div>

                {/* WB stage */}
                <div 
                  ref={bufferRefs.current[`${cycleIndex}_WB`]}
                  className={`bg-indigo-900 bg-opacity-40 rounded-lg p-2 flex items-center w-36 h-20 justify-center ${
                    entry.WB ? 'border border-indigo-500' : 'border border-gray-600'}`}
                >
                  {entry.WB ? (
                    <div className="flex flex-col items-center justify-center w-full h-full rounded-md bg-indigo-800 bg-opacity-40">
                      <span className="text-white text-xs font-bold">PC: {entry.WB.pc}</span>
                      <span className="text-white text-xs">
                        {formatInstruction(instructionMap[entry.WB.pc] || "Unknown")}
                      </span>
                      {entry.WB.result !== undefined && (
                        <span className="text-white text-xs">Result: {entry.WB.result}</span>
                      )}
                      {entry.WB.dest && (
                        <span className="text-white text-xs">Dest: {entry.WB.dest}</span>
                      )}
                    </div>
                  ) : '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Controls and Statistics */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mt-8 bg-gray-700 rounded-lg p-4">
        {/* Pipeline Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-4 md:mb-0">
          <button 
            onClick={() => handleControl('step')}
            disabled={isPlaying || simulationComplete}
            className={`px-4 py-2 bg-purple-600 text-white rounded-md flex items-center shadow-md hover:bg-purple-700 transition-colors ${isPlaying || simulationComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="mr-2">▶|</span> Step
          </button>
          <button 
            onClick={() => handleControl('play')}
            disabled={isPlaying || simulationComplete}
            className={`px-4 py-2 bg-green-600 text-white rounded-md flex items-center shadow-md hover:bg-green-700 transition-colors ${isPlaying || simulationComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="mr-2">▶</span> Play
          </button>
          <button 
            onClick={() => handleControl('pause')}
            disabled={!isPlaying}
            className={`px-4 py-2 bg-yellow-600 text-white rounded-md flex items-center shadow-md hover:bg-yellow-700 transition-colors ${!isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="mr-2">⏸</span> Pause
          </button>
          <button 
            onClick={() => handleControl('stop')}
            className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center shadow-md hover:bg-red-700 transition-colors"
          >
            <span className="mr-2">⏹</span> Reset
          </button>
        </div>
        
        {/* Performance Stats */}
        <div className="flex flex-col items-center md:items-end bg-gray-800 p-3 rounded-lg">
          <h3 className="text-lg font-bold text-purple-300 mb-2">Pipeline Stats</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <span className="text-gray-300">Cycles:</span>
            <span className="text-right font-mono text-green-400">{currentCycle + 1}</span>
            
            <span className="text-gray-300">Instructions:</span>
            <span className="text-right font-mono text-blue-400">{completedInstructions}</span>
            
            <span className="text-gray-300">CPI:</span>
            <span className="text-right font-mono text-yellow-400">{calculateCPI()}</span>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 bg-gray-700 p-4 rounded-lg w-full max-w-4xl">
        <h3 className="text-lg font-bold text-purple-300 mb-2">Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 mr-2"></div>
            <span className="text-white text-sm">Data Hazard</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 mr-2"></div>
            <span className="text-white text-sm">Forwarding Active</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 border-2 border-yellow-400 mr-2"></div>
            <span className="text-white text-sm">Control Hazard</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 mr-2"></div>
            <span className="text-white text-sm">IF Stage</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-600 mr-2"></div>
            <span className="text-white text-sm">ID Stage</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-600 mr-2"></div>
            <span className="text-white text-sm">EX Stage</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-600 mr-2"></div>
            <span className="text-white text-sm">MEM Stage</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-indigo-600 mr-2"></div>
            <span className="text-white text-sm">WB Stage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineSimulator;