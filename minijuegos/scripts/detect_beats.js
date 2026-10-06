import fs from 'fs';
import { MPEGDecoder } from 'mpg123-decoder';
import MusicTempo from 'music-tempo';

async function analyzeAudio() {
  const fileBuffer = fs.readFileSync('public/assets/audio/jingle-bells.mp3');
  const decoder = new MPEGDecoder();
  
  console.log('Decoding MP3 audio frames...');
  await decoder.ready;
  const { channelData, sampleRate } = decoder.decode(fileBuffer);
  console.log(`Decoded successfully: ${channelData.length} channels, ${channelData[0].length} samples @ ${sampleRate}Hz`);

  const duration = channelData[0].length / sampleRate;
  console.log(`Duration: ${duration.toFixed(2)} seconds`);

  // Merge channels into mono
  const mono = new Float32Array(channelData[0].length);
  if (channelData.length > 1) {
    for (let i = 0; i < mono.length; i++) {
      mono[i] = (channelData[0][i] + channelData[1][i]) * 0.5;
    }
  } else {
    mono.set(channelData[0]);
  }

  console.log('Analyzing tempo and beat onsets...');
  const mt = new MusicTempo(mono, { sampleRate });

  console.log(`Detected Tempo: ${mt.tempo} BPM`);
  console.log(`Total Beats detected: ${mt.beats.length}`);
  console.log(`First 10 beats:`, mt.beats.slice(0, 10).map(t => t.toFixed(3)));
  console.log(`Last 5 beats:`, mt.beats.slice(-5).map(t => t.toFixed(3)));

  // Output all beats to JSON file for charting
  fs.writeFileSync('scripts/detected_beats.json', JSON.stringify({
    tempo: Math.round(Number(mt.tempo)),
    duration: Number(duration.toFixed(2)),
    beats: mt.beats
  }, null, 2));

  console.log('Saved detected_beats.json successfully.');
}

analyzeAudio().catch(console.error);
