const SUITS = [
  { code: "S", name: "SPADES", symbol: "♠", color: "black", label: "picas" },
  { code: "H", name: "HEARTS", symbol: "♥", color: "red", label: "corazones" },
  { code: "D", name: "DIAMONDS", symbol: "♦", color: "red", label: "diamantes" },
  { code: "C", name: "CLUBS", symbol: "♣", color: "black", label: "tréboles" }
];

const RANKS = [
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
  { value: "9", label: "9" },
  { value: "10", label: "10" },
  { value: "JACK", label: "J" },
  { value: "QUEEN", label: "Q" },
  { value: "KING", label: "K" },
  { value: "ACE", label: "A" }
];

const HAND_EXAMPLES = [
  { name: "Escalera Real", cards: [["10", "H"], ["JACK", "H"], ["QUEEN", "H"], ["KING", "H"], ["ACE", "H"]], text: "A, K, Q, J, 10 del mismo palo" },
  { name: "Escalera de Color", cards: [["2", "S"], ["3", "S"], ["4", "S"], ["5", "S"], ["6", "S"]], text: "Cinco consecutivas del mismo palo" },
  { name: "Póker", cards: [["9", "C"], ["9", "D"], ["9", "H"], ["9", "S"], ["KING", "D"]], text: "Cuatro cartas del mismo valor" },
  { name: "Full House", cards: [["7", "C"], ["7", "D"], ["7", "S"], ["JACK", "C"], ["JACK", "D"]], text: "Un trío y un par" },
  { name: "Color", cards: [["2", "D"], ["5", "D"], ["8", "D"], ["JACK", "D"], ["ACE", "D"]], text: "Cinco cartas del mismo palo" },
  { name: "Escalera", cards: [["4", "C"], ["5", "H"], ["6", "D"], ["7", "S"], ["8", "C"]], text: "Cinco consecutivas de palos distintos" },
  { name: "Trío", cards: [["5", "C"], ["5", "H"], ["5", "S"], ["QUEEN", "D"], ["ACE", "S"]], text: "Tres cartas del mismo valor" },
  { name: "Doble Par", cards: [["6", "C"], ["6", "H"], ["KING", "C"], ["KING", "H"], ["2", "D"]], text: "Dos pares distintos" },
  { name: "Par", cards: [["QUEEN", "C"], ["QUEEN", "S"], ["3", "D"], ["8", "H"], ["ACE", "H"]], text: "Dos cartas del mismo valor" },
  { name: "Carta Alta", cards: [["ACE", "C"], ["QUEEN", "H"], ["8", "D"], ["5", "S"], ["3", "H"]], text: "Sin combinación; gana la más alta" }
];

const valorToNumero = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
  JACK: 11, QUEEN: 12, KING: 13, ACE: 14
};

const state = {
  deck: [],
  timer: null,
  tiempoRestante: 12,
  tiempoInicial: 12,
  modo: "entrenamiento",
  partidaEnCurso: false,
  rondaResuelta: false,
  jugadasRestantes: 10,
  totalJugadas: 10,
  manoActual: 0,
  aciertos: 0,
  errores: 0,
  racha: 0,
  mejorRachaSesion: 0,
  seleccionadas: [],
  todas: [],
  mejorMano: null,
  tema: localStorage.getItem("tema") || "dark",
  records: loadRecords()
};

function loadRecords() {
  try {
    const stored = JSON.parse(localStorage.getItem("poker-records") || "null");
    if (stored) return stored;
  } catch (_error) {
    /* ignore */
  }
  return {
    score: parseInt(localStorage.getItem("mejorPuntuacion") || "0", 10) || 0,
    streak: 0,
    accuracy: 0
  };
}

function saveRecords() {
  localStorage.setItem("poker-records", JSON.stringify(state.records));
  localStorage.setItem("mejorPuntuacion", String(state.records.score));
}

function $(id) {
  return document.getElementById(id);
}

function cardValue(carta) {
  return valorToNumero[carta.value.toUpperCase()];
}

function rankLabel(value) {
  return RANKS.find((rank) => rank.value === value)?.label || value;
}

function createCard(value, suitCode) {
  const suit = SUITS.find((item) => item.code === suitCode || item.name === suitCode);
  return {
    value,
    suit: suit.name,
    color: suit.color,
    symbol: suit.symbol,
    label: suit.label,
    display: rankLabel(value)
  };
}

function buildDeck() {
  const deck = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => {
      deck.push(createCard(rank.value, suit.code));
    });
  });
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function drawCards(count) {
  if (state.deck.length < count) state.deck = buildDeck();
  return state.deck.splice(0, count);
}

