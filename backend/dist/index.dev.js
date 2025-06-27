"use strict";

var _fs = _interopRequireDefault(require("fs"));

var _openai = _interopRequireDefault(require("openai"));

var _dotenv = _interopRequireDefault(require("dotenv"));

var _express = _interopRequireDefault(require("express"));

var _multer = _interopRequireDefault(require("multer"));

var _path = _interopRequireDefault(require("path"));

var _cors = _interopRequireDefault(require("cors"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

_dotenv["default"].config();

var openai = new _openai["default"]({
  apiKey: process.env.OPENAI_KEY
});
var app = (0, _express["default"])(); // Enable CORS for frontend communication

app.use((0, _cors["default"])());
app.use(_express["default"].json()); // Serve static files (for serving the frontend if needed)

app.use(_express["default"]["static"]("public")); // Configure multer for audio file uploads with proper file extension handling

var upload = (0, _multer["default"])({
  dest: "uploads/",
  fileFilter: function fileFilter(req, file, cb) {
    // Accept audio files and common web audio formats
    var allowedMimes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/m4a', 'audio/ogg'];

    if (file.mimetype.startsWith("audio/") || allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 25 * 1024 * 1024 // Increased to 25MB for better audio quality

  }
}); // Ensure uploads directory exists

if (!_fs["default"].existsSync("uploads")) {
  _fs["default"].mkdirSync("uploads");
} // Endpoint to upload and transcribe audio


app.post("/upload-audio", upload.single("audio"), function _callee(req, res) {
  var audioPath, newPath, transcription, possiblePaths;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;

          if (req.file) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json({
            error: "No audio file provided"
          }));

        case 3:
          audioPath = req.file.path;
          console.log("Processing audio file: ".concat(audioPath));
          console.log("File mimetype: ".concat(req.file.mimetype));
          console.log("Original filename: ".concat(req.file.originalname)); // Rename file with proper extension based on mimetype for better OpenAI compatibility

          newPath = audioPath;

          if (req.file.mimetype === 'audio/webm') {
            newPath = audioPath + '.webm';

            _fs["default"].renameSync(audioPath, newPath);
          } else if (req.file.mimetype === 'audio/mp4' || req.file.mimetype === 'audio/x-m4a') {
            newPath = audioPath + '.m4a';

            _fs["default"].renameSync(audioPath, newPath);
          } else if (req.file.mimetype === 'audio/wav') {
            newPath = audioPath + '.wav';

            _fs["default"].renameSync(audioPath, newPath);
          } else if (req.file.mimetype === 'audio/mpeg') {
            newPath = audioPath + '.mp3';

            _fs["default"].renameSync(audioPath, newPath);
          } // Use the non-streaming API for better compatibility


          _context.next = 11;
          return regeneratorRuntime.awrap(openai.audio.transcriptions.create({
            file: _fs["default"].createReadStream(newPath),
            model: "whisper-1",
            // Changed to whisper-1 for better compatibility
            response_format: "text"
          }));

        case 11:
          transcription = _context.sent;

          // Clean up the uploaded file
          _fs["default"].unlink(newPath, function (err) {
            if (err) console.error("Error deleting file:", err);
          });

          res.json({
            transcription: transcription,
            originalName: req.file.originalname,
            success: true
          });
          _context.next = 21;
          break;

        case 16:
          _context.prev = 16;
          _context.t0 = _context["catch"](0);
          console.error("Transcription error:", _context.t0); // Clean up file on error too

          if (req.file) {
            possiblePaths = [req.file.path, req.file.path + '.webm', req.file.path + '.m4a', req.file.path + '.wav', req.file.path + '.mp3'];
            possiblePaths.forEach(function (path) {
              if (_fs["default"].existsSync(path)) {
                _fs["default"].unlink(path, function () {});
              }
            });
          }

          res.status(500).json({
            error: _context.t0.message
          });

        case 21:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 16]]);
}); // Health check endpoint

app.get("/health", function (req, res) {
  res.json({
    status: "Server is running"
  });
});
app.listen(3001, function () {
  console.log("Server listening on port 3001");
  console.log("Audio transcription service ready");
}); // --- How to record audio in the browser ---
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