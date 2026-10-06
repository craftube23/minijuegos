import fs from 'fs';
import { MPEGDecoder } from 'mpg123-decoder';

async function findExactOnsets() {
  const fileBuffer = fs.readFileSync('public/assets/audio/jingle-bells.mp3');
  const decoder = new MPEGDecoder();
  await decoder.ready;
  const { channelData, sampleRate } = decoder.decode(fileBuffer);

  const left = channelData[0];
  const hopSize = Math.floor(sampleRate * 0.02); // 20ms resolution
  const onsets = [];

  let prevEnergy = 0;
  for (let i = 0; i < left.length - hopSize; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < hopSize; j++) {
      energy += Math.abs(left[i + j]);
    }
    const delta = energy - prevEnergy;
    const time = i / sampleRate;

    // Detect transient attacks
    if (delta > 12.0 && time > 8.0 && time < 45.0) {
      // check if local maximum
      onsets.push(parseFloat(time.toFixed(2)));
    }
    prevEnergy = energy * 0.85;
  }

  // Filter onsets that are at least 150ms apart
  const cleanOnsets = [];
  for (const t of onsets) {
    if (cleanOnsets.length === 0 || t - cleanOnsets[cleanOnsets.length - 1] >= 0.18) {
      cleanOnsets.push(t);
    }
  }

  console.log(`Detected ${cleanOnsets.length} clear vocal/beat onsets between 8.5s and 45s:`);
  console.log(cleanOnsets);
  fs.writeFileSync('scripts/vocal_onsets.json', JSON.stringify(cleanOnsets, null, 2));
}

findExactOnsets().catch(console.error);
