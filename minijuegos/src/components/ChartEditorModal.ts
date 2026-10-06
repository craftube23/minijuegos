/**
 * ==============================================================================
 * COMPONENTE: EDITOR Y GRABADOR DE NOTAS EN TIEMPO REAL (ChartEditorModal)
 * ==============================================================================
 * 
 * Permite grabar notas musicales en tiempo real simplemente escuchando la canción
 * y presionando las teclas D, F, J, K (o tocando los carriles en pantalla).
 * 
 * Características:
 * - Selección de canciones integradas o subida de MP3 propio.
 * - Grabación precisa en segundos (ej. time: 10.35s).
 * - Scrubber interactivo para retroceder, pausar y avanzar.
 * - Control de velocidad de reproducción (0.5x, 0.75x, 1.0x).
 * - Toggle para notas especiales con Logo / Estrella.
 * - Deshacer última nota (Ctrl+Z).
 * - Copiar código TypeScript listo con 1 solo clic.
 * - Probar de inmediato la partitura grabada en el juego.
 */

export interface ChartNoteRecord {
  lane: number;
  time: number;
  isStar?: boolean;
  logoType?: 1 | 2;
}

export class ChartEditorModal {
  private container: HTMLElement;
  private audioElement: HTMLAudioElement | null = null;

  // Estado del editor
  private recordedNotes: ChartNoteRecord[] = [];
  private isNextStar: boolean = false;
  private selectedSongFile: string = "jingle-bells.mp3";
  private playbackSpeed: number = 1.0;
  private updateInterval: number | null = null;
  private currentSongBpm: number = 119;

  // Web Audio para hitsounds en vivo
  private audioCtx: AudioContext | null = null;

  // Callbacks
  public onPlayCustomChart?: (notes: ChartNoteRecord[], songFile: string, bpm: number) => void;
  public onClose?: () => void;

  constructor(containerId: string) {
    let el = document.getElementById(containerId);
    if (!el) {
      el = document.createElement("div");
      el.id = containerId;
      el.className = "kiosk-overlay modal-layer";
      el.style.display = "none";
      const mainEl = document.getElementById("kiosk-main") || document.body;
      mainEl.appendChild(el);
    }
    this.container = el;
  }

  public show(defaultSongFile: string = "jingle-bells.mp3", initialNotes: ChartNoteRecord[] = []): void {
    this.selectedSongFile = defaultSongFile;
    this.recordedNotes = [...initialNotes];
    this.isNextStar = false;
    this.playbackSpeed = 1.0;

    this.render();
    this.container.style.display = "flex";
    this.setupAudio();
    this.setupEvents();
    this.startProgressTicker();
  }

  public hide(): void {
    this.stopAudio();
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.container.style.display = "none";
    if (this.onClose) this.onClose();
  }

