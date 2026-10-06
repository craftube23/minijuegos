import fs from 'fs';
import { MPEGDecoder } from 'mpg123-decoder';

async function findVocalSections() {
  const fileBuffer = fs.readFileSync('public/assets/audio/jingle-bells.mp3');
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const { channelData, sampleRate } = decoder.decode(fileBuffer);

  const left = channelData[0];
  const step = 0.1; // 100ms
  const stepSamples = Math.floor(sampleRate * step);

  console.log('--- Second by second energy distribution ---');
  for (let s = 0; s < 45; s += 1) {
    let sum = 0;
    const start = Math.floor(s * sampleRate);
    for (let i = 0; i < sampleRate; i++) {
      if (start + i < left.length) {
        sum += Math.abs(left[start + i]);
      }
    }
    const avg = sum / sampleRate;
    const bar = '#'.repeat(Math.min(40, Math.floor(avg * 150)));
    console.log(`${s.toString().padStart(2, '0')}s: ${avg.toFixed(3)} | ${bar}`);
  }
}

findVocalSections().catch(console.error);
