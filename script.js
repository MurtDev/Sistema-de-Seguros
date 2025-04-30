// Posibles jugadas (no se usa directamente en la lógica, pero se deja para referencia)
const jugadas = [
  { name: "Escalera Real", valid: true },
  { name: "Escalera de Color", valid: true },
  { name: "Póker", valid: true },
  { name: "Full House", valid: true },
  { name: "Color", valid: true },
  { name: "Escalera", valid: true },
  { name: "Trío", valid: true },
  { name: "Doble Par", valid: true },
  { name: "Par", valid: true },
  { name: "Carta Alta", valid: true }
];

// Variables de estado globales
let deckId = null;
let timerInterval = null;
let tiempoRestante = 10;
let tiempoInicial = 10; // Tiempo por defecto (nivel fácil)
let partidaEnCurso = false;
let jugadaCorrectaName = "";
let jugadasRestantes = 10; // Total de jugadas por defecto
let totalJugadas = 10; // Variable para almacenar el total de jugadas
let aciertos = 0;
let errores = 0;
let cartasSeleccionadas = []; // Cartas que el jugador ha seleccionado
let todasLasCartas = [];      // Todas las cartas de la mano actual
let mejorPuntuacion = localStorage.getItem('mejorPuntuacion') ? parseInt(localStorage.getItem('mejorPuntuacion')) : 0;
let temaActual = localStorage.getItem('tema') || 'dark';

// Mapeo de valores a números (para evaluar escaleras)
const valorToNumero = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10,
  "JACK": 11, "QUEEN": 12, "KING": 13, "ACE": 14
};

/* =======================
   INICIALIZACIÓN
   ======================= */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar tema
  if (temaActual === 'light') {
    document.body.setAttribute('data-theme', 'light');
    document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
  }

  // Mostrar mejor puntuación
  document.getElementById('mejor-score').textContent = mejorPuntuacion;

  // Event listeners para nuevas funciones
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('btn-ayuda').addEventListener('click', mostrarAyuda);
  
  // Event listeners para modales
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', cerrarModales);
  });
  document.getElementById('link-acerca').addEventListener('click', mostrarAcercaDe);
  
  // Selector de dificultad
  const niveles = document.querySelectorAll('.nivel-btn');
  niveles.forEach(nivel => {
    nivel.addEventListener('click', cambiarDificultad);
  });

  // Selector de número de jugadas
  const jugadasBtns = document.querySelectorAll('.jugadas-btn');
  jugadasBtns.forEach(btn => {
    btn.addEventListener('click', cambiarTotalJugadas);
  });

  // Teclas para accesibilidad
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarModales();
    if (e.key === 'Enter' && partidaEnCurso && document.activeElement.classList.contains('carta')) {
      const carta = todasLasCartas[parseInt(document.activeElement.dataset.index)];
      seleccionarCarta(carta, document.activeElement);
    }
  });

  // Links del footer
  document.getElementById('link-contacto').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Contacto: ejemplo@poker-trainer.com');
  });

  document.getElementById('link-privacidad').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Este simulador no recolecta datos personales. Solo se guardan localmente tus mejores puntuaciones.');
  });
});

/* =======================
   NUEVAS FUNCIONALIDADES
   ======================= */

// Cambio de tema claro/oscuro
function toggleTheme() {
  if (temaActual === 'dark') {
    document.body.setAttribute('data-theme', 'light');
    document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    temaActual = 'light';
  } else {
    document.body.removeAttribute('data-theme');
    document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
    temaActual = 'dark';
  }
  localStorage.setItem('tema', temaActual);
}

// Cambiar cantidad total de jugadas
function cambiarTotalJugadas(e) {
  const botones = document.querySelectorAll('.jugadas-btn');
  botones.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  
  totalJugadas = parseInt(e.target.dataset.jugadas);
  jugadasRestantes = totalJugadas;
  document.getElementById('jugadas-num').textContent = totalJugadas;
}

