import { writeFile, readFile, access } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req) {
    try {
        const { code } = await req.json(); // ✅ Only read the code

        // Read simulator flag from config file
        const configPath = path.join("src", "simulator_config.json");
        const configData = await readFile(configPath, "utf-8");
        const { simulator, forward, Buffer,predict } = JSON.parse(configData); // ✅ Use stored simulator mode
    
        console.log("🔧 Using simulator from config:", simulator);
        // ✅ Read once
        console.log("✅ Received Code:", code);
        console.log("🔧 Using simulator:", simulator);

        const execPath = "src";

        // Define file paths
        const asmFilePath = path.join(execPath, "executables_phase1/input.asm");
        const mcFilePath = path.join(execPath, "executables_phase1/output.mc");

        // Write input.asm
        console.log(`📂 Writing Assembly code to: ${asmFilePath}`);
        await writeFile(asmFilePath, code, "utf-8");

        // Step 1: Run the assembler
        const { stdout: exeStdout, stderr: exeStderr } = await execAsync(`wsl sh run.sh`);
        console.log("✅ Assembler (1.out) execution complete.");
        console.log("📜 Assembler stdout:", exeStdout);
        if (exeStderr) console.error("⚠️ Assembler stderr:", exeStderr);

        // Check if output.mc exists
        await access(mcFilePath).catch(() => {
            throw new Error("❌ output.mc not generated! Check 1.out execution.");
        });
        console.log("📄 output.mc found, proceeding...");

        // Step 2: Run the simulator (based on button input)
       // Step 2: Decide simulator script based on boolean flag
       let simScript;
       let jsonFilePath; // ✅ Declare once here
       
       if (forward === true) {
         simScript = "run4.sh"; // Most advanced
         console.log("🟢 Forwarding mode ON — using run4.sh");
         jsonFilePath = path.join(execPath, "executables_phase3/pipeline.json");
       
       } else if (simulator === true || simulator === "phase3") {
         simScript = "run3.sh"; // Branch prediction, no forwarding
         console.log("🟠 Branch Prediction ON — using run3.sh");
         jsonFilePath = path.join(execPath, "executables_phase3/pipeline.json");
       
       } else if (Buffer === true) {
         simScript = "run5.sh";
         jsonFilePath = path.join(execPath, "executables_phase2/pipeline.json");
       }else if(predict === true){
        simScript = "run6.sh";
       } else {
         simScript = "run2.sh"; // Basic mode
         console.log("🔵 Basic Phase 1 mode — using run2.sh");
         jsonFilePath = path.join(execPath, "executables_phase2/execution_output.json");
       }
       
            
            // Run the appropriate simulator script
            const { stdout: simStdout, stderr: simStderr } = await execAsync(`wsl sh ${simScript}`);
            console.log("✅ Simulator execution complete.");
            console.log("📜 Simulator stdout:", simStdout);
            if (simStderr) console.error("⚠️ Simulator stderr:", simStderr);

        console.log("✅ Simulator execution complete.");
        console.log("📜 Simulator stdout:", simStdout);
        if (simStderr) console.error("⚠️ Simulator stderr:", simStderr);

        // Check if execution_output.json exists
        await access(jsonFilePath).catch(() => {
            throw new Error("❌ execution_output.json not generated! Check simulator execution.");
        });
        console.log("📄 execution_output.json found, reading...");

        // Step 3: Read and parse simulation output
        const simulationOutput = await readFile(jsonFilePath, "utf-8");
        console.log("✅ Successfully read execution_output.json");
        const parsedOutput = JSON.parse(simulationOutput);

// ✅ Expect parsedOutput to be an array directly
if (!Array.isArray(parsedOutput)) {
  throw new Error("❌ Invalid simulator output: Expected top-level array.");
}

/*const pipelineData = parsedOutput.map((cycle, idx) => ({
  cycle: idx + 1,
  stages: [
    cycle.IF ? "IF" : "",
    cycle.ID ? "ID" : "",
    cycle.EX ? "EX" : "",
    cycle.MEM ? "MEM" : "",
    cycle.WB ? "WB" : ""
  ]
}));*/

        
        /*return new Response(JSON.stringify({ pipeline: pipelineData }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });*/

    } catch (error) {
        console.error("❌ Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
