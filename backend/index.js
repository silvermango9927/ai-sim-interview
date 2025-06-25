import fs from "fs";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

async function transcribeAudio() {
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream("./audio.m4a"),
    model: "whisper-1",
    response_format: "text",
  });
  // If response_format is "text", transcription is a string
  console.log(transcription);
}

transcribeAudio();
