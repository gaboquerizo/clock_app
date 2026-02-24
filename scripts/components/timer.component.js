// scripts/components/timer.component.js

export class TimerComponent extends HTMLElement {
    static get observedAttributes() {
        // time: total seconds (default 20)
        // label: timer name (default "Timer")
        return ["time", "label"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        // lifecycle / state
        this._mounted = false;
        this._timerInterval = null;

        // timer values
        this._FULL_DASH_ARRAY = 283;
        this._timeLimit = 20;
        this._timePassed = 0;
        this._timeLeft = this._timeLimit;
        this._running = false;

        // cached nodes
        this.$ = {
            label: null,
            path: null,
            btnPlay: null,
            btnReset: null,
            name: null,
        };
    }

    connectedCallback() {
        if (this._mounted) return;
        this._mounted = true;

        this._syncFromAttributes();
        this._renderComponent();
        this._cacheDOM();
        this._bindEvents();

        // render initial state (no auto-start)
        this._renderTime();
        this._setCircleDasharray();
        this._updatePlayIcon();
        this._renderName();
    }

    disconnectedCallback() {
        this._stopTimer();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "time") {
            const next = Number(newValue);
            if (Number.isFinite(next) && next > 0) {
                this._timeLimit = Math.floor(next);
            } else {
                this._timeLimit = 20;
            }
            this._resetTimer();
        }

        if (name === "label") {
            this._renderName();
        }
    }

    // -------------------------
    // Render
    // -------------------------

    _renderComponent() {
        this.shadowRoot.innerHTML = `
      ${this._templateCSS()}
      ${this._templateHTML()}
    `;
    }

    _templateCSS() {
        return `
      <style>
        :host { display: flex; }

        .app-timer-item {
          width: 100%;
          height: 320px;
          max-height: 320px;
          background-color: var(--bg-color-1);
          outline: var(--solid-1) var(--bg-color-3);
          border-radius: var(--radius-4);
          padding: var(--space-100);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: 0.2s outline;
        }

        .app-timer-item:hover {
          outline: var(--solid-1) var(--bg-color-6);
        }

        .app-timer-item header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-050);
        }

        .timer-name {
          color: var(--tx-color-1);
          font-size: var(--size-5);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 75%;
        }

        .timer-actions {
          display: flex;
          gap: var(--space-050);
        }

        .app-timer-item section {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .app-timer-item footer {
          display: flex;
          justify-content: center;
          gap: var(--space-100);
        }

        .app-timer-item footer button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-025);
          border-radius: var(--radius-2);
          border: none;
          background-color: var(--bg-color-1);
          outline: var(--solid-1) var(--bg-color-3);
          color: var(--tx-color-1);
          cursor: pointer;
          transition: 0.2s outline;
        }

        .app-timer-item footer button:hover {
          outline: var(--solid-1) var(--bg-color-6);
        }

        .app-timer-item footer button.primary {
          background-color: var(--color);
          color: var(--bg-color-1);
        }

        .app-timer-item footer button.primary:hover {
          outline: var(--solid-1) var(--color);
        }

        .app-timer-item footer svg {
          width: var(--size-6);
          min-width: var(--size-6);
          height: auto;
          color: currentColor;
        }

        .base-timer {
          position: relative;
          display: flex;
          justify-content: center;
          width: 220px;
          height: 220px;
        }

        .base-timer svg { width: 100%; }

        .base-timer__svg { transform: scaleX(-1); }

        .base-timer__circle { fill: none; stroke: none; }

        .base-timer__path-elapsed {
          stroke-width: 4px;
          stroke: var(--bg-color-3);
        }

        .base-timer__path-remaining {
          stroke-width: 4px;
          stroke-linecap: round;
          transform: rotate(90deg);
          transform-origin: center;
          transition: 1s linear stroke-dasharray;
          fill-rule: nonzero;
          stroke: currentColor;
        }

        .base-timer__label {
          position: absolute;
          width: 220px;
          height: 220px;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--size-9);
          color: var(--tx-color-1);
        }
      </style>
    `;
    }

    _templateHTML() {
        return `
      <article class="app-timer-item">
        <header>
          <div class="timer-name" data-name></div>
          <div class="timer-actions">
            <!-- Placeholder: full screen icon/action later -->
          </div>
        </header>

        <section>
          <div class="base-timer">
            <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <g class="base-timer__circle">
                <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
                <path
                  data-path
                  stroke-dasharray="${this._FULL_DASH_ARRAY}"
                  class="base-timer__path-remaining"
                  style="color: var(--color)"
                  d="
                    M 50, 50
                    m -45, 0
                    a 45,45 0 1,0 90,0
                    a 45,45 0 1,0 -90,0
                  "
                ></path>
              </g>
            </svg>

            <span data-label class="base-timer__label">00:00</span>
          </div>
        </section>

        <footer>
          <button class="primary" type="button" data-play aria-label="Iniciar o pausar temporizador">
            ${this._iconPlay()}
          </button>

          <button type="button" data-reset aria-label="Reiniciar temporizador">
            ${this._iconReset()}
          </button>
        </footer>
      </article>
    `;
    }

