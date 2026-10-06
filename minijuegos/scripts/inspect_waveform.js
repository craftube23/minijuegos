import fs from 'fs';
import { MPEGDecoder } from 'mpg123-decoder';

async function inspectAudioWaveform() {
  const fileBuffer = fs.readFileSync('public/assets/audio/jingle-bells.mp3');
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const { channelData, sampleRate } = decoder.decode(fileBuffer);

  const left = channelData[0];
  const right = channelData[1] || channelData[0];
  const totalSamples = left.length;
  const duration = totalSamples / sampleRate;

  console.log(`Duration: ${duration.toFixed(2)}s, SampleRate: ${sampleRate}`);

  // Calculate RMS energy in chunks of 50ms (0.05s)
  const chunkSize = Math.floor(sampleRate * 0.05); // 50ms
  const numChunks = Math.floor(totalSamples / chunkSize);
  const energyLevels = [];

  for (let c = 0; c < Math.min(numChunks, 500); c++) { // first 25 seconds
    let sum = 0;
    const start = c * chunkSize;
    for (let i = 0; i < chunkSize; i++) {
      const s = (left[start + i] + right[start + i]) * 0.5;
      sum += s * s;
    }
    const rms = Math.sqrt(sum / chunkSize);
    const time = (c * 0.05).toFixed(2);
    energyLevels.push({ time: parseFloat(time), rms });
  }

  // Find silence at the beginning
  let firstSoundTime = 0;
  for (const e of energyLevels) {
    if (e.rms > 0.02) {
      firstSoundTime = e.time;
      break;
    }
  }
  console.log(`First audible sound begins at: ${firstSoundTime}s`);

  // Print energy peaks in first 15 seconds
  console.log('--- Energy Peaks (first 15s) ---');
  for (let i = 1; i < energyLevels.length - 1; i++) {
    if (energyLevels[i].time > 15) break;
    if (energyLevels[i].rms > 0.05 && energyLevels[i].rms > energyLevels[i - 1].rms && energyLevels[i].rms > energyLevels[i + 1].rms) {
      console.log(`Time: ${energyLevels[i].time.toFixed(2)}s -> RMS: ${energyLevels[i].rms.toFixed(3)}`);
    }
  }
}

inspectAudioWaveform().catch(console.error);
