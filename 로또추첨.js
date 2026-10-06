function generateLottoDigits() {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
}

function formatLottoDigits(digits) {
  return digits.join(" ");
}

if (typeof document !== "undefined") {
  const DIGIT_COUNT = 6;
  const FLIP_MS = 100;
  const MIN_FLIPS = 8;
  const EXTRA_FLIPS_PER_COLUMN = 2;
  const COLUMN_STAGGER_MS = 90;
  const MORPH_MS = 520;
  const STORAGE_KEY = "pension-lotto-theme-v1";

  const DEFAULTS = {
    mode: "dark",
    dark: {
      grad1: "#0b1220",
      grad2: "#1e3a8a",
      grad3: "#6d28d9",
      accent: "#ffd166",
      flapStyle: "dark",
    },
    light: {
      grad1: "#e0e7ff",
      grad2: "#fbcfe8",
      grad3: "#bfdbfe",
      accent: "#f59e0b",
      flapStyle: "light",
    },
  };

  const board = document.getElementById("board");
  const result = document.getElementById("result");
  const status = document.getElementById("status");
  const drawButton = document.getElementById("drawButton");
  const toolbar = document.getElementById("themeToolbar");
  const lightMode = document.getElementById("lightMode");
  const darkMode = document.getElementById("darkMode");
  const grad1 = document.getElementById("grad1");
  const grad2 = document.getElementById("grad2");
  const grad3 = document.getElementById("grad3");
  const accent = document.getElementById("accent");
  const flapStyle = document.getElementById("flapStyle");
  const resetTheme = document.getElementById("resetTheme");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const settings = loadSettings();
  const cells = Array.from({ length: DIGIT_COUNT }, (_, index) => createCell(index));
  cells.forEach((cell) => board.appendChild(cell.root));
  applyTheme();

  function loadSettings() {
    function validatedTheme(mode, saved) {
      const theme = { ...DEFAULTS[mode] };
      for (const key of ["grad1", "grad2", "grad3", "accent"]) {
        if (/^#[0-9a-f]{6}$/i.test(saved?.[key])) theme[key] = saved[key];
      }
      if (["light", "dark"].includes(saved?.flapStyle)) theme.flapStyle = saved.flapStyle;
      return theme;
    }
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        mode: saved?.mode === "light" ? "light" : DEFAULTS.mode,
        dark: validatedTheme("dark", saved?.dark),
        light: validatedTheme("light", saved?.light),
      };
    } catch (error) {
      return structuredClone(DEFAULTS);
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Themes still work for this visit when browser storage is unavailable.
    }
  }

  function currentTheme() {
    return settings[settings.mode];
  }

  function accentText(hex) {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "#111827" : "#f8fafc";
  }

  function applyTheme() {
    const theme = currentTheme();
    const root = document.documentElement;
    const spinning = theme.flapStyle === "light";

    root.dataset.theme = settings.mode;
    root.style.setProperty("--grad-1", theme.grad1);
    root.style.setProperty("--grad-2", theme.grad2);
    root.style.setProperty("--grad-3", theme.grad3);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-text", accentText(theme.accent));
    root.style.setProperty("--flap-bg", spinning ? "#f8fafc" : "#111827");
    root.style.setProperty("--flap-fg", spinning ? "#111827" : "#f8fafc");
    root.style.setProperty("--hinge", spinning ? "rgba(0, 0, 0, 0.38)" : "rgba(255, 255, 255, 0.28)");

    lightMode.setAttribute("aria-pressed", String(settings.mode === "light"));
    darkMode.setAttribute("aria-pressed", String(settings.mode === "dark"));
    grad1.value = theme.grad1;
    grad2.value = theme.grad2;
    grad3.value = theme.grad3;
    accent.value = theme.accent;
    flapStyle.value = theme.flapStyle;
  }

  function createCell(index) {
    const root = document.createElement("div");
    root.className = "cell";
    root.innerHTML = `
      <div class="half top">
        <div class="face current" data-digit="0">0</div>
        <div class="face next" data-digit="0">0</div>
      </div>
      <div class="half bottom">
        <div class="face current" data-digit="0">0</div>
        <div class="face next" data-digit="0">0</div>
      </div>
    `;
    return {
      index,
      root,
      value: 0,
      topCurrent: root.querySelector(".top .current"),
      topNext: root.querySelector(".top .next"),
      bottomCurrent: root.querySelector(".bottom .current"),
      bottomNext: root.querySelector(".bottom .next"),
    };
  }

  function setFace(el, digit) {
    el.textContent = String(digit);
    el.dataset.digit = String(digit);
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function paintCell(cell, digit) {
    setFace(cell.topCurrent, digit);
    setFace(cell.topNext, digit);
    setFace(cell.bottomCurrent, digit);
    setFace(cell.bottomNext, digit);
    cell.value = digit;
  }

  async function flipOnce(cell, nextDigit) {
    setFace(cell.topNext, nextDigit);
    setFace(cell.bottomNext, nextDigit);
    cell.root.classList.add("flipping");
    await wait(FLIP_MS * 2);
    setFace(cell.topCurrent, nextDigit);
    setFace(cell.bottomCurrent, nextDigit);
    cell.root.classList.remove("flipping");
    void cell.root.offsetWidth;
    cell.value = nextDigit;
  }

  async function spinCell(cell, target, minFlips) {
    if (reduceMotion) {
      paintCell(cell, target);
      return;
    }

    let flips = 0;
    while (flips < minFlips || cell.value !== target) {
      await flipOnce(cell, (cell.value + 1) % 10);
      flips += 1;
    }
  }

  function lockTheme(locked) {
    toolbar.classList.toggle("locked", locked);
    toolbar.querySelectorAll("button, input, select").forEach((control) => {
      control.disabled = locked;
    });
  }

  function setIdle() {
    document.body.classList.remove("drawing", "complete", "glow");
    lockTheme(false);
    status.textContent = "추첨 버튼을 눌러 주세요.";
    result.textContent = "";
    drawButton.textContent = "추첨하기";
    drawButton.disabled = false;
  }

  async function draw() {
    const digits = generateLottoDigits();
    document.body.classList.remove("complete");
    document.body.classList.add("glow", "drawing");
    lockTheme(true);
    status.textContent = "추첨 중입니다...";
    result.textContent = "";
    drawButton.disabled = true;

    if (!reduceMotion) {
      await wait(MORPH_MS);
    }

    await Promise.all(
      cells.map((cell, index) =>
        wait(reduceMotion ? 0 : index * COLUMN_STAGGER_MS).then(() =>
          spinCell(cell, digits[index], MIN_FLIPS + index * EXTRA_FLIPS_PER_COLUMN)
        )
      )
    );

    document.body.classList.remove("drawing");
    document.body.classList.add("complete");
    if (!reduceMotion) {
      await wait(MORPH_MS);
    }

    status.textContent = "추첨이 완료되었습니다.";
    result.textContent = `추첨 번호: ${formatLottoDigits(digits)}`;
    drawButton.textContent = "다시 추첨";
    drawButton.disabled = false;
    lockTheme(false);
  }

  drawButton.addEventListener("click", () => {
    if (drawButton.disabled) {
      return;
    }
    draw();
  });

  lightMode.addEventListener("click", () => {
    settings.mode = "light";
    saveSettings();
    applyTheme();
  });

  darkMode.addEventListener("click", () => {
    settings.mode = "dark";
    saveSettings();
    applyTheme();
  });

  function updateCurrentTheme(partial) {
    Object.assign(currentTheme(), partial);
    saveSettings();
    applyTheme();
  }

  grad1.addEventListener("input", () => updateCurrentTheme({ grad1: grad1.value }));
  grad2.addEventListener("input", () => updateCurrentTheme({ grad2: grad2.value }));
  grad3.addEventListener("input", () => updateCurrentTheme({ grad3: grad3.value }));
  accent.addEventListener("input", () => updateCurrentTheme({ accent: accent.value }));
  flapStyle.addEventListener("change", () => updateCurrentTheme({ flapStyle: flapStyle.value }));
  resetTheme.addEventListener("click", () => {
    settings[settings.mode] = { ...DEFAULTS[settings.mode] };
    saveSettings();
    applyTheme();
  });

  setIdle();
} else {
  const digits = generateLottoDigits();
  console.log(`로또 번호: ${formatLottoDigits(digits)}`);
}
