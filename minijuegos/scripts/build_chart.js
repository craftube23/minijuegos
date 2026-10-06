import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/detected_beats.json', 'utf8'));
const beats = data.beats;

// Filter beats for the first 45 seconds
const gameBeats = beats.filter(b => b <= 45.0);
console.log(`Found ${gameBeats.length} beats in first 45s.`);

// Create rhythm chart for Jingle Bells
// Jingle Bells has 4/4 meter.
// Pattern mapping designed to feel like FNF / Guitar Hero:
// - Verse: Single alternating notes
// - Chorus (Jingle Bells, Jingle Bells...): Double and triple tap bursts on same lane, then melody flow
// - Star notes placed on major musical accents with alternating logos
const chart = [];
let starCounter = 0;

for (let i = 0; i < gameBeats.length; i++) {
  const time = parseFloat(gameBeats[i].toFixed(3));
  const beatIndex = i;

  // Intro (beats 0-8): Gentle warmup
  if (beatIndex < 8) {
    const lane = beatIndex % 4;
    chart.push({ lane, time, isStar: beatIndex === 7 });
  }
  // Section 1: Jingle Bells Chorus (beats 8-24) -> Mi Mi Mi, Mi Mi Mi, Mi Sol Do Re Mi
  else if (beatIndex >= 8 && beatIndex < 24) {
    const sub = beatIndex - 8;
    let lane = 1; // Dorado (Mi)
    if (sub === 3 || sub === 7) lane = 2; // Sol
    else if (sub === 4 || sub === 8) lane = 0; // Do
    else if (sub === 5 || sub === 9) lane = 3; // Do agudo
    else lane = sub % 2 === 0 ? 1 : 2;

    const isStar = sub === 6 || sub === 14;
    chart.push({ lane, time, isStar });

    // Add intermediate 8th-note in energetic sections
    if (sub % 4 === 1 && i + 1 < gameBeats.length) {
      const nextTime = gameBeats[i + 1];
      const halfTime = parseFloat(((time + nextTime) / 2).toFixed(3));
      chart.push({ lane: (lane + 1) % 4, time: halfTime });
    }
  }
  // Section 2: Verse "Dashing through the snow..." (beats 24-44)
  else if (beatIndex >= 24 && beatIndex < 44) {
    const sub = beatIndex - 24;
    const lane = (sub * 2) % 4;
    const isStar = sub % 8 === 0;
    chart.push({ lane, time, isStar });

    if (sub % 2 === 0 && i + 1 < gameBeats.length) {
      const nextTime = gameBeats[i + 1];
      const halfTime = parseFloat(((time + nextTime) / 2).toFixed(3));
      chart.push({ lane: (lane + 2) % 4, time: halfTime });
    }
  }
  // Section 3: Climax Chorus (beats 44-70)
  else if (beatIndex >= 44 && beatIndex < 70) {
    const sub = beatIndex - 44;
    let lane = (sub + 1) % 4;
    const isStar = sub % 6 === 0;
    chart.push({ lane, time, isStar });

    if (sub % 3 === 0 && i + 1 < gameBeats.length) {
      const nextTime = gameBeats[i + 1];
      const halfTime = parseFloat(((time + nextTime) / 2).toFixed(3));
      chart.push({ lane: (lane + 1) % 4, time: halfTime });
    }
  }
  // Section 4: Final Rush (beats 70+)
  else {
    const sub = beatIndex - 70;
    const lane = sub % 4;
    const isStar = sub % 5 === 0;
    chart.push({ lane, time, isStar });

    // Cascading double notes
    if (sub % 2 === 0) {
      chart.push({ lane: (lane + 2) % 4, time, isStar: false });
    }
  }
}

// Sort by time
chart.sort((a, b) => a.time - b.time);

// Assign alternating logoType to stars
chart.forEach((n, idx) => {
  n.id = idx;
  if (n.isStar) {
    starCounter++;
    n.logoType = starCounter % 2 === 0 ? 2 : 1;
  }
});

console.log(`Generated synchronized chart with ${chart.length} notes (Stars: ${starCounter})`);
console.log('Sample notes:', chart.slice(0, 8));

fs.writeFileSync('scripts/jingle_bells_chart.json', JSON.stringify(chart, null, 2));
