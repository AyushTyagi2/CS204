"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";
import  Button  from "../components/button";
import { Card, CardContent } from "../components/card";

export default function RiscVSimulator() {
  const [code, setCode] = useState("# Write your RISC-V assembly code here\n");
  const [output, setOutput] = useState("");
  const [file, setFile] = useState(null);

  const handleRun = async () => {
    const formData = new FormData();
    formData.append("file", new Blob([code], { type: "text/plain" }), "code.asm");
    
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      setOutput(`Execution Output:\n${data.outputFile}`);
    } else {
      setOutput("Error running the code");
    }
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => setCode(e.target.result);
    reader.readAsText(uploadedFile);
    setFile(uploadedFile);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">RISC-V Simulator</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent>
            <Editor 
              height="400px" 
              defaultLanguage="riscv" 
              theme="vs-dark" 
              value={code} 
              onChange={(value) => setCode(value)} 
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold">Execution Output</h2>
            <pre className="p-2 bg-gray-900 text-white rounded-lg mt-2">{output}</pre>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-2">
        <input type="file" accept=".asm" onChange={handleFileUpload} />
        <Button onClick={handleRun}>Run Code</Button>
      </div>
    </div>
  );
}