    // -------------------------
    // Setup
    // -------------------------

    _cacheDOM() {
        const root = this.shadowRoot;
        this.$.label = root.querySelector("[data-label]");
        this.$.path = root.querySelector("[data-path]");
        this.$.btnPlay = root.querySelector("[data-play]");
        this.$.btnReset = root.querySelector("[data-reset]");
        this.$.name = root.querySelector("[data-name]");
    }

    _bindEvents() {
        this.$.btnPlay.addEventListener("click", () => this._toggle());
        this.$.btnReset.addEventListener("click", () => this._resetTimer());
    }

    _syncFromAttributes() {
        // time
        if (this.hasAttribute("time")) {
            const t = Number(this.getAttribute("time"));
            if (Number.isFinite(t) && t > 0) this._timeLimit = Math.floor(t);
        }

        // label (name)
        // (no immediate DOM access here; renderName will handle it)
        this._timePassed = 0;
        this._timeLeft = this._timeLimit;
    }

    // -------------------------
    // Timer logic
    // -------------------------

    _toggle() {
        if (this._running) this._pauseTimer();
        else this._startTimer();
    }

    _startTimer() {
        if (this._running) return;

        this._running = true;
        this._updatePlayIcon();

        // safety: clear any existing interval
        this._stopIntervalOnly();

        const tick = () => {
            this._timePassed += 1;
            this._timeLeft = this._timeLimit - this._timePassed;

            if (this._timeLeft <= 0) {
                this._timeLeft = 0;
                this._renderTime();
                this._setCircleDasharray();
                this._stopTimer();
                return;
            }

            this._renderTime();
            this._setCircleDasharray();
        };

        // ✅ tick inmediato para evitar el delay de 1s
        tick();

        // luego continúa normal cada 1s
        this._timerInterval = window.setInterval(tick, 1000);
    }

    _pauseTimer() {
        if (!this._running) return;
        this._running = false;
        this._updatePlayIcon();
        this._stopIntervalOnly();
    }

    _stopTimer() {
        // stop + reset running flag (used on disconnected & when reaches 0)
        this._running = false;
        this._updatePlayIcon();
        this._stopIntervalOnly();
    }

    _stopIntervalOnly() {
        if (this._timerInterval !== null) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    _resetTimer() {
        this._stopTimer();
        this._timePassed = 0;
        this._timeLeft = this._timeLimit;
        this._renderTime();
        this._setCircleDasharray();
    }

    // -------------------------
    // UI updates
    // -------------------------

    _renderName() {
        if (!this.$.name) return;
        const label = this.getAttribute("label")?.trim() || "Timer";
        this.$.name.textContent = label;
    }

    _renderTime() {
        if (!this.$.label) return;
        this.$.label.textContent = this._formatTime(this._timeLeft);
    }

    _formatTime(timeSeconds) {
        const time = Math.max(0, Math.floor(timeSeconds));
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        const s = seconds < 10 ? `0${seconds}` : `${seconds}`;
        return `${minutes}:${s}`;
    }

    _calculateTimeFraction() {
        const raw = this._timeLeft / this._timeLimit;
        return raw - (1 / this._timeLimit) * (1 - raw);
    }

    _setCircleDasharray() {
        if (!this.$.path) return;
        const value = (this._calculateTimeFraction() * this._FULL_DASH_ARRAY).toFixed(0);
        this.$.path.setAttribute("stroke-dasharray", `${value} ${this._FULL_DASH_ARRAY}`);
    }

    _updatePlayIcon() {
        if (!this.$.btnPlay) return;
        this.$.btnPlay.innerHTML = this._running ? this._iconPause() : this._iconPlay();
    }

    // -------------------------
    // Icons
    // -------------------------

    _iconPlay() {
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
          <path fill="currentColor" d="M17.22 8.687a1.498 1.498 0 0 1 0 2.626l-9.997 5.499A1.5 1.5 0 0 1 5 15.499V4.501a1.5 1.5 0 0 1 2.223-1.313z" />
        </svg>
    `;
    }

    _iconPause() {
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" aria-hidden="true">
          <path fill="currentColor" d="M3 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm5 0a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z" />
        </svg>
    `;
    }

    _iconReset() {
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
          <path fill="currentColor" d="M5.854 2.646a.5.5 0 0 1 0 .708L4.207 5H11a6 6 0 1 1-6 6a.5.5 0 0 1 1 0a5 5 0 1 0 5-5H4.207l1.647 1.646a.5.5 0 1 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 0 1 .708 0" />
        </svg>
    `;
    }
}

// Define safely (prevents errors if loaded twice)
if (!customElements.get("timer-component")) {
    customElements.define("timer-component", TimerComponent);
}