function countFrequency(arr) {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function combinations(arr, k) {
  const result = [];
  function rec(start, path) {
    if (path.length === k) {
      result.push(path.slice());
      return;
    }
    for (let i = start; i < arr.length; i += 1) {
      path.push(arr[i]);
      rec(i + 1, path);
      path.pop();
    }
  }
  rec(0, []);
  return result;
}

function evaluateFive(cartas) {
  const values = cartas.map(cardValue).sort((a, b) => b - a);
  const suits = cartas.map((carta) => carta.suit);
  const freq = countFrequency(values);
  const isFlush = suits.every((suit) => suit === suits[0]);
  const unique = [...new Set(values)].sort((a, b) => a - b);

  let isStraight = false;
  let straightHigh = 0;
  if (unique.length === 5 && unique[4] - unique[0] === 4) {
    isStraight = true;
    straightHigh = unique[4];
  } else if (unique.includes(14) && [2, 3, 4, 5].every((n) => unique.includes(n))) {
    isStraight = true;
    straightHigh = 5;
  }

  const counts = Object.entries(freq).sort((a, b) => b[1] - a[1] || Number(b[0]) - Number(a[0]));

  if (isFlush && isStraight && straightHigh === 14) {
    return { rank: 9, name: "Escalera Real", tiebreakers: [14], cards: cartas };
  }
  if (isFlush && isStraight) {
    return { rank: 8, name: "Escalera de Color", tiebreakers: [straightHigh], cards: cartas };
  }
  if (counts[0][1] === 4) {
    return { rank: 7, name: "Póker", tiebreakers: [Number(counts[0][0]), Number(counts[1][0])], cards: cartas };
  }
  if (counts[0][1] === 3 && counts[1] && counts[1][1] === 2) {
    return { rank: 6, name: "Full House", tiebreakers: [Number(counts[0][0]), Number(counts[1][0])], cards: cartas };
  }
  if (isFlush) {
    return { rank: 5, name: "Color", tiebreakers: values, cards: cartas };
  }
  if (isStraight) {
    return { rank: 4, name: "Escalera", tiebreakers: [straightHigh], cards: cartas };
  }
  if (counts[0][1] === 3) {
    return {
      rank: 3,
      name: "Trío",
      tiebreakers: [Number(counts[0][0]), ...counts.slice(1).map((item) => Number(item[0]))],
      cards: cartas
    };
  }
  if (counts[0][1] === 2 && counts[1] && counts[1][1] === 2) {
    const pairs = [Number(counts[0][0]), Number(counts[1][0])].sort((a, b) => b - a);
    return { rank: 2, name: "Doble Par", tiebreakers: [...pairs, Number(counts[2][0])], cards: cartas };
  }
  if (counts[0][1] === 2) {
    return {
      rank: 1,
      name: "Par",
      tiebreakers: [Number(counts[0][0]), ...counts.slice(1).map((item) => Number(item[0])).sort((a, b) => b - a)],
      cards: cartas
    };
  }
  return { rank: 0, name: "Carta Alta", tiebreakers: values, cards: cartas };
}

function compareHands(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  const length = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < length; i += 1) {
    const left = a.tiebreakers[i] || 0;
    const right = b.tiebreakers[i] || 0;
    if (left !== right) return left - right;
  }
  return 0;
}

function obtenerMejorMano(cartas) {
  return combinations(cartas, 5).reduce((best, combo) => {
    const evaluated = evaluateFive(combo);
    if (!best || compareHands(evaluated, best) > 0) return evaluated;
    return best;
  }, null);
}

function sameCard(a, b) {
  return a.value === b.value && a.suit === b.suit;
}

function describeCards(cartas) {
  return cartas.map((carta) => `${carta.display}${carta.symbol}`).join("  ");
}

function renderMiniCard(value, suitCode) {
  const card = createCard(value, suitCode);
  return `<span class="mini-card ${card.color}"><b>${card.display}</b><i>${card.symbol}</i></span>`;
}

function renderHelpExamples() {
  $("mano-ejemplos").innerHTML = HAND_EXAMPLES.map((example, index) => `
    <article class="ejemplo-mano">
      <h4>${index + 1}. ${example.name}</h4>
      <div class="ejemplo-cartas">
        ${example.cards.map(([value, suit]) => renderMiniCard(value, suit)).join("")}
      </div>
      <p>${example.text}</p>
    </article>
  `).join("");
}

