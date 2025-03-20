import { promises as fs } from "fs";
import path from "path";

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), "src/executables/output.mc");
        const fileContent = await fs.readFile(filePath, "utf-8");

        return Response.json({ success: true, data: fileContent });
    } catch (error) {
        console.error("Error reading .mc file:", error);
        return Response.json({ success: false, error: "Error reading file" }, { status: 500 });
    }
}
