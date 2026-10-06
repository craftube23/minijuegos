import fs from 'fs';
import { MPEGDecoder } from 'mpg123-decoder';

async function detectPitch() {
  const fileBuffer = fs.readFileSync('public/assets/audio/jingle-bells.mp3');
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const { channelData, sampleRate } = decoder.decode(fileBuffer);

  const samples = channelData[0];

  // Analyze frequency bins in 2048-sample windows across seconds 2 to 10
  const winSize = 2048;
  const noteFreqs = [];

  for (let sec = 1.5; sec < 12; sec += 0.5) {
    const start = Math.floor(sec * sampleRate);
    const window = samples.subarray(start, start + winSize);

    // Auto-correlation to find dominant fundamental frequency (pitch)
    let bestCorr = 0;
    let bestLag = 0;
    const minLag = Math.floor(sampleRate / 800); // max 800 Hz
    const maxLag = Math.floor(sampleRate / 100); // min 100 Hz

    for (let lag = minLag; lag < maxLag; lag++) {
      let corr = 0;
      for (let i = 0; i < winSize - lag; i++) {
        corr += window[i] * window[i + lag];
      }
      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    if (bestLag > 0) {
      const freq = sampleRate / bestLag;
      console.log(`At ${sec.toFixed(1)}s -> Dominant Pitch: ${freq.toFixed(1)} Hz`);
    }
  }
}

detectPitch().catch(console.error);