function renderPlaceholders() {
  $("flop").innerHTML = Array.from({ length: 5 }, () => '<div class="card-back" aria-hidden="true"></div>').join("");
  $("ocultas").innerHTML = Array.from({ length: 2 }, () => '<div class="card-back" aria-hidden="true"></div>').join("");
}

function createCardButton(carta, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `playing-card ${carta.color}`;
  button.dataset.index = String(index);
  button.style.setProperty("--deal-delay", `${index * 60}ms`);
  button.setAttribute("aria-label", `${carta.display} de ${carta.label}`);
  button.innerHTML = `
    <span class="card-corner top"><span>${carta.display}</span><span>${carta.symbol}</span></span>
    <span class="card-center">${carta.symbol}</span>
    <span class="card-corner bottom"><span>${carta.display}</span><span>${carta.symbol}</span></span>
  `;
  button.addEventListener("click", () => seleccionarCarta(carta, button));
  return button;
}

function mostrarCartas(cartas, contenedorId, offset) {
  const contenedor = $(contenedorId);
  contenedor.innerHTML = "";
  cartas.forEach((carta, index) => {
    contenedor.appendChild(createCardButton(carta, offset + index));
  });
}

function updateSelectionMeta() {
  $("seleccion-count").textContent = `${state.seleccionadas.length} / 5`;
  if (state.seleccionadas.length === 0) {
    $("mano-preview").textContent = "Tu selección aparecerá aquí";
    return;
  }
  if (state.seleccionadas.length < 5) {
    $("mano-preview").textContent = `Elige ${5 - state.seleccionadas.length} carta(s) más`;
    return;
  }
  $("mano-preview").textContent = `Tu mano: ${evaluateFive(state.seleccionadas).name}`;
}

function setConfigEnabled(enabled) {
  document.querySelectorAll(".modo-btn, .nivel-btn, .jugadas-btn").forEach((button) => {
    button.disabled = !enabled;
    button.classList.toggle("is-locked", !enabled);
  });
  $("timer-wrap").hidden = state.modo === "estudio";
}

function syncModeButtons() {
  $("btn-iniciar").hidden = state.partidaEnCurso;
  $("btn-confirmar").hidden = !(state.partidaEnCurso && state.modo === "estudio" && !state.rondaResuelta);
  $("btn-revelar").hidden = !(state.partidaEnCurso && state.modo === "estudio" && !state.rondaResuelta);
  $("btn-siguiente").hidden = !(state.partidaEnCurso && state.rondaResuelta && state.jugadasRestantes > 0);
  $("btn-iniciar").textContent = "Iniciar";
}

function actualizarMarcador() {
  $("aciertos").textContent = String(state.aciertos);
  $("errores").textContent = String(state.errores);
  $("racha").textContent = String(state.racha);
  $("mano-actual").textContent = String(state.manoActual);
  $("jugadas-num").textContent = String(state.totalJugadas);
}

function renderRecords() {
  $("mejor-score").textContent = String(state.records.score);
  $("mejor-racha").textContent = String(state.records.streak);
  $("mejor-precision").textContent = `${state.records.accuracy}%`;
}

function mostrarMensaje(texto, type = "") {
  const el = $("mensaje");
  el.textContent = texto;
  el.className = type ? `is-${type}` : "";
}

function clearTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  $("tiempo").textContent = `${state.tiempoInicial}s`;
  $("tiempo").classList.remove("is-urgent");
  $("timer-fill").style.transform = "scaleX(1)";
}

function iniciarCronometro() {
  clearTimer();
  if (state.modo === "estudio") return;
  state.tiempoRestante = state.tiempoInicial;
  $("tiempo").textContent = `${state.tiempoRestante}s`;
  $("timer-fill").style.transform = "scaleX(1)";

  state.timer = setInterval(() => {
    state.tiempoRestante -= 1;
    const ratio = Math.max(state.tiempoRestante / state.tiempoInicial, 0);
    $("tiempo").textContent = `${state.tiempoRestante}s`;
    $("timer-fill").style.transform = `scaleX(${ratio})`;
    $("tiempo").classList.toggle("is-urgent", state.tiempoRestante <= 3);
    if (state.tiempoRestante <= 0) {
      resolverRonda("timeout");
    }
  }, 1000);
}

function isOptimalCard(carta) {
  return state.mejorMano.cards.some((optima) => sameCard(optima, carta));
}

