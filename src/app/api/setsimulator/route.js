// app/api/setSimulator/route.js
import { writeFile, readFile } from "fs/promises";
import path from "path";

export async function POST(req) {
    try {
        const newValues = await req.json();
        const configPath = path.join("src", "simulator_config.json");

        // Load existing config if it exists
        let existingConfig = {};
        try {
            const file = await readFile(configPath, "utf-8");
            existingConfig = JSON.parse(file);
        } catch (err) {
            console.warn("⚠️ No existing config found, creating a new one.");
        }

        // Merge with new values
        const updatedConfig = { ...existingConfig, ...newValues };

        await writeFile(configPath, JSON.stringify(updatedConfig, null, 2), "utf-8");
        console.log("💾 Simulator config saved:", updatedConfig);

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error("❌ Error updating config:", err);
        return new Response(JSON.stringify({ success: false, error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
