import fs from 'fs';

const buffer = fs.readFileSync('public/assets/audio/jingle-bells.mp3');

// Find ID3v2 header if present
let offset = 0;
if (buffer.toString('utf8', 0, 3) === 'ID3') {
  const size = (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];
  offset = 10 + size;
}

const bitrates = {
  1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
};

const samplerates = [44100, 48000, 32000];

let totalFrames = 0;
let totalDuration = 0;
let firstBitrate = 0;
let sampleRate = 44100;

while (offset < buffer.length - 4) {
  if (buffer[offset] === 0xFF && (buffer[offset + 1] & 0xE0) === 0xE0) {
    const version = (buffer[offset + 1] >> 3) & 3; // 3 = MPEG1
    const layer = (buffer[offset + 1] >> 1) & 3; // 1 = Layer III (MPEG Audio Layer 3)
    const bitrateIdx = (buffer[offset + 2] >> 4) & 0x0F;
    const srateIdx = (buffer[offset + 2] >> 2) & 3;
    const padding = (buffer[offset + 2] >> 1) & 1;

    if (version === 3 && layer === 1 && bitrateIdx > 0 && bitrateIdx < 15 && srateIdx < 3) {
      const br = bitrates[3][bitrateIdx] * 1000;
      const sr = samplerates[srateIdx];
      sampleRate = sr;
      if (!firstBitrate) firstBitrate = br;

      const frameLength = Math.floor((144 * br) / sr) + padding;
      if (frameLength > 0 && offset + frameLength <= buffer.length) {
        totalFrames++;
        totalDuration += 1152 / sr;
        offset += frameLength;
        continue;
      }
    }
  }
  offset++;
}

console.log(`MP3 Analysis:`);
console.log(`- Sample Rate: ${sampleRate} Hz`);
console.log(`- Bitrate: ${firstBitrate / 1000} kbps`);
console.log(`- Total Frames: ${totalFrames}`);
console.log(`- Total Duration: ${totalDuration.toFixed(2)} seconds (${Math.floor(totalDuration / 60)}:${Math.floor(totalDuration % 60).toString().padStart(2, '0')})`);
