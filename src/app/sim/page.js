"use client";
import React, { useState } from "react";
import { Editor } from "@monaco-editor/react";
import RegisterFile from "../components/registers";
import MemoryFile from "../components/memory";
import execution_output from "@/executables/execution_output.json";

const VenusEditor = () => {
    const [activeTab, setActiveTab] = useState("Editor");
    const [editorContent, setEditorContent] = useState(""); // Code input state
    const [showRegisters, setShowRegisters] = useState(true); // Toggle between Registers and Memory

     const [parsedInstructions, setParsedInstructions] = useState([]); // Store parsed instructions

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
    


    const handleSimulate = async () => {
        try {
            const response = await fetch("/api/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: editorContent }),
            });

            const data = await response.json();
            console.log("Server Response:", data);

            if (data.success) {
                alert("Simulation Successful!");
            } else {
                alert("Error in simulation");
            }
            importMCFile();
        } catch (error) {
            console.error("Error:", error);
            alert("Simulation failed!");
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white font-sans">
            {/* Header */}
            <header className="bg-gray-800 p-4 flex items-center">
                <div className="flex space-x-4">
                    <span className="text-lg font-semibold">Venus</span>
                    <button className={`px-3 py-1 rounded-md ${activeTab === "Editor" ? "bg-gray-700" : "hover:bg-gray-700"}`} onClick={() => setActiveTab("Editor")}>
                        Editor
                    </button>
                    <button className={`px-3 py-1 rounded-md ${activeTab === "Simulator" ? "bg-gray-700" : "hover:bg-gray-700"}`} onClick={() => setActiveTab("Simulator")}>
                        Simulator
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-col flex-grow overflow-hidden">
                {/* Editor Tab */}
                {activeTab === "Editor" && (
                    <div className="flex flex-col flex-grow">
                        <div className="bg-gray-700 p-4 flex items-center">
                            <span className="mr-4">Active File: null</span>
                            <button className="px-4 py-2 bg-teal-500 rounded-md mr-2 hover:bg-teal-600">Save</button>
                            <button className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-500">Close</button>
                        </div>

                        {/* Monaco Editor Area */}
                        <div className="flex-grow bg-gray-800 p-4 relative overflow-auto">
                            <Editor
                                height="100%"
                                defaultLanguage="assembly"  // Customize if needed
                                theme="vs-dark"
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
                        <div className="flex flex-col w-3/4 bg-gray-800 p-4 overflow-auto">
                            <button onClick={handleSimulate} className="bg-teal-500 text-white px-4 py-2 rounded-md mb-4">
                                Assemble & Simulate from Editor
                            </button>

                           <table className="w-full border-collapse border text-center border-gray-600">
                                <thead>
                                    <tr className="bg-gray-700">
                                        <th className="border border-gray-500 px-4 py-2">PC</th>
                                        <th className="border border-gray-500 px-4 py-2">Machine Code</th>
                                        <th className="border border-gray-500 px-4 py-2">Basic Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedInstructions.map((inst, index) => (
                                        <tr key={index} className="bg-gray-800">
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
                        <div className="w-1/4 bg-gray-700 p-4 overflow-auto memory-section">
                            <div className="flex space-x-2 mb-4">
                                <button onClick={() => setShowRegisters(true)} className={`px-2 py-1 rounded-md ${showRegisters ? "bg-gray-600" : "hover:bg-gray-600"}`}>
                                    Registers
                                </button>
                                <button onClick={() => setShowRegisters(false)} className={`px-2 py-1 rounded-md ${!showRegisters ? "bg-gray-600" : "hover:bg-gray-600"}`}>
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
                )}
            </main>
        </div>
    );
};

export default VenusEditor;
