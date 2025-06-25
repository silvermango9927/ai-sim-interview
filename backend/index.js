import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const stream = await openai.audio.transcriptions.create({
  file: fs.createReadStream("./audio.m4a"),
  model: "gpt-4o-mini-transcribe",
  response_format: "text",
  stream: true,
});

for await (const chunk of stream) {
  console.log(chunk);
}

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
