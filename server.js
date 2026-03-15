import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Ensure temp and exports directories exist
const tempDir = path.join(__dirname, 'temp');
const exportDir = path.join(__dirname, 'exports');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

app.post('/api/render', async (req, res) => {
    try {
        const editPlan = req.body;
        console.log("Received edit plan for rendering...");

        // 1. Save JSON to temp file
        const jobId = `render_${Date.now()}`;
        const planPath = path.join(tempDir, `${jobId}.json`);
        const outputPath = path.join(exportDir, `${jobId}.mp4`);

        fs.writeFileSync(planPath, JSON.stringify(editPlan, null, 2));

        // 2. Call python script
        // Note: For this to work seamlessly, you must have python and moviepy installed locally
        const pythonProcess = spawn('python', ['engine_prototype.py', planPath, outputPath]);

        pythonProcess.stdout.on('data', (data) => {
            console.log(`[Python]: ${data}`);
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(`[Python Error]: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python process finished with code ${code}`);
            if (code === 0 && fs.existsSync(outputPath)) {
                res.status(200).json({
                    success: true,
                    message: "Render complete!",
                    videoPath: outputPath,
                    jobId: jobId
                });
            } else {
                res.status(500).json({ success: false, message: "Render failed." });
            }
        });

    } catch (error) {
        console.error("Render catch error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🎬 PANG AI Render Server running on http://localhost:${PORT}`);
});