// Mostrar modal de ayuda
function mostrarAyuda() {
  document.getElementById('modal-ayuda').classList.add('modal-open');
}

// Mostrar modal de acerca de
function mostrarAcercaDe(e) {
  e.preventDefault();
  document.getElementById('modal-acerca').classList.add('modal-open');
}

// Cerrar cualquier modal abierto
function cerrarModales() {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.classList.remove('modal-open');
  });
}

// Cerrar modales al presionar Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') cerrarModales();
  // ...existing code...
});

// Cerrar modal
function cerrarModal() {
  document.getElementById('modal-ayuda').classList.remove('modal-open');
}

// Cambiar nivel de dificultad
function cambiarDificultad(e) {
  const botones = document.querySelectorAll('.nivel-btn');
  botones.forEach(btn => btn.classList.remove('active'));
  e.target.classList.add('active');
  
  tiempoInicial = parseInt(e.target.dataset.tiempo);
  tiempoRestante = tiempoInicial;
  document.getElementById('tiempo').textContent = `⏱️: ${tiempoRestante}s`;
}

// Actualizar mejor puntuación
function actualizarMejorPuntuacion() {
  if (aciertos > mejorPuntuacion) {
    mejorPuntuacion = aciertos;
    localStorage.setItem('mejorPuntuacion', mejorPuntuacion);
    document.getElementById('mejor-score').textContent = mejorPuntuacion;
    return true;
  }
  return false;
}

/* =======================
   FUNCIONES HELPER
   ======================= */
// El resto de funciones permanecen iguales, sólo actualizado donde sea necesario

// Cuenta la frecuencia de aparición de elementos en un arreglo
const countFrequency = (arr) =>
  arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

// Obtiene la pinta (suit) que aparece al menos "minCount" veces en las cartas
const getDominantSuit = (cartas, minCount = 5) => {
  const suitFrequency = countFrequency(cartas.map(carta => carta.suit));
  return Object.keys(suitFrequency).find(suit => suitFrequency[suit] >= minCount);
};

// Retorna una copia de las cartas ordenadas de mayor a menor según su valor
const sortCardsDesc = (cartas) =>
  cartas.slice().sort((a, b) => valorToNumero[b.value.toUpperCase()] - valorToNumero[a.value.toUpperCase()]);

/* =======================
   FUNCIONES ASÍNCRONAS
   ======================= */

// Obtiene un nuevo mazo barajado desde la API
async function getNewDeck() {
  try {
    const response = await fetch("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1");
    const data = await response.json();
    deckId = data.deck_id;
  } catch (error) {
    console.error("Error obteniendo un nuevo mazo:", error);
    mostrarMensaje("Error de conexión. Inténtalo de nuevo.");
  }
}

// Reparte 7 cartas y actualiza la visualización
async function repartirCartas() {
  if (!deckId || jugadasRestantes === 0) {
    await getNewDeck();
  }

  try {
    let response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=7`);
    let data = await response.json();

    // Si el mazo se acaba, se solicita uno nuevo
    if (data.remaining === 0) {
      await getNewDeck();
      response = await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=7`);
      data = await response.json();
    }

    const flop = data.cards.slice(0, 5);
    const ocultas = data.cards.slice(5, 7);

    // Mostrar las cartas en pantalla
    mostrarCartas(flop, "flop");
    mostrarCartas(ocultas, "ocultas");

    // Guardar todas las cartas y evaluar la mejor jugada posible
    todasLasCartas = [...flop, ...ocultas];
    jugadaCorrectaName = evaluarMejorJugada(todasLasCartas);

    // Reiniciar la selección de cartas del jugador
    cartasSeleccionadas = [];
    document.querySelectorAll(".carta").forEach(carta => carta.classList.remove("seleccionada"));

    // Iniciar el cronómetro con el tiempo según nivel de dificultad
    iniciarCronometro(tiempoInicial);
  } catch (error) {
    console.error("Error al repartir cartas:", error);
    mostrarMensaje("Error de conexión. Inténtalo de nuevo.");
  }
}

