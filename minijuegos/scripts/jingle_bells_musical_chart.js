// Musical chart aligned with the Jingle Bells MP3 vocals
export const JINGLE_BELLS_CHART = [
  // --- INTRO / CALIBRACIÓN (0s - 9s) ---
  { lane: 0, time: 2.00, isStar: false },
  { lane: 1, time: 4.00, isStar: false },
  { lane: 2, time: 6.00, isStar: false },
  { lane: 3, time: 8.00, isStar: true, logoType: 1 },

  // --- VERSO 1 (9.0s - 24.5s): "Dashing through the snow..." ---
  // Dash-ing through the snow (9.2s - 11.2s)
  { lane: 0, time: 9.20, isStar: false },
  { lane: 0, time: 9.60, isStar: false },
  { lane: 1, time: 10.00, isStar: false },
  { lane: 2, time: 10.60, isStar: false },
  { lane: 0, time: 11.20, isStar: false },

  // In a one-horse open sleigh (12.2s - 14.2s)
  { lane: 1, time: 12.20, isStar: false },
  { lane: 1, time: 12.60, isStar: false },
  { lane: 2, time: 13.20, isStar: false },
  { lane: 3, time: 13.80, isStar: true, logoType: 2 },
  { lane: 1, time: 14.40, isStar: false },

  // O'er the fields we go (15.2s - 17.2s)
  { lane: 0, time: 15.20, isStar: false },
  { lane: 1, time: 15.60, isStar: false },
  { lane: 2, time: 16.20, isStar: false },
  { lane: 3, time: 16.80, isStar: false },
  { lane: 2, time: 17.40, isStar: false },

  // Laughing all the way (18.4s - 20.4s)
  { lane: 1, time: 18.40, isStar: false },
  { lane: 2, time: 18.90, isStar: false },
  { lane: 3, time: 19.40, isStar: true, logoType: 1 },
  { lane: 2, time: 20.10, isStar: false },

  // Bells on bobtails ring, making spirits bright (21.2s - 24.5s)
  { lane: 0, time: 21.20, isStar: false },
  { lane: 1, time: 21.60, isStar: false },
  { lane: 2, time: 22.00, isStar: false },
  { lane: 3, time: 22.50, isStar: false },
  { lane: 1, time: 23.10, isStar: false },
  { lane: 2, time: 23.60, isStar: false },
  { lane: 3, time: 24.20, isStar: true, logoType: 2 },

  // --- CORO PRINCIPAL (25.0s - 42.0s): "JINGLE BELLS, JINGLE BELLS..." ---
  // Jin-gle bells, jin-gle bells (25.2s - 28.5s)
  { lane: 1, time: 25.20, isStar: false },
  { lane: 1, time: 25.70, isStar: false },
  { lane: 1, time: 26.20, isStar: false },

  { lane: 1, time: 27.20, isStar: false },
  { lane: 1, time: 27.70, isStar: false },
  { lane: 1, time: 28.20, isStar: false },

  // Jin-gle all the way (29.2s - 32.0s)
  { lane: 1, time: 29.20, isStar: false },
  { lane: 3, time: 29.70, isStar: true, logoType: 1 },
  { lane: 0, time: 30.20, isStar: false },
  { lane: 1, time: 30.70, isStar: false },
  { lane: 2, time: 31.40, isStar: false },

  // Oh what fun it is to ride (33.0s - 35.0s)
  { lane: 2, time: 33.00, isStar: false },
  { lane: 2, time: 33.50, isStar: false },
  { lane: 2, time: 34.00, isStar: false },
  { lane: 2, time: 34.50, isStar: false },

  // In a one-horse o-pen sleigh (35.2s - 37.5s)
  { lane: 2, time: 35.20, isStar: false },
  { lane: 1, time: 35.70, isStar: false },
  { lane: 1, time: 36.20, isStar: false },
  { lane: 1, time: 36.70, isStar: false },
  { lane: 1, time: 37.20, isStar: false },

  // HEY! (Acorde doble 38.2s)
  { lane: 0, time: 38.20, isStar: true, logoType: 2 },
  { lane: 3, time: 38.20, isStar: false },

  // Segunda vuelta de Jingle Bells (39.0s - 44.5s)
  { lane: 1, time: 39.20, isStar: false },
  { lane: 1, time: 39.60, isStar: false },
  { lane: 1, time: 40.00, isStar: false },

  { lane: 1, time: 40.80, isStar: false },
  { lane: 1, time: 41.20, isStar: false },
  { lane: 1, time: 41.60, isStar: false },

  { lane: 1, time: 42.40, isStar: false },
  { lane: 3, time: 42.80, isStar: true, logoType: 1 },
  { lane: 0, time: 43.20, isStar: false },
  { lane: 1, time: 43.60, isStar: false },
  { lane: 2, time: 44.00, isStar: false },

  // Gran final
  { lane: 0, time: 44.60, isStar: true, logoType: 2 },
  { lane: 3, time: 44.60, isStar: false }
];
