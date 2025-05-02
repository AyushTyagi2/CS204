import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const configPath = path.join(process.cwd(), "src/simulator_config.json");
  const phase2Path = path.join(process.cwd(), "src/executables_phase2/execution_output.json");
  const phase3Path = path.join(process.cwd(), "src/executables_phase3/simulator_state.json");

  try {
    // Read the simulator_config.json file
    const configData = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configData);

    if (config.simulator === false) {
      // If simulator is true, send execution_output.json
      const data = await fs.readFile(phase2Path, "utf8");
      return new Response(data, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      // If simulator is false, send registers.json
      const data = await fs.readFile(phase3Path, "utf8");
      return new Response(data, {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Error reading files:", error);
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
}