/* =======================
   MANEJO DE LA INTERFAZ
   ======================= */

// Muestra un conjunto de cartas en el contenedor indicado
function mostrarCartas(cartas, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  contenedor.innerHTML = "";
  cartas.forEach((carta, index) => {
    const cartaElement = document.createElement("img");
    cartaElement.src = carta.image;
    cartaElement.alt = `Carta ${carta.value} de ${carta.suit}`;
    cartaElement.classList.add("carta");
    cartaElement.dataset.index = index;
    cartaElement.tabIndex = 0; // Para permitir enfoque con teclado
    cartaElement.addEventListener("click", () => seleccionarCarta(carta, cartaElement));
    cartaElement.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        seleccionarCarta(carta, cartaElement);
      }
    });
    contenedor.appendChild(cartaElement);
  });
}

// Maneja la selección y deselección de cartas por parte del jugador
function seleccionarCarta(carta, elementoCarta) {
  // Si el juego no está en curso, no hacer nada
  if (!partidaEnCurso) return;

  // Permite seleccionar hasta 5 cartas o deseleccionar alguna seleccionada
  if (cartasSeleccionadas.length < 5 || elementoCarta.classList.contains("seleccionada")) {
    elementoCarta.classList.toggle("seleccionada");
    if (elementoCarta.classList.contains("seleccionada")) {
      cartasSeleccionadas.push(carta);
      // Efecto visual de selección
      elementoCarta.style.animation = "pulse 0.3s ease";
      setTimeout(() => {
        elementoCarta.style.animation = "";
      }, 300);
    } else {
      cartasSeleccionadas = cartasSeleccionadas.filter(c => c !== carta);
    }
  }

  // Una vez seleccionadas 5 cartas, se evalúa la jugada
  if (cartasSeleccionadas.length === 5) {
    evaluarJugadaJugador();
  }
}

// Evalúa si la selección del jugador coincide con la jugada óptima
function evaluarJugadaJugador() {
  clearInterval(timerInterval);

  const cartasOptimas = obtenerCartasOptimas(jugadaCorrectaName, todasLasCartas);

  // Se verifica que cada carta seleccionada esté en la combinación óptima
  const seleccionCorrecta = cartasSeleccionadas.every(carta =>
    cartasOptimas.some(optima => carta.value === optima.value && carta.suit === optima.suit)
  );

  if (seleccionCorrecta) {
    mostrarMensaje(`✅ ¡Correcto! Seleccionaste la mejor jugada: ${jugadaCorrectaName}.`);
    aciertos++;
  } else {
    // Crear descripción detallada de las cartas óptimas
    const descripcionCartas = describir_cartas_optimas(cartasOptimas);
    mostrarMensaje(`❌ Incorrecto. La mejor jugada era: ${jugadaCorrectaName} - ${descripcionCartas}`);
    errores++;
  }

  actualizarMarcador();
  jugadasRestantes--;

  if (jugadasRestantes > 0) {
    setTimeout(repartirCartas, 2000);
  } else {
    mostrarResultadoFinal();
  }
}

// Función para describir las cartas óptimas de manera legible
function describir_cartas_optimas(cartas) {
  // Crear objeto que mapee valores numéricos a nombres de cartas
  const nombreValores = {
    "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10",
    "JACK": "J", "QUEEN": "Q", "KING": "K", "ACE": "A"
  };
  
  // Crear objeto que mapee pintas a símbolos
  const simboloPintas = {
    "SPADES": "♠", "HEARTS": "♥", "DIAMONDS": "♦", "CLUBS": "♣"
  };
  
  // Generar descripción según tipo de jugada
  let descripcion = cartas.map(carta => 
    `${nombreValores[carta.value]}${simboloPintas[carta.suit.toUpperCase()]}`
  ).join(", ");
  
  return descripcion;
}

