"use client";
import React, { useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import RegisterFile from "../components/registers";
import MemoryFile from "../components/memory";
import ClockCycleWave from "../components/clock_cycle.js";
import Home from "./helper";
import { useRouter } from 'next/navigation';
import SimulatorRunner from "./pipeline";
import BufferSimulator from "./buffer";
import Forward from "./forward";
import PipelineVisualizer from "./predictor";
import Predictor from "./predict";
 
const VenusEditor = () => {
    const [activeTab, setActiveTab] = useState("Editor");
    const [editorContent, setEditorContent] = useState(""); // Code input state
    const [showRegisters, setShowRegisters] = useState(true); // Toggle between Registers and Memory
    const[execution_output,setexecution_output] = useState(null);
     const [parsedInstructions, setParsedInstructions] = useState([]); // Store parsed instructions
     const router = useRouter();
    // Function to import and parse the latest .mc file
    const importMCFile = async () => {
        try {
            const response = await fetch("/api/read");
            const data = await response.json();
    
            if (!data.success) throw new Error("Failed to fetch .mc file");
    
            const lines = data.data.trim().split("\n");
    
            const instructions = lines
                .map((line) => {
                    if (line.includes("Done_assembling")) return null;
                    const parts = line.split(" , ");
                    if (parts.length < 2) return null;
    
                    return {
                        pc: parts[0]?.split(" ")[0].trim() || "",
                        machineCode: parts[0].trim().slice(4),
                        basicCode: parts[1]?.split("#")[0].trim() || "",
                    };
                })
                .filter(Boolean);
    
            setParsedInstructions(instructions);
        } catch (error) {
            console.error("Error fetching .mc file:", error);
        }
    };
    
    useEffect(() => {
        const fetchExecutionOutput = async () => {
            try {
                const response = await fetch("/api/execution");
                const data = await response.json();
                if (response.ok) {
                    setexecution_output(data);
                } else {
                    console.error("Failed to load execution output:", data.error);
                }
            } catch (error) {
                console.error("Error fetching execution_output.json:", error);
            }
        };
    
        fetchExecutionOutput();
        const interval = setInterval(fetchExecutionOutput, 2000); // Poll every 2 seconds
    
        return () => clearInterval(interval); // Cleanup interval on unmount
    }, []);
    

    const handleSimulate = async () => {
        try {
            const response = await fetch("/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: editorContent }),
            });

            const data = await response.json();
            console.log("Server Response:", data);

            
            importMCFile();
        } catch (error) {
            console.error("Error:", error);
            alert("Simulation failed!");
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[#191919] text-white font-sans">
            {/* Header */}
            <header className="bg-[#191919] p-4 flex items-center">
                <div className="flex space-x-4">
                    <span className="text-lg font-semibold">CHOMU</span>
                    <button className={`px-3 py-1 rounded-md ${activeTab === "Editor" ? "bg-[#DF7E08]" : "hover:bg-gray-700"}`} onClick={() => setActiveTab("Editor")}>
                        Editor
                    </button>
                    <button className={`px-3 py-1 rounded-md ${activeTab === "Simulator" ? "bg-[#df7e08]" : "hover:bg-gray-700"}`} onClick={() => setActiveTab("Simulator")}>
                        Simulator
                    </button>
                    <button className={`px-3 py-1 rounded-md ${activeTab === "Pipeline" ? "bg-[#DF7E08]" : "hover:bg-gray-700"}`}onClick={() => setActiveTab("Pipeline")}>
                          Pipeline
                        </button>
                        <button className={`px-3 py-1 rounded-md ${activeTab === "Predictor" ? "bg-[#DF7E08]" : "hover:bg-gray-700"}`}onClick={() => setActiveTab("Predictor")}>
                          Predictor
                        </button>
                        <SimulatorRunner/>
                        <Forward/>
                        <BufferSimulator/>
                        <Predictor/>

                        </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-col flex-grow overflow-hidden">
                {/* Editor Tab */}
                {activeTab === "Editor" && (
                    <div className="flex flex-col flex-grow">
                        <div className="bg-[#2b2b2b] p-4 flex items-center">
                            <span className="mr-4">Active File: null</span>
                            <button className="px-4 py-2 bg-[#df7e08] rounded-md mr-2 hover:bg-teal-600">Save</button>
                            <button className="px-4 py-2 bg-[#df7e08] rounded-md hover:bg-gray-500">Close</button>
                            <ClockCycleWave clock_cycles={execution_output?.clock_cycles ?? 0} />
</div>
                        {/* Monaco Editor Area */}
                        <div className="flex-grow bg-gray-800 memory-section relative overflow-auto">
                            <Editor
                                height="100%"
                                defaultLanguage="assembly"  // Customize if needed
                                theme="hc-black"
                                value={editorContent}
                                onChange={(value) => setEditorContent(value)}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    automaticLayout: true,
                                    scrollbar: { vertical: "auto" },
                                    wordWrap: "on",
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Simulator Tab */}
                {activeTab === "Simulator" && (
                    <div className="flex flex-grow overflow-hidden">
                        {/* Left Panel */}
                        <div className="flex flex-col w-3/4 bg-[#191919] p-4 overflow-auto">
                            <button onClick={handleSimulate} className="bg-[#df7e08] text-white px-4 py-2 rounded-md mb-4">
                                Assemble & Simulate from Editor
                            </button>

                           <table className="w-full border-collapse border text-center border-gray-600 text-[#dadbdc]">
                                <thead>
                                    <tr className="bg-[#191919">
                                        <th className="border border-gray-500 px-4 py-2">PC</th>
                                        <th className="border border-gray-500 px-4 py-2">Machine Code</th>
                                        <th className="border border-gray-500 px-4 py-2">Basic Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedInstructions.map((inst, index) => (
                                        <tr key={index} className="bg-[#2b2b2b]">
                                            <td className="border border-gray-600 px-4 py-2">{inst.pc}</td>
                                            <td className="border border-gray-600 px-4 py-2">{inst.machineCode}</td>
                                            <td className="border border-gray-600 px-4 py-2">{inst.basicCode}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>


                            {/* Console Output */}
                            {/*<div className="mt-4">
                                <div className="font-semibold mb-2">Console Output</div>
                                <div className="border border-gray-700 p-2 overflow-auto h-40"></div>
                            </div>

            
                            <div className="mt-4 flex space-x-4">
                                <button className="px-3 py-1 rounded-md hover:bg-gray-700">Copy!</button>
                                <button className="px-3 py-1 rounded-md hover:bg-gray-700">Download!</button>
                                <button className="px-3 py-1 rounded-md hover:bg-gray-700">Clear!</button>
                            </div>*/}
                        </div>
                        

                        {/* Right Panel (Registers & Memory) */}
                        <div className="w-1/4 bg-[#191919] p-4 overflow-auto memory-section">
                            <div className="flex space-x-2 mb-4">
                                <button onClick={() => setShowRegisters(true)} className={`px-2 py-1 rounded-md ${showRegisters ? "bg-[#df7e08]" : "hover:bg-gray-600"}`}>
                                    Registers
                                </button>
                                <button onClick={() => setShowRegisters(false)} className={`px-2 py-1 rounded-md ${!showRegisters ? "bg-[#df7e08]" : "hover:bg-gray-600"}`}>
                                    Memory
                                </button>
                            </div>

                            {/* Registers / Memory Toggle */}
                            {showRegisters ? (
                                <RegisterFile className="h-64 overflow-y-auto memory-section scrollbar-hide" data={execution_output} />
                            ) : (
                                <MemoryFile className="h-64 overflow-y-auto memory-section scrollbar-hide" data={execution_output} />
                            )}

                            {/* Display Settings */}
                            <div className="mt-4 flex items-center justify-between">
                                <div>Display</div>
                                <select className="bg-gray-800 text-white rounded-md">
                                    <option>Hex</option>
                                    <option>Decimal</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}{activeTab === "Pipeline" && (
                    <div className="flex-grow bg-[#191919] overflow-auto p-4">
                      <Home/>
                    </div>
                  )}{activeTab == "Predictor"&&(
                    <div className="">
                      <PipelineVisualizer/>
                    </div>
                  )}
                  
                <footer className=" text-white text-center p-2 ">
      <p>© {new Date().getFullYear()} ADDA. All rights reserved.</p>
    </footer>
            </main>
            
        </div>
        
    );
};

export default VenusEditor;
