"use strict";

var _fs = _interopRequireDefault(require("fs"));

var _openai = _interopRequireDefault(require("openai"));

var _dotenv = _interopRequireDefault(require("dotenv"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

_dotenv["default"].config();

var openai = new _openai["default"]({
  apiKey: process.env.OPENAI_KEY
});

function transcribeAudio() {
  var transcription;
  return regeneratorRuntime.async(function transcribeAudio$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(openai.audio.transcriptions.create({
            file: _fs["default"].createReadStream("./audio.m4a"),
            model: "whisper-1",
            response_format: "text"
          }));

        case 2:
          transcription = _context.sent;
          // If response_format is "text", transcription is a string
          console.log(transcription);

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}

transcribeAudio();