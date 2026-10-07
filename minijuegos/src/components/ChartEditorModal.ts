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

import {
  RHYTHM_SONG_LIST,
  JINGLE_BELLS_CHART,
  ROCKIN_AROUND_CHART,
  DANIELA_CHART,
  BURRITO_METAL_CHART,
  JOY_TO_THE_WORLD_CHART,
  type SongDef,
  type ChartNoteRecord
} from "../data/songs";

export { type ChartNoteRecord, type SongDef };


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
      const audioUrl = `./assets/audio/${encodeURIComponent(this.selectedSongFile)}`;
      this.audioElement = new Audio(audioUrl);
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
                ${RHYTHM_SONG_LIST.map((s) => `
                  <option value="${s.audioFile}" ${this.selectedSongFile === s.audioFile ? "selected" : ""}>
                    ${s.icon} ${s.title} (${s.bpm} BPM)
                  </option>
                `).join("")}
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
      const songDef = RHYTHM_SONG_LIST.find((s) => s.audioFile === this.selectedSongFile);
      if (songDef) {
        this.currentSongBpm = songDef.bpm;
      }
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
    if (this.selectedSongFile === "jingle-bells.mp3") {
      this.recordedNotes = [...JINGLE_BELLS_CHART];
    } else if (this.selectedSongFile === "Rockin' Around The Christmas Tree.mp3") {
      this.recordedNotes = [...ROCKIN_AROUND_CHART];
    } else if (this.selectedSongFile === "DANIELA - Rodolfo Aicardi.mp3") {
      this.recordedNotes = [...DANIELA_CHART];
    } else if (this.selectedSongFile.includes("Burrito")) {
      this.recordedNotes = [...BURRITO_METAL_CHART];
    } else if (this.selectedSongFile.includes("Joy")) {
      this.recordedNotes = [...JOY_TO_THE_WORLD_CHART];
    }
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
