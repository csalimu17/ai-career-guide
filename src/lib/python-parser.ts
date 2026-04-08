import "server-only";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { CvDataExtractionOutputSchema, type CvDataExtractionOutput } from "@/types/cv";

/**
 * Interface for the raw output from the Python script
 */
interface PythonParserOutput {
  name: string | null;
  email: string | null;
  phone: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null | string[];
  raw_text?: string;
  error?: string;
}

/**
 * Calls the Python resume parser pipeline via a child process.
 * Requires 'python' (or 'python3') to be in the PATH and dependencies installed.
 */
export async function parseWithPython(
  filePath: string
): Promise<Partial<CvDataExtractionOutput> & { rawText?: string } | null> {
  const scriptPath = path.join(process.cwd(), "src/lib/python/resume_parser_pipeline.py");
  
  console.log(`[PythonParser] Invoking pipeline for: ${filePath}`);

  return new Promise((resolve, reject) => {
    // Prefer virtual environment python if exists
    let pythonCmd = process.platform === "win32" ? "python" : "python3";
    const venvPython = process.platform === "win32" 
      ? path.join(process.cwd(), ".venv", "Scripts", "python.exe")
      : path.join(process.cwd(), ".venv", "bin", "python");

    // Check if venv python exists synchronously for simplicity since this is a heavy path
    const { existsSync } = require('fs');
    if (existsSync(venvPython)) {
      pythonCmd = venvPython;
      console.log(`[PythonParser] Using virtual environment python: ${pythonCmd}`);
    }

    const pyProcess = spawn(pythonCmd, [scriptPath, "--input", filePath]);

    let stdout = "";
    let stderr = "";

    pyProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`[PythonParser] Script exited with code ${code}`);
        console.error(`[PythonParser] Stderr: ${stderr}`);
        resolve(null);
        return;
      }

      try {
        const result = JSON.parse(stdout) as PythonParserOutput;
        
        if (result.error) {
          console.warn(`[PythonParser] Script reported error: ${result.error}`);
          resolve(null);
          return;
        }

        // Map Python output to our CV schema
        const mapped: Partial<CvDataExtractionOutput> & { rawText?: string } = {
          personalDetails: {
            name: result.name || undefined,
            email: result.email || undefined,
            phone: result.phone || undefined,
          },
          summary: "", // Python script doesn't explicitly extract summary yet
          workExperience: result.experience ? [{
            title: "Extracted Experience",
            company: "Multiple",
            description: [result.experience],
            startDate: "",
            endDate: ""
          }] : [],
          education: result.education ? [{
            degree: result.education,
            institution: "Extracted Institution",
            graduationDate: ""
          }] : [],
          skills: Array.isArray(result.skills) 
            ? result.skills 
            : result.skills?.split(/,|\n/).map(s => s.trim()).filter(Boolean) || [],
          rawText: result.raw_text,
        };

        resolve(mapped);
      } catch (err) {
        console.error(`[PythonParser] Failed to parse output: ${err}`);
        console.error(`[PythonParser] Raw output: ${stdout}`);
        resolve(null);
      }
    });

    pyProcess.on("error", (err) => {
      console.error(`[PythonParser] Failed to start process: ${err}`);
      resolve(null);
    });
  });
}

/**
 * Utility to parse a buffer by saving to a temp file first
 */
export async function parseBufferWithPython(
  buffer: Buffer,
  extension: string
): Promise<Partial<CvDataExtractionOutput> & { rawText?: string } | null> {
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `resume_${Date.now()}${extension}`);

  try {
    await fs.writeFile(tempFile, buffer);
    const result = await parseWithPython(tempFile);
    return result;
  } finally {
    // Background cleanup
    fs.unlink(tempFile).catch(() => {});
  }
}
