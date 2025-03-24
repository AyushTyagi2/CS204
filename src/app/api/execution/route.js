import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "src/executables/execution_output.json");

  try {
    const data = await fs.readFile(filePath, "utf8");
    return new Response(data, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error reading execution_output.json:", error);
    return new Response(JSON.stringify({ error: "File not found" }), { status: 404 });
  }
}