// Muestra un mensaje en pantalla durante 2 segundos
function mostrarMensaje(texto) {
  const mensajeEl = document.getElementById("mensaje");
  mensajeEl.textContent = texto;
  mensajeEl.setAttribute("aria-live", "assertive"); // Para lectores de pantalla
  setTimeout(() => {
    mensajeEl.textContent = "";
    mensajeEl.removeAttribute("aria-live");
  }, 2000);
}

// Actualiza el marcador de aciertos, errores y jugadas restantes
function actualizarMarcador() {
  document.getElementById("aciertos").textContent = `✔️: ${aciertos}`;
  document.getElementById("errores").textContent = `❌: ${errores}`;
  document.getElementById("jugadas-restantes").innerHTML = `Jugadas restantes: <span id="jugadas-num">${jugadasRestantes}</span>`;
}

// Muestra el resultado final y detiene el juego
function mostrarResultadoFinal() {
  partidaEnCurso = false;
  clearInterval(timerInterval);
  
  // Comprobar si hay nueva mejor puntuación
  const nuevoPuntuajeMaximo = actualizarMejorPuntuacion();
  
  let mensaje = `🎮 Juego terminado! ✔️: ${aciertos}, ❌: ${errores}`;
  if (nuevoPuntuajeMaximo) {
    mensaje += ' 🏆 ¡Nuevo récord!';
  }
  
  mostrarMensaje(mensaje);
}

// Inicia un cronómetro de cuenta regresiva para cada ronda
function iniciarCronometro(tiempo) {
  tiempoRestante = tiempo;
  document.getElementById("tiempo").textContent = `⏱️: ${tiempoRestante}s`;
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    tiempoRestante--;
    document.getElementById("tiempo").textContent = `⏱️: ${tiempoRestante}s`;
    
    // Alerta cuando queda poco tiempo
    if (tiempoRestante <= 3) {
      document.getElementById("tiempo").style.color = "var(--highlight-color)";
    } else {
      document.getElementById("tiempo").style.color = "var(--font-color)";
    }
    
    if (tiempoRestante === 0) {
      clearInterval(timerInterval);
      document.getElementById("tiempo").style.color = "var(--font-color)";
      mostrarMensaje(`⏳ ¡Tiempo agotado! La mejor jugada era: ${jugadaCorrectaName}`);
      errores++;
      actualizarMarcador();
      jugadasRestantes--;
      if (jugadasRestantes > 0) {
        setTimeout(repartirCartas, 3000);
      } else {
        mostrarResultadoFinal();
      }
    }
  }, 1000);
}

/* =======================
   EVALUACIÓN DE JUGADAS
   ======================= */

// El resto del código para evaluación de jugadas permanece igual
function evaluarMejorJugada(cartas) {
  const valores = cartas.map(carta => valorToNumero[carta.value.toUpperCase()]);
  const pintas = cartas.map(carta => carta.suit);
  const frecuenciaValores = countFrequency(valores);

  if (esEscaleraReal(valores, pintas)) return "Escalera Real";
  if (esEscaleraDeColor(valores, pintas)) return "Escalera de Color";
  if (Object.values(frecuenciaValores).includes(4)) return "Póker";
  if (esFullHouse(frecuenciaValores)) return "Full House";
  if (esColor(pintas)) return "Color";
  if (esEscalera(valores)) return "Escalera";
  if (Object.values(frecuenciaValores).includes(3)) return "Trío";
  if (esDoblePar(frecuenciaValores)) return "Doble Par";
  if (Object.values(frecuenciaValores).includes(2)) return "Par";
  return "Carta Alta";
}

// Verifica si existe una Escalera Real (10-J-Q-K-A del mismo palo)
function esEscaleraReal(valores, pintas) {
  const escaleraReal = [10, 11, 12, 13, 14];
  const sortedValores = [...valores].sort((a, b) => a - b);
  const isConsecutive = sortedValores.join() === escaleraReal.join();
  return isConsecutive && pintas.every(pinta => pinta === pintas[0]);
}

