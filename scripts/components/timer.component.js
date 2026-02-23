export class TimerComponent extends HTMLElement {

    constructor() {
        super();
        this.shadowDOM = this.attachShadow({mode: 'open'});
    };

    connectedCallback() {
        this.renderComponent()
        this.initComponent()
    };

    renderComponent() {
        this.shadowDOM.innerHTML = `
            ${this.templateCSS()}
            ${this.templateHTML()}
        `;
    };

    templateCSS(){
        return `
            <style>
                @import url("../../styles/index.css");
                
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
                
                    &:hover {
                        outline: var(--solid-1) var(--bg-color-6);
                    }
                
                    header {
                        display: flex;
                        justify-content: space-between;
                    }
                
                    section {
                        display: flex;
                        justify-content: center;
                        width: 100%;
                    }
                
                    footer {
                        display: flex;
                        justify-content: center;
                        gap: var(--space-100);
                
                        button:first-child {
                            background-color: var(--color);
                            color: var(--bg-color-1);
                            &:hover  {
                                outline: var(--solid-1) var(--color);
                            }
                        }
                
                        button {
                            display: flex;
                            padding: var(--space-025);
                            border-radius: var(--radius-2);
                            background-color: var(--bg-color-1);
                            outline: var(--solid-1) var(--bg-color-3);
                            color: var(--tx-color-1);
                            &:hover  {
                                outline: var(--solid-1) var(--bg-color-6);
                            }
                        }
                    }
                }
                
                .base-timer {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    width: 220px;
                    height: 220px;
                
                    svg {
                        width: 100%;
                    }
                }
                
                .base-timer__svg {
                    transform: scaleX(-1);
                }
                
                .base-timer__circle {
                    fill: none;
                    stroke: none;
                }
                
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
                }
                
                @import url("./styles/index.css");
            </style>
        `;
    };

    templateHTML(){
        return `
            <article class="app-timer-item">
              <header>
                <div>
                  Timer name
                </div>
                <div>
                  Full screen icon
                </div>
              </header>
              <section>
                <div class="base-timer">
                  <svg class="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g class="base-timer__circle">
                      <circle class="base-timer__path-elapsed" cx="50" cy="50" r="45"></circle>
                      <path
                        id="base-timer-path-remaining"
                        stroke-dasharray="283"
                        class="base-timer__path-remaining"
                        style="color:var(--color)"
                        d="
                          M 50, 50
                          m -45, 0
                          a 45,45 0 1,0 90,0
                          a 45,45 0 1,0 -90,0
                        "
                      />
                    </g>
                  </svg>
                  <span id="base-timer-label" class="base-timer__label">
                    00:20
                  </span>
                </div>
              </section>
              <footer>
                <button>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path hidden fill="currentColor" d="M17.22 8.687a1.498 1.498 0 0 1 0 2.626l-9.997 5.499A1.5 1.5 0 0 1 5 15.499V4.501a1.5 1.5 0 0 1 2.223-1.313zm-.482 1.75a.5.5 0 0 0 0-.875L6.741 4.063A.5.5 0 0 0 6 4.501v10.998a.5.5 0 0 0 .741.438z" />
                  </svg>
                </button>
                <button>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path fill="currentColor" d="M5.854 2.646a.5.5 0 0 1 0 .708L4.207 5H11a6 6 0 1 1-6 6a.5.5 0 0 1 1 0a5 5 0 1 0 5-5H4.207l1.647 1.646a.5.5 0 1 1-.708.708l-2.5-2.5a.5.5 0 0 1 0-.708l2.5-2.5a.5.5 0 0 1 .708 0" />
                  </svg>
                </button>
              </footer>
            </article>
        `;
    };

    initComponent(){
        const FULL_DASH_ARRAY = 283;
        const TIME_LIMIT = 20;
        let timePassed = 0;
        let timeLeft = TIME_LIMIT;
        let timerInterval = null;

        const labelEl = this.shadowDOM.getElementById("base-timer-label");
        const pathEl  = this.shadowDOM.getElementById("base-timer-path-remaining");

        startTimer();

        function onTimesUp() {
            clearInterval(timerInterval);
        }

        function startTimer() {
            timerInterval = setInterval(() => {
                timePassed = timePassed += 1;
                timeLeft = TIME_LIMIT - timePassed;
                labelEl.innerHTML = formatTime(timeLeft);

                setCircleDasharray();

                if (timeLeft === 0) {
                    onTimesUp();
                }
            }, 1000);
        }

        function formatTime(time) {
            const minutes = Math.floor(time / 60);
            let seconds = time % 60;

            if (seconds < 10) {
                seconds = `0${seconds}`;
            }

            return `${minutes}:${seconds}`;
        }

        function calculateTimeFraction() {
            const rawTimeFraction = timeLeft / TIME_LIMIT;
            return rawTimeFraction - (1 / TIME_LIMIT) * (1 - rawTimeFraction);
        }

        function setCircleDasharray() {
            const circleDasharray = `${(
                calculateTimeFraction() * FULL_DASH_ARRAY
            ).toFixed(0)} 283`;
            pathEl.setAttribute("stroke-dasharray", circleDasharray);
        }
    }

    disconnectedCallback() {    // Se invoca cada vez que el Web-Component se desconecta del DOM
        this.remove()
    };

}customElements.define("timer-component", TimerComponent);