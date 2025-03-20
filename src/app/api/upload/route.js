"use server";
import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { exec } from "child_process";
import path from "path";
import { promisify } from "util";

const execPromise = promisify(exec);


export async function POST(req) {
  try {
    // Parse the incoming form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) return NextResponse.json({ success: false, message: "No file uploaded" }, { status: 400 });

    // Define file paths
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filePath = path.join(uploadDir, file.name);
    const outputFilePath = filePath.replace(".asm", ".mc"); // Change .asm to .mc

    // Convert file to Buffer and save it
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    console.log(`✅ File uploaded: ${filePath}`);

    // Run C++ program on the uploaded file (Replace `./a.out` with your compiled C++ executable)
    const exePath = path.resolve("backend", "1.exe"); 
    const command = `"${exePath}" "${filePath}" "${outputFilePath}"`;
      await execPromise(command);

    console.log(`✅ File processed: ${outputFilePath}`);

    // Return the processed file name
    return NextResponse.json({ success: true, outputFile: path.basename(outputFilePath) });

  } catch (error) {
    console.error("❌ Error processing file:", error);
    return NextResponse.json({ success: false, message: "File processing failed" }, { status: 500 });
  }
}
