import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const app = express();

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Serve static files (for serving the frontend if needed)
app.use(express.static("public"));

// Configure multer for audio file uploads with proper file extension handling
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    // Accept audio files and common web audio formats
    const allowedMimes = [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/x-m4a',
      'audio/m4a',
      'audio/ogg'
    ];
    
    if (file.mimetype.startsWith("audio/") || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024, // Increased to 25MB for better audio quality
  },
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// Endpoint to upload and transcribe audio
app.post("/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const audioPath = req.file.path;
    console.log(`Processing audio file: ${audioPath}`);
    console.log(`File mimetype: ${req.file.mimetype}`);
    console.log(`Original filename: ${req.file.originalname}`);

    // Rename file with proper extension based on mimetype for better OpenAI compatibility
    let newPath = audioPath;
    if (req.file.mimetype === 'audio/webm') {
      newPath = audioPath + '.webm';
      fs.renameSync(audioPath, newPath);
    } else if (req.file.mimetype === 'audio/mp4' || req.file.mimetype === 'audio/x-m4a') {
      newPath = audioPath + '.m4a';
      fs.renameSync(audioPath, newPath);
    } else if (req.file.mimetype === 'audio/wav') {
      newPath = audioPath + '.wav';
      fs.renameSync(audioPath, newPath);
    } else if (req.file.mimetype === 'audio/mpeg') {
      newPath = audioPath + '.mp3';
      fs.renameSync(audioPath, newPath);
    }

    // Use the non-streaming API for better compatibility
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(newPath),
      model: "whisper-1", // Changed to whisper-1 for better compatibility
      response_format: "text",
    });

    // Clean up the uploaded file
    fs.unlink(newPath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    res.json({
      transcription: transcription,
      originalName: req.file.originalname,
      success: true,
    });
  } catch (err) {
    console.error("Transcription error:", err);

    // Clean up file on error too
    if (req.file) {
      const possiblePaths = [
        req.file.path,
        req.file.path + '.webm',
        req.file.path + '.m4a',
        req.file.path + '.wav',
        req.file.path + '.mp3'
      ];
      
      possiblePaths.forEach(path => {
        if (fs.existsSync(path)) {
          fs.unlink(path, () => {});
        }
      });
    }

    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.listen(3001, () => {
  console.log("Server listening on port 3001");
  console.log("Audio transcription service ready");
});

// --- How to record audio in the browser ---
// You can use the MediaRecorder API in the browser to record audio.
// Example (client-side JavaScript):

// navigator.mediaDevices.getUserMedia({ audio: true })
//   .then(stream => {
//     const mediaRecorder = new MediaRecorder(stream);
//     const audioChunks = [];
//     mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
//     mediaRecorder.onstop = () => {
//       const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
//       // Send audioBlob to your backend using fetch/FormData
//     };
//     mediaRecorder.start();
//     // Call mediaRecorder.stop() when done recording
//   });

// async function transcribeAudio() {
//   const transcription = await openai.audio.transcriptions.create({
//     file: fs.createReadStream("./audio.m4a"),
//     model: "whisper-1",
//     response_format: "text",
//   });
//   // If response_format is "text", transcription is a string
//   console.log(transcription);
// }

// transcribeAudio();

// const stream = await openai.audio.transcriptions.create({
//   file: fs.createReadStream("./audio.m4a"),
//   model: "gpt-4o-mini-transcribe",
//   response_format: "text",
//   stream: true,
// });

// for await (const chunk of stream) {
//   console.log(chunk);
// }