// Verifica si existe una Escalera de Color (mismo palo y escalera, excluyendo la escalera real)
function esEscaleraDeColor(valores, pintas) {
  return esColor(pintas) && esEscalera(valores) && !esEscaleraReal(valores, pintas);
}

// Verifica si existe un Full House (un trío y un par)
function esFullHouse(frecuenciaValores) {
  const counts = Object.values(frecuenciaValores);
  return counts.includes(3) && counts.includes(2);
}

// Verifica si hay al menos 5 cartas del mismo palo (Color)
function esColor(pintas) {
  return Object.values(countFrequency(pintas)).some(count => count >= 5);
}

// Verifica si existe una escalera (5 cartas consecutivas)
function esEscalera(valores) {
  const valoresUnicos = [...new Set(valores)].sort((a, b) => a - b);
  if (valoresUnicos.length < 5) return false;

  for (let i = 0; i <= valoresUnicos.length - 5; i++) {
    if (valoresUnicos[i + 4] - valoresUnicos[i] === 4) {
      return true;
    }
  }

  // Caso especial: escalera baja A-2-3-4-5
  if (valoresUnicos.includes(14) && [2, 3, 4, 5].every(n => valoresUnicos.includes(n))) {
    return true;
  }

  return false;
}

// Verifica si existen dos pares
function esDoblePar(frecuenciaValores) {
  const pares = Object.values(frecuenciaValores).filter(count => count === 2);
  return pares.length >= 2;
}

/* =======================
   OBTENCIÓN DE CARTAS ÓPTIMAS
   ======================= */

// Retorna las 5 cartas óptimas para la jugada indicada
function obtenerCartasOptimas(jugada, cartas) {
  const cartasOrdenadas = sortCardsDesc(cartas);

  switch (jugada) {
    case "Escalera Real":
      return cartasOrdenadas.filter(carta =>
        [10, 11, 12, 13, 14].includes(valorToNumero[carta.value.toUpperCase()])
      );
    case "Escalera de Color":
      return obtenerEscaleraDeColor(cartasOrdenadas);
    case "Póker":
      return obtenerPoker(cartasOrdenadas);
    case "Full House":
      return obtenerFullHouse(cartasOrdenadas);
    case "Color":
      return obtenerColor(cartasOrdenadas);
    case "Escalera":
      return obtenerEscalera(cartasOrdenadas);
    case "Trío":
      return obtenerTrio(cartasOrdenadas);
    case "Doble Par":
      return obtenerDoblePar(cartasOrdenadas);
    case "Par":
      return obtenerPar(cartasOrdenadas);
    default:
      return cartasOrdenadas.slice(0, 5); // Carta Alta
  }
}

// Funciones para extraer las cartas correspondientes a cada jugada
function obtenerEscaleraDeColor(cartas) {
  const dominantSuit = getDominantSuit(cartas);
  return cartas.filter(carta => carta.suit === dominantSuit).slice(0, 5);
}

function obtenerPoker(cartas) {
  const frecuencia = countFrequency(cartas.map(carta => carta.value));
  const valorPoker = Object.keys(frecuencia).find(valor => frecuencia[valor] === 4);
  const cartasPoker = cartas.filter(carta => carta.value === valorPoker);
  const cartaRestante = cartas.find(carta => carta.value !== valorPoker);
  return [...cartasPoker, cartaRestante];
}

function obtenerFullHouse(cartas) {
  const frecuencia = countFrequency(cartas.map(carta => carta.value));
  const valorTrio = Object.keys(frecuencia).find(valor => frecuencia[valor] === 3);
  const valorPar = Object.keys(frecuencia).find(valor => frecuencia[valor] === 2);
  return cartas.filter(carta => carta.value === valorTrio || carta.value === valorPar);
}

function obtenerColor(cartas) {
  const dominantSuit = getDominantSuit(cartas);
  return cartas.filter(carta => carta.suit === dominantSuit).slice(0, 5);
}

