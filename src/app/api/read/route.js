import { promises as fs } from "fs";
import path from "path";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "src/executables/output.mc");
        const fileContent = await fs.readFile(filePath, "utf-8");

        return new Response(JSON.stringify({ success: true, data: fileContent }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error reading .mc file:", error);
        return new Response(JSON.stringify({ success: false, error: "Error reading file" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
