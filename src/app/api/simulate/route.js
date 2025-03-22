import { writeFile, readFile, access } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req) {
    try {
        const { code } = await req.json();
        console.log("✅ Received Code:", code);

        // Define base execution path inside Docker
        const execPath = "/app/src"; // Change to match Docker setup

        // Define file paths
        const asmFilePath = path.join(execPath, "/executables/input.asm");
        const mcFilePath = path.join(execPath, "/executables/output.mc");
        const jsonFilePath = path.join(execPath, "/executables/execution_output.json");

        // Write input.asm
        console.log(`📂 Writing Assembly code to: ${asmFilePath}`);
        await writeFile(asmFilePath, code, "utf-8");

        // Run 1.out inside Docker
        console.log(`🚀 Running 1.out inside Docker...`);
        const { stdout: exeStdout, stderr: exeStderr } = await execAsync(`sh run.sh`, { cwd: "/app" });
        console.log("✅ 1.out execution complete.");
        console.log("📜 1.out stdout:", exeStdout);
        if (exeStderr) console.error("⚠️ 1.out stderr:", exeStderr);

        // Check if output.mc was generated
        try {
            await access(mcFilePath);
            console.log("📄 output.mc found, proceeding...");
        } catch {
            throw new Error("❌ output.mc not generated! Check 1.out execution.");
        }

        // Run myRISCVSim.out inside Docker
        console.log(`🚀 Running myRISCVSim.out inside Docker...`);
        const { stdout: simStdout, stderr: simStderr } = await execAsync(`sh run2.sh`, { cwd: "/app" });
        console.log("✅ myRISCVSim.out execution complete.");
        console.log("📜 myRISCVSim.out stdout:", simStdout);
        if (simStderr) console.error("⚠️ myRISCVSim.out stderr:", simStderr);

        // Check if execution_output.json was generated
        try {
            await access(jsonFilePath);
            console.log("📄 execution_output.json found, reading...");
        } catch {
            throw new Error("❌ execution_output.json not generated! Check myRISCVSim.out execution.");
        }

        // Read the generated JSON output
        const simulationOutput = await readFile(jsonFilePath, "utf-8");
        console.log("✅ Successfully read execution_output.json");

        return new Response(simulationOutput, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("❌ Error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
