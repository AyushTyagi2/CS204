"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [outputFile, setOutputFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please upload an .asm file");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      setOutputFile(data.outputFile);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-96 text-center">
        <h2 className="text-2xl font-bold mb-4">Upload Assembly File</h2>

        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
          <input
            type="file"
            accept=".asm"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>

        {file && <p className="mt-3 text-sm text-gray-400">📂 {file.name}</p>}

        <button
          onClick={handleUpload}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-300"
        >
          Upload
        </button>

        {outputFile && (
          <div className="mt-6">
            <p className="text-lg font-semibold">Download Output File:</p>
            <a
              href={`/outputs/${outputFile}`}
              download
              className="mt-2 text-blue-400 hover:text-blue-300 underline"
            >
              {outputFile}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