function revelarCartas(seleccionCorrecta) {
  document.querySelectorAll(".playing-card").forEach((button) => {
    const carta = state.todas[Number(button.dataset.index)];
    const optima = isOptimalCard(carta);
    const elegida = state.seleccionadas.some((item) => sameCard(item, carta));
    button.classList.toggle("is-optimal", optima);
    button.classList.toggle("is-miss", elegida && !optima);
    button.classList.toggle("is-correct", seleccionCorrecta && elegida);
    button.disabled = true;
  });
}

function afterRound() {
  syncModeButtons();
  if (state.jugadasRestantes <= 0) {
    setTimeout(mostrarResultadoFinal, 700);
    return;
  }
  if (state.modo === "entrenamiento") {
    setTimeout(repartirCartas, 2800);
  }
}

function resolverRonda(reason) {
  if (!state.partidaEnCurso || state.rondaResuelta) return;
  state.rondaResuelta = true;
  clearTimer();

  const mejor = state.mejorMano;
  const detalle = describeCards(mejor.cards);

  if (reason === "reveal") {
    mostrarMensaje(`Respuesta: ${mejor.name} · ${detalle}`, "info");
    revelarCartas(false);
    state.jugadasRestantes -= 1;
    afterRound();
    return;
  }

  if (reason === "timeout" || state.seleccionadas.length < 5) {
    state.errores += 1;
    state.racha = 0;
    mostrarMensaje(`Tiempo agotado. La mejor mano era ${mejor.name} · ${detalle}`, "bad");
    revelarCartas(false);
    actualizarMarcador();
    state.jugadasRestantes -= 1;
    afterRound();
    return;
  }

  const seleccion = evaluateFive(state.seleccionadas);
  const correcta = compareHands(seleccion, mejor) === 0;

  if (correcta) {
    state.aciertos += 1;
    state.racha += 1;
    state.mejorRachaSesion = Math.max(state.mejorRachaSesion, state.racha);
    mostrarMensaje(`Correcto: ${seleccion.name}`, "good");
  } else {
    state.errores += 1;
    state.racha = 0;
    mostrarMensaje(`Tu mano: ${seleccion.name}. La mejor era ${mejor.name} · ${detalle}`, "bad");
  }

  revelarCartas(correcta);
  actualizarMarcador();
  state.jugadasRestantes -= 1;
  afterRound();
}

function confirmarEstudio() {
  if (state.seleccionadas.length < 5) {
    mostrarMensaje("Elige 5 cartas para confirmar", "info");
    return;
  }
  resolverRonda("submit");
}

function seleccionarCarta(carta, button) {
  if (!state.partidaEnCurso || state.rondaResuelta) return;

  if (button.classList.contains("seleccionada")) {
    button.classList.remove("seleccionada");
    state.seleccionadas = state.seleccionadas.filter((item) => !sameCard(item, carta));
  } else if (state.seleccionadas.length < 5) {
    button.classList.add("seleccionada");
    state.seleccionadas.push(carta);
  }

  updateSelectionMeta();

  if (state.seleccionadas.length === 5 && state.modo === "entrenamiento") {
    resolverRonda("submit");
  }
}

function repartirCartas() {
  if (!state.partidaEnCurso) return;
  state.rondaResuelta = false;
  state.seleccionadas = [];
  state.manoActual += 1;
  const dealt = drawCards(7);
  const comunitarias = dealt.slice(0, 5);
  const hole = dealt.slice(5, 7);
  state.todas = [...comunitarias, ...hole];
  state.mejorMano = obtenerMejorMano(state.todas);
  mostrarCartas(comunitarias, "flop", 0);
  mostrarCartas(hole, "ocultas", 5);
  updateSelectionMeta();
  mostrarMensaje("");
  actualizarMarcador();
  syncModeButtons();
  iniciarCronometro();
}

function iniciarPartida() {
  if (state.partidaEnCurso) return;
  state.partidaEnCurso = true;
  state.deck = buildDeck();
  state.aciertos = 0;
  state.errores = 0;
  state.racha = 0;
  state.mejorRachaSesion = 0;
  state.manoActual = 0;
  state.jugadasRestantes = state.totalJugadas;
  $("pregunta").textContent = state.modo === "estudio"
    ? "Arma la mejor mano y confirma cuando esté lista"
    : "Selecciona las 5 cartas de la mejor mano";
  setConfigEnabled(false);
  actualizarMarcador();
  mostrarMensaje("");
  $("modal-resultado").classList.remove("modal-open");
  repartirCartas();
}