  private setupAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }

    try {
      this.audioElement = new Audio(`./assets/audio/${this.selectedSongFile}`);
      this.audioElement.playbackRate = this.playbackSpeed;
      this.audioElement.volume = 0.85;

      this.audioElement.addEventListener("loadedmetadata", () => {
        this.updateTimeDisplay();
      });

      this.audioElement.addEventListener("ended", () => {
        this.updatePlayButton(false);
      });
    } catch {
      console.warn("No se pudo cargar el audio para el editor");
    }
  }

  private playHitsound(lane: number): void {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const freqs = [220, 261.63, 293.66, 329.63]; // Tonos cálidos La3, Do4, Re4, Mi4
      const freq = freqs[lane] || 260;
      const now = this.audioCtx.currentTime;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignorar si audio está restringido
    }
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="chart-editor-card">
        <!-- CABECERA -->
        <div class="editor-header">
          <div class="editor-title-group">
            <span class="editor-badge">🛠️ MODO GRABADOR / EDITOR</span>
            <h2 class="editor-title">🎹 Editor de Notas al Ritmo</h2>
            <p class="editor-subtitle">Reproduce la música y presiona las teclas al compás para grabar las notas en tiempo real.</p>
          </div>
          <button id="btn-editor-close" class="btn-editor-icon-close" title="Cerrar Editor">✕</button>
        </div>

        <!-- PANEL DE CONTROL DE CANCIÓN Y AUDIO -->
        <div class="editor-control-panel">
          <div class="editor-row">
            <div class="editor-song-select-group">
              <label class="editor-label">Canción:</label>
              <select id="editor-song-select" class="editor-select">
                <option value="jingle-bells.mp3" ${this.selectedSongFile === "jingle-bells.mp3" ? "selected" : ""}>🔔 Jingle Bells Rock (119 BPM)</option>
                <option value="deck-the-halls.mp3" ${this.selectedSongFile === "deck-the-halls.mp3" ? "selected" : ""}>🎄 Deck The Halls Rush (140 BPM)</option>
                <option value="carol-of-bells.mp3" ${this.selectedSongFile === "carol-of-bells.mp3" ? "selected" : ""}>❄️ Carol of the Bells (156 BPM)</option>
              </select>
            </div>

            <div class="editor-speed-group">
              <label class="editor-label">Velocidad:</label>
              <div class="editor-btn-toggle-group">
                <button class="btn-speed ${this.playbackSpeed === 0.5 ? "active" : ""}" data-speed="0.5">0.5x (Lento)</button>
                <button class="btn-speed ${this.playbackSpeed === 0.75 ? "active" : ""}" data-speed="0.75">0.75x</button>
                <button class="btn-speed ${this.playbackSpeed === 1.0 ? "active" : ""}" data-speed="1.0">1.0x (Normal)</button>
              </div>
            </div>

            <div class="editor-star-toggle-group">
              <label class="editor-label">Próxima nota:</label>
              <button id="btn-toggle-star" class="btn-star-toggle ${this.isNextStar ? "active" : ""}">
                ⭐ ${this.isNextStar ? "Nota Logo (x4)" : "Nota Normal"}
              </button>
            </div>
          </div>

          <!-- BARRA DE TIEMPO / TIMELINE SCRUBBER -->
          <div class="editor-timeline-box">
            <span id="editor-current-time" class="timeline-time">00:00.00</span>
            <input type="range" id="editor-timeline-slider" class="timeline-slider" min="0" max="129" step="0.01" value="0" />
            <span id="editor-total-time" class="timeline-time">02:08.50</span>
          </div>

          <!-- CONTROLES DE REPRODUCCIÓN -->
          <div class="editor-playback-actions">
            <button id="btn-editor-rewind" class="btn-editor-ctrl">⏪ -3s</button>
            <button id="btn-editor-play" class="btn-editor-ctrl btn-play-main">▶️ REPRODUCIR</button>
            <button id="btn-editor-forward" class="btn-editor-ctrl">⏩ +3s</button>
            <button id="btn-editor-restart" class="btn-editor-ctrl">🔄 Reiniciar</button>
          </div>
        </div>

        <!-- 4 BOTONES DE CARRILES INTERACTIVOS (GRABACIÓN TÁCTIL Y TECLADO) -->
        <div class="editor-tap-zone">
          <div class="editor-lane-btn lane-0" data-lane="0">
            <span class="lane-arrow">←</span>
            <span class="lane-key">Tecla [ D ]</span>
            <span class="lane-name">Rojo (Izq)</span>
          </div>
          <div class="editor-lane-btn lane-1" data-lane="1">
            <span class="lane-arrow">↓</span>
            <span class="lane-key">Tecla [ F ]</span>
            <span class="lane-name">Dorado (Abajo)</span>
          </div>
          <div class="editor-lane-btn lane-2" data-lane="2">
            <span class="lane-arrow">↑</span>
            <span class="lane-key">Tecla [ J ]</span>
            <span class="lane-name">Verde (Arriba)</span>
          </div>
          <div class="editor-lane-btn lane-3" data-lane="3">
            <span class="lane-arrow">→</span>
            <span class="lane-key">Tecla [ K ]</span>
            <span class="lane-name">Azul (Der)</span>
          </div>
        </div>

        <!-- VISOR DE NOTAS GRABADAS Y ACCIONES -->
        <div class="editor-notes-summary">
          <div class="notes-header-row">
            <span class="notes-count-badge">📝 Notas Grabadas: <strong id="editor-notes-count">${this.recordedNotes.length}</strong></span>
            <div class="notes-quick-actions">
              <button id="btn-editor-undo" class="btn-editor-small" title="Deshacer última nota (Ctrl+Z)">↩️ Deshacer</button>
              <button id="btn-editor-load-defaults" class="btn-editor-small" title="Cargar notas predeterminadas de Jingle Bells">📥 Cargar Notas Actuales</button>
              <button id="btn-editor-clear" class="btn-editor-small btn-danger" title="Borrar todas las notas grabadas">🗑️ Limpiar</button>
            </div>
          </div>
          
          <div id="editor-notes-list" class="editor-notes-list">
            ${this.renderNotesListHtml()}
          </div>
        </div>

        <!-- ACCIONES DE EXPORTACIÓN Y PRUEBA EN VIVO -->
        <div class="editor-footer-actions">
          <button id="btn-editor-copy" class="btn-action-primary btn-copy">
            📋 COPIAR CÓDIGO TYPESCRIPT
          </button>
          <button id="btn-editor-test" class="btn-action-primary btn-test">
            🎮 JUGAR ESTA PARTITURA AHORA
          </button>
        </div>

        <!-- TOAST DE NOTIFICACIÓN -->
        <div id="editor-toast" class="editor-toast" style="display: none;"></div>
      </div>
    `;
  }

  private renderNotesListHtml(): string {
    if (this.recordedNotes.length === 0) {
      return `<p class="notes-empty">Dale a <strong>▶️ REPRODUCIR</strong> y toca <strong>D, F, J, K</strong> al compás de la música para grabar notas.</p>`;
    }

    const laneNames = ["🔴 Izq", "🟡 Abajo", "🟢 Arriba", "🔵 Der"];

    return this.recordedNotes
      .map((note, index) => {
        return `
          <span class="note-chip ${note.isStar ? "star-chip" : ""}">
            #${index + 1}: ${laneNames[note.lane] || "Nota"} @ <strong>${note.time.toFixed(2)}s</strong> ${note.isStar ? "⭐" : ""}
          </span>
        `;
      })
      .join("");
  }

  private setupEvents(): void {
    const btnClose = this.container.querySelector("#btn-editor-close");
    const btnPlay = this.container.querySelector("#btn-editor-play") as HTMLButtonElement;
    const btnRewind = this.container.querySelector("#btn-editor-rewind");
    const btnForward = this.container.querySelector("#btn-editor-forward");
    const btnRestart = this.container.querySelector("#btn-editor-restart");
    const slider = this.container.querySelector("#editor-timeline-slider") as HTMLInputElement;
    const songSelect = this.container.querySelector("#editor-song-select") as HTMLSelectElement;
    const btnToggleStar = this.container.querySelector("#btn-toggle-star");
    const btnUndo = this.container.querySelector("#btn-editor-undo");
    const btnClear = this.container.querySelector("#btn-editor-clear");
    const btnLoadDefaults = this.container.querySelector("#btn-editor-load-defaults");
    const btnCopy = this.container.querySelector("#btn-editor-copy");
    const btnTest = this.container.querySelector("#btn-editor-test");

    btnClose?.addEventListener("click", () => this.hide());

    btnPlay?.addEventListener("click", () => {
      this.togglePlay();
    });

    btnRewind?.addEventListener("click", () => {
      if (this.audioElement) {
        this.audioElement.currentTime = Math.max(0, this.audioElement.currentTime - 3);
        this.updateTimeDisplay();
      }
    });

    btnForward?.addEventListener("click", () => {
      if (this.audioElement) {
        this.audioElement.currentTime = Math.min(this.audioElement.duration || 45, this.audioElement.currentTime + 3);
        this.updateTimeDisplay();
      }
    });

    btnRestart?.addEventListener("click", () => {
      if (this.audioElement) {
        this.audioElement.currentTime = 0;
        this.updateTimeDisplay();
      }
    });

    slider?.addEventListener("input", () => {
      if (this.audioElement) {
        this.audioElement.currentTime = parseFloat(slider.value);
        this.updateTimeDisplay();
      }
    });

    songSelect?.addEventListener("change", () => {
      this.selectedSongFile = songSelect.value;
      if (this.selectedSongFile === "jingle-bells.mp3") this.currentSongBpm = 119;
      else if (this.selectedSongFile === "deck-the-halls.mp3") this.currentSongBpm = 140;
      else this.currentSongBpm = 156;
      this.setupAudio();
    });

    // Control de velocidad
    const speedButtons = this.container.querySelectorAll(".btn-speed");
    speedButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const target = e.currentTarget as HTMLElement;
        const sp = parseFloat(target.getAttribute("data-speed") || "1.0");
        this.playbackSpeed = sp;
        if (this.audioElement) this.audioElement.playbackRate = sp;
        speedButtons.forEach((b) => b.classList.remove("active"));
        target.classList.add("active");
      });
    });

    btnToggleStar?.addEventListener("click", () => {
      this.isNextStar = !this.isNextStar;
      btnToggleStar.classList.toggle("active", this.isNextStar);
      btnToggleStar.textContent = this.isNextStar ? "⭐ Nota Logo (x4)" : "⭐ Nota Normal";
    });

    btnUndo?.addEventListener("click", () => {
      this.undoLastNote();
    });

    btnClear?.addEventListener("click", () => {
      if (confirm("¿Deseas borrar todas las notas grabadas de la lista?")) {
        this.recordedNotes = [];
        this.updateNotesView();
        this.showToast("🗑️ Lista de notas vaciada");
      }
    });

    btnLoadDefaults?.addEventListener("click", () => {
      this.loadJingleBellsDefaults();
      this.showToast("📥 Notas de Jingle Bells cargadas");
    });

    btnCopy?.addEventListener("click", () => {
      this.copyChartCode();
    });

    btnTest?.addEventListener("click", () => {
      this.testChartInGame();
    });

    // Clics táctiles en los 4 carriles
    const laneButtons = this.container.querySelectorAll(".editor-lane-btn");
    laneButtons.forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        const lane = parseInt((btn as HTMLElement).getAttribute("data-lane") || "0", 10);
        this.recordNote(lane);
        btn.classList.add("pressed");
        setTimeout(() => btn.classList.remove("pressed"), 120);
      });
    });

    // Listeners de teclado globales mientras el editor esté abierto
    window.addEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.container.style.display === "none") return;

    // Deshacer con Ctrl+Z
    if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z")) {
      e.preventDefault();
      this.undoLastNote();
      return;
    }

    // Play/Pause con Espacio
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      this.togglePlay();
      return;
    }

    // Toggle de nota especial con Shift
    if (e.key === "Shift") {
      this.isNextStar = !this.isNextStar;
      const btn = this.container.querySelector("#btn-toggle-star");
      if (btn) {
        btn.classList.toggle("active", this.isNextStar);
        btn.textContent = this.isNextStar ? "⭐ Nota Logo (x4)" : "⭐ Nota Normal";
      }
      return;
    }

    let lane = -1;
    if (e.key === "d" || e.key === "D" || e.key === "ArrowLeft") lane = 0;
    else if (e.key === "f" || e.key === "F" || e.key === "ArrowDown") lane = 1;
    else if (e.key === "j" || e.key === "J" || e.key === "ArrowUp") lane = 2;
    else if (e.key === "k" || e.key === "K" || e.key === "ArrowRight") lane = 3;

    if (lane !== -1) {
      e.preventDefault();
      this.recordNote(lane);

      const laneEl = this.container.querySelector(`.lane-${lane}`);
      if (laneEl) {
        laneEl.classList.add("pressed");
        setTimeout(() => laneEl.classList.remove("pressed"), 120);
      }
    }
  };

  private recordNote(lane: number): void {
    const time = this.audioElement ? this.audioElement.currentTime : 0;
    this.playHitsound(lane);

    const newNote: ChartNoteRecord = {
      lane,
      time: Math.round(time * 100) / 100,
      isStar: this.isNextStar
    };

    // Si fue estrella, se resetea el toggle a normal automáticamente para el próximo toque
    if (this.isNextStar) {
      this.isNextStar = false;
      const btn = this.container.querySelector("#btn-toggle-star");
      if (btn) {
        btn.classList.remove("active");
        btn.textContent = "⭐ Nota Normal";
      }
    }

    this.recordedNotes.push(newNote);
    // Mantener orden cronológico
    this.recordedNotes.sort((a, b) => a.time - b.time);
    this.updateNotesView();
  }

  private undoLastNote(): void {
    if (this.recordedNotes.length > 0) {
      const removed = this.recordedNotes.pop();
      this.updateNotesView();
      this.showToast(`↩️ Nota en ${removed?.time.toFixed(2)}s eliminada`);
    }
  }

  private togglePlay(): void {
    if (!this.audioElement) return;

    if (this.audioElement.paused) {
      this.audioElement.play().then(() => {
        this.updatePlayButton(true);
      }).catch(() => {
        console.warn("Autoplay bloqueado");
      });
    } else {
      this.audioElement.pause();
      this.updatePlayButton(false);
    }
  }

  private stopAudio(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.updatePlayButton(false);
  }

  private updatePlayButton(isPlaying: boolean): void {
    const btnPlay = this.container.querySelector("#btn-editor-play");
    if (btnPlay) {
      btnPlay.innerHTML = isPlaying ? "⏸️ PAUSAR" : "▶️ REPRODUCIR";
      btnPlay.classList.toggle("playing", isPlaying);
    }
  }

  private startProgressTicker(): void {
    if (this.updateInterval !== null) clearInterval(this.updateInterval);

    this.updateInterval = window.setInterval(() => {
      this.updateTimeDisplay();
    }, 40);
  }

  private updateTimeDisplay(): void {
    if (!this.audioElement) return;

    const cur = this.audioElement.currentTime;
    const dur = this.audioElement.duration || 45;

    const curEl = this.container.querySelector("#editor-current-time");
    const durEl = this.container.querySelector("#editor-total-time");
    const slider = this.container.querySelector("#editor-timeline-slider") as HTMLInputElement;

    if (curEl) curEl.textContent = this.formatTime(cur);
    if (durEl && !isNaN(dur)) durEl.textContent = this.formatTime(dur);
    if (slider && !isNaN(dur)) {
      slider.max = dur.toString();
      slider.value = cur.toString();
    }
  }

  private formatTime(sec: number): string {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  }

  private updateNotesView(): void {
    const countEl = this.container.querySelector("#editor-notes-count");
    const listEl = this.container.querySelector("#editor-notes-list");

    if (countEl) countEl.textContent = this.recordedNotes.length.toString();
    if (listEl) {
      listEl.innerHTML = this.renderNotesListHtml();
      listEl.scrollTop = listEl.scrollHeight;
    }
  }

  private copyChartCode(): void {
    const codeLines = this.recordedNotes.map((n) => {
      const starStr = n.isStar ? ", isStar: true" : "";
      return `  { lane: ${n.lane}, time: ${n.time.toFixed(2)}${starStr} },`;
    });

    const output = `// Partitura generada con el Grabador de Ritmo\nconst vocalChart = [\n${codeLines.join("\n")}\n];`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output).then(() => {
        this.showToast("📋 ¡Código TypeScript copiado al portapapeles con éxito!");
      }).catch(() => {
        this.fallbackCopy(output);
      });
    } else {
      this.fallbackCopy(output);
    }
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      this.showToast("📋 ¡Código copiado al portapapeles!");
    } catch {
      alert("Copia las notas:\n\n" + text);
    }
    document.body.removeChild(textArea);
  }

  private testChartInGame(): void {
    if (this.recordedNotes.length === 0) {
      this.showToast("⚠️ Primero graba algunas notas antes de probar");
      return;
    }

    this.hide();
    if (this.onPlayCustomChart) {
      this.onPlayCustomChart(this.recordedNotes, this.selectedSongFile, this.currentSongBpm);
    }
  }

  private loadJingleBellsDefaults(): void {
    this.recordedNotes = [
      { lane: 0, time: 1.30 },
      { lane: 1, time: 2.24 },
      { lane: 2, time: 3.32 },
      { lane: 3, time: 3.85 },
      { lane: 1, time: 4.30 },
      { lane: 2, time: 4.72 },
      { lane: 0, time: 5.06 },
      { lane: 0, time: 5.61, isStar: true },
      { lane: 0, time: 6.17 },
      { lane: 0, time: 6.67 },
      { lane: 1, time: 7.23 },
      { lane: 0, time: 7.71 },
      { lane: 2, time: 8.14 },
      { lane: 3, time: 8.66 },
      { lane: 1, time: 9.14 },
      { lane: 1, time: 9.64 },
      { lane: 0, time: 10.12 },
      { lane: 0, time: 10.61 },
      { lane: 1, time: 11.15 },
      { lane: 0, time: 11.47 },
      { lane: 2, time: 11.64 },
      { lane: 3, time: 11.93 },
      { lane: 1, time: 13.06 },
      { lane: 0, time: 13.44 },
      { lane: 2, time: 13.61 },
      { lane: 3, time: 14.05 },
      { lane: 1, time: 15.01 },
      { lane: 0, time: 15.40 },
      { lane: 2, time: 15.65 },
      { lane: 3, time: 16.03 },
      { lane: 0, time: 17.14 },
      { lane: 0, time: 17.64 },
      { lane: 2, time: 18.04 },
      { lane: 2, time: 18.59 },
      { lane: 1, time: 19.06 },
      { lane: 1, time: 19.59 },
      { lane: 3, time: 20.06 },
      { lane: 0, time: 21.39, isStar: true },
      { lane: 1, time: 21.58 },
      { lane: 2, time: 21.91 },
      { lane: 3, time: 22.14 },
      { lane: 1, time: 22.62 },
      { lane: 2, time: 23.08 },
      { lane: 0, time: 23.53 },
      { lane: 3, time: 23.89 },
      { lane: 1, time: 24.43 },
      { lane: 1, time: 25.05 },
      { lane: 1, time: 25.58 },
      { lane: 0, time: 26.05 },
      { lane: 0, time: 26.63 },
      { lane: 2, time: 27.06 },
      { lane: 1, time: 27.40 },
      { lane: 3, time: 27.68 },
      { lane: 1, time: 29.04, isStar: true },
      { lane: 0, time: 29.34 },
      { lane: 2, time: 29.49 },
      { lane: 3, time: 29.97 },
      { lane: 1, time: 30.54 },
      { lane: 0, time: 31.05 },
      { lane: 2, time: 31.35 },
      { lane: 3, time: 31.64 },
      { lane: 0, time: 31.90 },
      { lane: 1, time: 33.02 },
      { lane: 1, time: 33.51 },
      { lane: 3, time: 33.96 },
      { lane: 3, time: 34.53 },
      { lane: 0, time: 34.98 },
      { lane: 1, time: 35.30 },
      { lane: 2, time: 35.53 },
      { lane: 3, time: 35.80 },
      { lane: 0, time: 37.26, isStar: true },
      { lane: 3, time: 37.29 },
      { lane: 1, time: 37.89 },
      { lane: 2, time: 37.95 },
      { lane: 3, time: 38.43 },
      { lane: 0, time: 38.46 },
      { lane: 0, time: 39.00 },
      { lane: 1, time: 39.30 },
      { lane: 2, time: 39.54 },
      { lane: 3, time: 39.79 },
      { lane: 2, time: 40.01 },
      { lane: 1, time: 40.27 },
      { lane: 0, time: 40.50 },
      { lane: 0, time: 40.98 },
      { lane: 3, time: 41.39 },
      { lane: 0, time: 41.92 },
      { lane: 3, time: 42.42 },
      { lane: 0, time: 42.95 },
      { lane: 3, time: 43.47 },
      { lane: 0, time: 43.95 },
      { lane: 3, time: 44.49 },
      { lane: 1, time: 44.95 },
      { lane: 2, time: 45.40 },
      { lane: 0, time: 45.90 },
      { lane: 3, time: 46.47 },
      { lane: 0, time: 47.16, isStar: true },
      { lane: 1, time: 47.34 },
      { lane: 2, time: 47.55 },
      { lane: 3, time: 47.82 },
      { lane: 2, time: 48.08 },
      { lane: 1, time: 48.31 },
      { lane: 0, time: 48.54 },
      { lane: 1, time: 48.98 },
      { lane: 3, time: 49.47 },
      { lane: 0, time: 49.87 },
      { lane: 3, time: 50.41 },
      { lane: 0, time: 50.91 },
      { lane: 3, time: 51.40 },
      { lane: 0, time: 51.82 },
      { lane: 2, time: 52.15 },
      { lane: 1, time: 52.42 },
      { lane: 3, time: 52.72 },
      { lane: 0, time: 52.91 },
      { lane: 3, time: 52.95 },
      { lane: 0, time: 53.41 },
      { lane: 3, time: 53.45 },
      { lane: 0, time: 53.93 },
      { lane: 3, time: 53.97 },
      { lane: 0, time: 54.46 },
      { lane: 3, time: 54.50 },
      { lane: 1, time: 54.98 },
      { lane: 2, time: 55.30 },
      { lane: 0, time: 55.52 },
      { lane: 3, time: 55.76 },
      { lane: 1, time: 55.97 },
      { lane: 2, time: 56.28 },
      { lane: 0, time: 56.46 },
      { lane: 3, time: 56.66 },
      { lane: 0, time: 57.04, isStar: true },
      { lane: 1, time: 57.31 },
      { lane: 3, time: 57.49 },
      { lane: 1, time: 57.93 },
      { lane: 0, time: 58.27 },
      { lane: 3, time: 58.48 },
      { lane: 1, time: 58.91 },
      { lane: 0, time: 59.20 },
      { lane: 2, time: 59.33 },
      { lane: 3, time: 59.65 },
      { lane: 1, time: 60.26 },
      { lane: 0, time: 60.67 },
      { lane: 1, time: 60.89 },
      { lane: 1, time: 61.18 },
      { lane: 0, time: 61.41 },
      { lane: 2, time: 61.75 },
      { lane: 3, time: 61.95 },
      { lane: 1, time: 62.43 },
      { lane: 0, time: 62.90 },
      { lane: 2, time: 63.20 },
      { lane: 3, time: 63.43 },
      { lane: 1, time: 63.68 },
      { lane: 0, time: 64.16 },
      { lane: 0, time: 64.37 },
      { lane: 1, time: 64.82 },
      { lane: 1, time: 65.38 },
      { lane: 0, time: 65.84 },
      { lane: 0, time: 66.39 },
      { lane: 2, time: 66.82 },
      { lane: 2, time: 67.32 },
      { lane: 1, time: 67.80 },
      { lane: 1, time: 68.36 },
      { lane: 3, time: 68.85 },
      { lane: 3, time: 69.43 },
      { lane: 0, time: 69.87 },
      { lane: 1, time: 70.34 },
      { lane: 2, time: 70.62 },
      { lane: 3, time: 70.88 },
      { lane: 1, time: 71.89, isStar: true },
      { lane: 2, time: 72.31 },
      { lane: 3, time: 72.62 },
      { lane: 1, time: 72.93 },
      { lane: 1, time: 73.38 },
      { lane: 0, time: 73.89 },
      { lane: 0, time: 74.43 },
      { lane: 2, time: 74.89 },
      { lane: 1, time: 75.25 },
      { lane: 3, time: 75.66 },
      { lane: 1, time: 76.96 },
      { lane: 0, time: 77.26 },
      { lane: 2, time: 77.43 },
      { lane: 3, time: 77.71 },
      { lane: 1, time: 78.44 },
      { lane: 0, time: 78.90 },
      { lane: 2, time: 79.25 },
      { lane: 3, time: 79.56 },
      { lane: 0, time: 80.85 },
      { lane: 1, time: 80.90 },
      { lane: 3, time: 81.94 },
      { lane: 2, time: 82.00 },
      { lane: 1, time: 82.90 },
      { lane: 0, time: 82.95 },
      { lane: 1, time: 83.46 },
      { lane: 2, time: 83.51 },
      { lane: 3, time: 83.94 },
      { lane: 2, time: 83.99 },
      { lane: 0, time: 84.96 },
      { lane: 1, time: 85.50 },
      { lane: 0, time: 85.96 },
      { lane: 2, time: 86.46 },
      { lane: 0, time: 86.90 },
      { lane: 3, time: 87.46 },
      { lane: 1, time: 87.92 },
      { lane: 2, time: 88.27 },
      { lane: 0, time: 88.52 },
      { lane: 3, time: 88.82 },
      { lane: 1, time: 89.05 },
      { lane: 0, time: 89.52 },
      { lane: 3, time: 90.03 },
      { lane: 0, time: 90.53 },
      { lane: 3, time: 91.00 },
      { lane: 0, time: 91.51 },
      { lane: 3, time: 91.98 },
      { lane: 0, time: 92.46 },
      { lane: 2, time: 93.01, isStar: true },
      { lane: 2, time: 93.50 },
      { lane: 1, time: 93.96 },
      { lane: 1, time: 94.46 },
      { lane: 0, time: 94.94 },
      { lane: 1, time: 95.36 },
      { lane: 0, time: 95.57 },
      { lane: 2, time: 95.83 },
      { lane: 3, time: 96.08 },
      { lane: 1, time: 96.33 },
      { lane: 2, time: 96.58 },
      { lane: 0, time: 96.87 },
      { lane: 0, time: 97.06 },
      { lane: 2, time: 97.68 },
      { lane: 0, time: 98.10 },
      { lane: 2, time: 98.59 },
      { lane: 0, time: 99.07 },
      { lane: 2, time: 99.58 },
      { lane: 0, time: 100.03 },
      { lane: 2, time: 100.54 },
      { lane: 0, time: 101.03 },
      { lane: 3, time: 101.09 },
      { lane: 0, time: 101.57 },
      { lane: 3, time: 101.62 },
      { lane: 0, time: 102.11 },
      { lane: 3, time: 102.16 },
      { lane: 0, time: 102.63 },
      { lane: 3, time: 102.69 },
      { lane: 0, time: 103.19 },
      { lane: 3, time: 103.26 },
      { lane: 0, time: 103.68 },
      { lane: 3, time: 103.73 },
      { lane: 0, time: 104.18 },
      { lane: 3, time: 104.23 },
      { lane: 0, time: 104.64 },
      { lane: 3, time: 104.70 },
      { lane: 1, time: 105.24 },
      { lane: 1, time: 105.69 },
      { lane: 0, time: 106.15 },
      { lane: 0, time: 106.69 },
      { lane: 1, time: 107.17 },
      { lane: 1, time: 107.56 },
      { lane: 0, time: 107.72 },
      { lane: 2, time: 108.01 },
      { lane: 3, time: 108.66 },
      { lane: 1, time: 109.16 },
      { lane: 1, time: 109.69 },
      { lane: 0, time: 110.21 },
      { lane: 0, time: 110.76 },
      { lane: 2, time: 111.23 },
      { lane: 1, time: 111.73 },
      { lane: 3, time: 112.19 },
      { lane: 2, time: 112.72 },
      { lane: 1, time: 113.19 },
      { lane: 0, time: 113.71 },
      { lane: 2, time: 114.17 },
      { lane: 3, time: 114.77 },
      { lane: 1, time: 115.29 },
      { lane: 2, time: 115.84 },
      { lane: 0, time: 116.34 },
      { lane: 3, time: 116.78 },
      { lane: 0, time: 117.23 },
      { lane: 3, time: 117.30 },
      { lane: 1, time: 118.22 },
      { lane: 3, time: 118.28 },
      { lane: 0, time: 118.78 },
      { lane: 2, time: 118.84 },
      { lane: 1, time: 119.30 },
      { lane: 3, time: 119.37 },
      { lane: 0, time: 120.34 },
      { lane: 2, time: 120.40 },
      { lane: 1, time: 120.90 },
      { lane: 3, time: 120.96 },
      { lane: 0, time: 121.37 },
      { lane: 2, time: 121.44 },
      { lane: 1, time: 122.32 },
      { lane: 3, time: 122.39 },
      { lane: 0, time: 122.85 },
      { lane: 2, time: 122.91 },
      { lane: 3, time: 123.41 },
      { lane: 1, time: 123.72 },
      { lane: 2, time: 123.90 },
      { lane: 0, time: 124.14 },
      { lane: 3, time: 124.35 },
      { lane: 1, time: 124.64 },
      { lane: 2, time: 124.86 },
      { lane: 0, time: 125.11 },
      { lane: 3, time: 125.37 },
      { lane: 1, time: 125.93 },
      { lane: 2, time: 126.42 },
      { lane: 1, time: 126.93 },
      { lane: 3, time: 127.56 }
    ];
    this.updateNotesView();
  }

  private showToast(msg: string): void {
    const toast = this.container.querySelector("#editor-toast") as HTMLElement;
    if (toast) {
      toast.textContent = msg;
      toast.style.display = "block";
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
          toast.style.display = "none";
        }, 300);
      }, 3000);
    }
  }
}