function obtenerEscalera(cartas) {
  const valoresUnicos = [...new Set(cartas.map(carta => valorToNumero[carta.value.toUpperCase()]))].sort((a, b) => a - b);
  if (valoresUnicos.length < 5) return [];
  
  // Buscar escalera regular
  for (let i = 0; i <= valoresUnicos.length - 5; i++) {
    if (valoresUnicos[i + 4] - valoresUnicos[i] === 4) {
      const secuencia = valoresUnicos.slice(i, i + 5);
      return cartas.filter(carta =>
        secuencia.includes(valorToNumero[carta.value.toUpperCase()])
      ).slice(0, 5);
    }
  }
  
  // Buscar escalera A-2-3-4-5
  if (valoresUnicos.includes(14) && [2, 3, 4, 5].every(n => valoresUnicos.includes(n))) {
    return cartas.filter(carta =>
      [2, 3, 4, 5, 14].includes(valorToNumero[carta.value.toUpperCase()])
    ).slice(0, 5);
  }
  
  return [];
}

function obtenerTrio(cartas) {
  const frecuencia = countFrequency(cartas.map(carta => carta.value));
  const valorTrio = Object.keys(frecuencia).find(valor => frecuencia[valor] === 3);
  const cartasTrio = cartas.filter(carta => carta.value === valorTrio);
  const restantes = cartas
    .filter(carta => carta.value !== valorTrio)
    .sort((a, b) => valorToNumero[b.value.toUpperCase()] - valorToNumero[a.value.toUpperCase()]);
  return [...cartasTrio, ...restantes.slice(0, 2)];
}

function obtenerDoblePar(cartas) {
  const frecuencia = countFrequency(cartas.map(carta => carta.value));
  const pares = Object.keys(frecuencia).filter(valor => frecuencia[valor] === 2)
    .sort((a, b) => valorToNumero[b.toUpperCase()] - valorToNumero[a.toUpperCase()]);
  
  // Tomamos los dos pares más altos
  const paresMasAltos = pares.slice(0, 2);
  const cartasPares = cartas.filter(carta => paresMasAltos.includes(carta.value));
  
  const restantes = cartas
    .filter(carta => !paresMasAltos.includes(carta.value))
    .sort((a, b) => valorToNumero[b.value.toUpperCase()] - valorToNumero[a.value.toUpperCase()]);
  
  return [...cartasPares, restantes[0]];
}

function obtenerPar(cartas) {
  const frecuencia = countFrequency(cartas.map(carta => carta.value));
  const valorPar = Object.keys(frecuencia).find(valor => frecuencia[valor] === 2);
  const cartasPar = cartas.filter(carta => carta.value === valorPar);
  const restantes = cartas
    .filter(carta => carta.value !== valorPar)
    .sort((a, b) => valorToNumero[b.value.toUpperCase()] - valorToNumero[a.value.toUpperCase()]);
  return [...cartasPar, ...restantes.slice(0, 3)];
}

/* =======================
   EVENTOS DE INICIO Y REINICIO
   ======================= */

document.getElementById("btn-iniciar").addEventListener("click", () => {
  if (!partidaEnCurso) {
    partidaEnCurso = true;
    jugadasRestantes = totalJugadas;
    aciertos = 0;
    errores = 0;
    actualizarMarcador();
    repartirCartas();
    
    // Cambiar apariencia del botón
    document.getElementById("btn-iniciar").textContent = "En curso...";
  }
});

document.getElementById("btn-reiniciar").addEventListener("click", () => {
  clearInterval(timerInterval);
  partidaEnCurso = false;
  document.getElementById("btn-iniciar").textContent = "Iniciar";
  document.getElementById("flop").innerHTML = "";
  document.getElementById("ocultas").innerHTML = "";
  document.getElementById("mensaje").textContent = "";
  jugadasRestantes = totalJugadas;
  aciertos = 0;
  errores = 0;
  actualizarMarcador();
  tiempoRestante = tiempoInicial;
  document.getElementById("tiempo").textContent = `⏱️: ${tiempoRestante}s`;
  document.getElementById("tiempo").style.color = "var(--font-color)";
});
