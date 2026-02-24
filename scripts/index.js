import './themes/prefers-color-scheme.js';
import './components/timer.component.js';

document.addEventListener("DOMContentLoaded", () => {
    const popoverEl = document.querySelector("[data-timer-popover]");
    if (!popoverEl) return;

    const timerContentEl = document.querySelector(".app-timer-content");
    if (!timerContentEl) return;

    // Inputs (por orden: hora, minuto, segundo)
    const inputs = Array.from(popoverEl.querySelectorAll('input[type="number"]'));
    const [hoursInput, minutesInput, secondsInput] = inputs;

    // Asegurar que los inputs tengan defaults razonables
    for (const input of inputs) {
        if (!input) continue;
        input.min = "0";
        input.step = "1";
        input.inputMode = "numeric";
        input.placeholder ||= "0";
        // Evita negativos desde teclado (algunos navegadores lo permiten)
        input.addEventListener("input", () => {
            const v = Number(input.value);
            if (!Number.isFinite(v) || v < 0) input.value = "0";
        });
    }

    // ---- Crear botones dentro del popover (Agregar / Cancelar) ----
    const formEl = popoverEl.querySelector("form");
    if (!formEl) return;

    // Evitar duplicar si el script se carga 2 veces
    if (!popoverEl.querySelector("[data-timer-actions]")) {
        const actions = document.createElement("div");
        actions.setAttribute("data-timer-actions", "");
        actions.style.display = "flex";
        actions.style.gap = "1rem";
        actions.style.justifyContent = "flex-end";
        actions.style.marginTop = "1rem";

        const btnAdd = document.createElement("button");
        btnAdd.type = "button";
        btnAdd.textContent = "Agregar";
        btnAdd.setAttribute("data-add-timer", "");

        const btnCancel = document.createElement("button");
        btnCancel.type = "button";
        btnCancel.textContent = "Cancelar";
        btnCancel.setAttribute("data-cancel-timer", "");

        actions.append(btnCancel, btnAdd);
        formEl.append(actions);
    }

    const btnAdd = popoverEl.querySelector("[data-add-timer]");
    const btnCancel = popoverEl.querySelector("[data-cancel-timer]");
    const btnExit = popoverEl.querySelector('[command="hide-popover"]'); // tu botón "Salir"

    // ---- Helpers ----
    const clampInt = (n) => {
        const v = Number(n);
        if (!Number.isFinite(v) || v < 0) return 0;
        return Math.floor(v);
    };

    const getTotalSeconds = () => {
        const h = clampInt(hoursInput?.value ?? 0);
        const m = clampInt(minutesInput?.value ?? 0);
        const s = clampInt(secondsInput?.value ?? 0);

        // Normaliza (por si ponen 90 segundos o 120 minutos, etc.)
        const total = h * 3600 + m * 60 + s;
        return total;
    };

    const clearInputs = () => {
        if (hoursInput) hoursInput.value = "";
        if (minutesInput) minutesInput.value = "";
        if (secondsInput) secondsInput.value = "";
    };

    const closePopover = () => {
        // Cierra usando tu propio botón (mantiene tu approach con command/hide-popover)
        if (btnExit) btnExit.click();
        else popoverEl.hidePopover?.();
    };

    const focusFirstInput = () => {
        // cuando abra el popover, foco al primer input
        hoursInput?.focus?.();
    };

    // Cuando se abra el popover (si el browser dispara toggle)
    popoverEl.addEventListener("toggle", (ev) => {
        // toggle event: newState = "open" | "closed"
        if (ev.newState === "open") {
            // microtask para que el popover ya esté visible
            queueMicrotask(focusFirstInput);
        }
    });

    // Enter en inputs => Agregar
    formEl.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
            ev.preventDefault();
            btnAdd?.click();
        }
        if (ev.key === "Escape") {
            ev.preventDefault();
            btnCancel?.click();
        }
    });

    // ---- Acciones ----
    btnAdd?.addEventListener("click", () => {
        const totalSeconds = getTotalSeconds();

        // No creamos timers con 0 segundos
        if (totalSeconds <= 0) {
            // feedback mínimo: marca inputs en rojo o usa alert; por ahora simple
            // eslint-disable-next-line no-alert
            alert("Ingresa un tiempo válido (mayor a 0).");
            return;
        }

        const timerEl = document.createElement("timer-component");
        timerEl.setAttribute("time", String(totalSeconds));
        timerEl.setAttribute("label", `Timer ${timerContentEl.children.length + 1}`);

        timerContentEl.append(timerEl);

        clearInputs();
        closePopover();
    });

    btnCancel?.addEventListener("click", () => {
        clearInputs();
        closePopover();
    });
});