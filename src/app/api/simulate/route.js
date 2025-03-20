import { writeFile, readFile, access } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req) {
    try {
        const { code } = await req.json();
        console.log("✅ Received Code:", code);

        // Define base execution path using path.resolve
        const execPath = path.resolve("C:/Users/asus/OneDrive/Documents/GitHub/Cs204_risc-v_assembler/project_phase_2/phase2/src/executables");

        // Define absolute file paths
        const asmFilePath = path.resolve(execPath, "input.asm");
        const mcFilePath = path.resolve(execPath, "output.mc");
        const jsonFilePath = path.resolve(execPath, "execution_output.json");

        // Write the Assembly code to input.asm
        console.log(`📂 Writing Assembly code to: ${asmFilePath}`);
        await writeFile(asmFilePath, code, "utf-8");

        // Run `1.exe` to generate `output.mc`
        console.log(`🚀 Running 1.exe in ${execPath}...`);
        const { stdout: exeStdout, stderr: exeStderr } = await execAsync(`"${path.resolve(execPath, "1.exe")}"`, { cwd: execPath });
        console.log("✅ 1.exe execution complete.");
        console.log("📜 1.exe stdout:", exeStdout);
        if (exeStderr) console.error("⚠️ 1.exe stderr:", exeStderr);

        // Ensure `output.mc` exists before running the simulator
        try {
            await access(mcFilePath);
            console.log("📄 output.mc found, proceeding...");
        } catch {
            throw new Error("❌ output.mc not generated! Check 1.exe execution.");
        }

        // Run `myRISCVSim.exe` to generate `execution_output.json`
        console.log(`🚀 Running myRISCVSim.exe in ${execPath}...`);
        const { stdout: simStdout, stderr: simStderr } = await execAsync(`"${path.resolve(execPath, "myRISCVSim.exe")}" "output.mc"`, { cwd: execPath });
        console.log("✅ myRISCVSim.exe execution complete.");
        console.log("📜 myRISCVSim.exe stdout:", simStdout);
        if (simStderr) console.error("⚠️ myRISCVSim.exe stderr:", simStderr);

        // Ensure `execution_output.json` exists before reading
        try {
            await access(jsonFilePath);
            console.log("📄 execution_output.json found, reading...");
        } catch {
            throw new Error("❌ execution_output.json not generated! Check myRISCVSim.exe execution.");
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
