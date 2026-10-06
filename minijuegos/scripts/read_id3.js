import fs from 'fs';

const buf = fs.readFileSync('public/assets/audio/jingle-bells.mp3');

// Search for strings in ID3 header
const headerText = buf.subarray(0, 4000).toString('latin1');
console.log('--- ID3 Header Inspection ---');
const printable = headerText.replace(/[\x00-\x1F\x7F-\x9F]/g, ' ');
console.log(printable.slice(0, 500));