function reiniciarPartida() {
  clearTimer();
  state.partidaEnCurso = false;
  state.rondaResuelta = false;
  state.seleccionadas = [];
  state.todas = [];
  state.manoActual = 0;
  state.aciertos = 0;
  state.errores = 0;
  state.racha = 0;
  state.jugadasRestantes = state.totalJugadas;
  setConfigEnabled(true);
  renderPlaceholders();
  updateSelectionMeta();
  actualizarMarcador();
  mostrarMensaje("");
  syncModeButtons();
}

function precisionActual() {
  const total = state.aciertos + state.errores;
  if (!total) return 0;
  return Math.round((state.aciertos / total) * 100);
}

function mostrarResultadoFinal() {
  state.partidaEnCurso = false;
  clearTimer();
  setConfigEnabled(true);
  syncModeButtons();

  const precision = precisionActual();
  const nuevoRecord = state.aciertos > state.records.score;
  if (nuevoRecord) state.records.score = state.aciertos;
  if (state.mejorRachaSesion > state.records.streak) state.records.streak = state.mejorRachaSesion;
  if (precision > state.records.accuracy) state.records.accuracy = precision;
  saveRecords();
  renderRecords();

  $("resultado-subtitulo").textContent = nuevoRecord
    ? "Nuevo récord de aciertos en una sesión."
    : "Revisa el resumen y vuelve a intentar cuando quieras.";
  $("res-aciertos").textContent = String(state.aciertos);
  $("res-errores").textContent = String(state.errores);
  $("res-precision").textContent = `${precision}%`;
  $("res-racha").textContent = String(state.mejorRachaSesion);
  $("modal-resultado").classList.add("modal-open");
}

function applyTheme() {
  if (state.tema === "light") {
    document.body.setAttribute("data-theme", "light");
    $("theme-toggle").textContent = "☀";
  } else {
    document.body.removeAttribute("data-theme");
    $("theme-toggle").textContent = "☾";
  }
}

function toggleTheme() {
  state.tema = state.tema === "dark" ? "light" : "dark";
  localStorage.setItem("tema", state.tema);
  applyTheme();
}

function cerrarModales() {
  document.querySelectorAll(".modal").forEach((modal) => modal.classList.remove("modal-open"));
}

function bindUi() {
  $("theme-toggle").addEventListener("click", toggleTheme);
  $("btn-ayuda").addEventListener("click", () => $("modal-ayuda").classList.add("modal-open"));
  $("link-acerca").addEventListener("click", (event) => {
    event.preventDefault();
    $("modal-acerca").classList.add("modal-open");
  });
  $("btn-iniciar").addEventListener("click", iniciarPartida);
  $("btn-reiniciar").addEventListener("click", reiniciarPartida);
  $("btn-confirmar").addEventListener("click", confirmarEstudio);
  $("btn-revelar").addEventListener("click", () => resolverRonda("reveal"));
  $("btn-siguiente").addEventListener("click", repartirCartas);
  $("btn-jugar-otra").addEventListener("click", () => {
    cerrarModales();
    iniciarPartida();
  });

  document.querySelectorAll(".modal-close").forEach((button) => {
    button.addEventListener("click", cerrarModales);
  });
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) cerrarModales();
    });
  });

  document.querySelectorAll(".modo-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.partidaEnCurso) return;
      document.querySelectorAll(".modo-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.modo = button.dataset.modo;
      setConfigEnabled(true);
    });
  });

  document.querySelectorAll(".nivel-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.partidaEnCurso) return;
      document.querySelectorAll(".nivel-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.tiempoInicial = parseInt(button.dataset.tiempo, 10);
      $("tiempo").textContent = `${state.tiempoInicial}s`;
    });
  });

  document.querySelectorAll(".jugadas-btn").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.partidaEnCurso) return;
      document.querySelectorAll(".jugadas-btn").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.totalJugadas = parseInt(button.dataset.jugadas, 10);
      state.jugadasRestantes = state.totalJugadas;
      actualizarMarcador();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cerrarModales();
      return;
    }
    if (event.key === " " && !state.partidaEnCurso && event.target === document.body) {
      event.preventDefault();
      iniciarPartida();
      return;
    }
    if (event.key === "Enter" && state.partidaEnCurso && state.modo === "estudio" && !state.rondaResuelta) {
      confirmarEstudio();
      return;
    }
    if (event.key === "Enter" && state.partidaEnCurso && state.rondaResuelta && state.modo === "estudio") {
      repartirCartas();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  renderHelpExamples();
  renderPlaceholders();
  renderRecords();
  actualizarMarcador();
  updateSelectionMeta();
  setConfigEnabled(true);
  syncModeButtons();
  bindUi();
});
