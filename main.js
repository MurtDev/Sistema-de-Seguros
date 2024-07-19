// Declaración de variables
let systemLocked = false;
let currentOperation = '';
let stage = 0;
let selectedPosition = '';
let selectedQuantity = '';
let f1PressCount = 0;

let totalSeguros = [0, 0, 0, 0, 0, 0]; // Total de seguros comprados por cada jugador
let currentCount = [0, 0, 0, 0, 0, 0]; // Marcador de cada jugador

// Elementos del DOM
const display = document.getElementById('display');
const totalSegurosDisplays = [
    document.getElementById('total-seguros-j1'),
    document.getElementById('total-seguros-j2'),
    document.getElementById('total-seguros-j3'),
    document.getElementById('total-seguros-j4'),
    document.getElementById('total-seguros-j5'),
    document.getElementById('total-seguros-j6')
];

const currentCountDisplays = [
    document.getElementById('current-count-j1'),
    document.getElementById('current-count-j2'),
    document.getElementById('current-count-j3'),
    document.getElementById('current-count-j4'),
    document.getElementById('current-count-j5'),
    document.getElementById('current-count-j6')
];

const numberButtons = document.querySelectorAll('.number');

// Evento para el botón F1 (Aceptar)
document.getElementById('f1').addEventListener('click', function () {
    if (!systemLocked && (currentOperation === 'sell' || currentOperation === 'return') && stage === 2) {
        f1PressCount++;
        const quantity = parseInt(selectedQuantity, 10);
        const totalValue = quantity * 500;
        if (f1PressCount === 2) {
            if (currentOperation === 'sell') {
                totalSeguros[selectedPosition - 1] += quantity;
                display.innerText = `CONF. JUG. # ${selectedPosition}\n $${totalValue}.`;
            } else if (currentOperation === 'return') {
                totalSeguros[selectedPosition - 1] -= quantity;
                display.innerText = `REEMB. JUG. # ${selectedPosition}\n $${totalValue}.`;
            }
            totalSegurosDisplays[selectedPosition - 1].innerText = `Creditos: ${totalSeguros[selectedPosition - 1]}`;
            setTimeout(() => {
                display.innerText = 'SYSTEMA LISTO !\n TOCAR * EMPEZAR *';
                reset();
            }, 2000);
        } else {
            display.innerText = `${currentOperation === 'sell' ? 'CONF.' : 'REEMB.'} JUG. # ${selectedPosition} \n$${totalValue}.`;
        }
    }
});

// Evento para el botón F2 (Vender)
document.getElementById('f2').addEventListener('click', function () {
    if (!systemLocked && currentOperation === '') {
        currentOperation = 'sell';
        stage = 1;
        display.innerText = 'JU#       COMPRA';
    }
});

// Evento para el botón F3 (Reembolsar)
document.getElementById('f3').addEventListener('click', function () {
    if (!systemLocked && currentOperation === '' && totalSeguros.some(total => total > 0)) {
        currentOperation = 'return';
        stage = 1;
        display.innerText = 'JU #       REEMBOLSO';
    }
});

// Evento para el botón F4 (Salir)
document.getElementById('f4').addEventListener('click', function () {
    if (systemLocked) {
        display.innerText = 'PRESIONE F4 PARA \n VOLVER ATRAS';
        systemLocked = false; // Desbloquear el sistema
    } else {
        display.innerText = 'SYSTEMA LISTO !\n TOCAR * EMPEZAR *';
        reset();
    }
});

// Evento para los botones numéricos
numberButtons.forEach(button => {
    button.addEventListener('click', function () {
        if (!systemLocked) {
            // Selección del puesto
            if (stage === 1) {
                selectedPosition = parseInt(button.innerText, 10);
                if (currentOperation === 'sell') {
                    display.innerText = `JU# ${selectedPosition} COMPRA \n0`;
                } else if (currentOperation === 'return') {
                    display.innerText = `JU# ${selectedPosition} REEMBOLSO \n0`;
                }
                stage = 2;
            } else if (stage === 2) {
                selectedQuantity += button.innerText;
                if (currentOperation === 'sell') {
                    display.innerText = `JU# ${selectedPosition} COMPRA\n ${selectedQuantity}`;
                } else if (currentOperation === 'return') {
                    display.innerText = `JU# ${selectedPosition} REEMBOLSO\n ${selectedQuantity}`;
                }
            }
        }
    });
});

// Función para crear el listener de clic para los botones de marcador
function createClickListener(index) {
    return function () {
        if (!systemLocked) {
            // Verificar si hay créditos disponibles antes de incrementar el contador
            const creditsElement = document.getElementById(`total-seguros-j${index}`);
            let credits = parseInt(creditsElement.innerText.replace('Creditos: ', ''), 10);

            if (credits > 0 && currentCount[index - 1] < 6 && currentCount[index - 1] < credits) {
                currentCount[index - 1]++;

                // Reiniciar el contador a 0 si llega a 5
                if (currentCount[index - 1] >= 6) {
                    currentCount[index - 1] = 0;
                }

                currentCountDisplays[index - 1].innerText = `Jugador: ${currentCount[index - 1]}`;
            }
        }
    };
}

// Función para reiniciar las variables y la interfaz
function reset() {
    currentOperation = '';
    stage = 0;
    selectedPosition = '';
    selectedQuantity = '';
    f1PressCount = 0;
    currentCount = [0, 0, 0, 0, 0, 0]; // Reiniciar marcadores
    currentCountDisplays.forEach(display => display.innerText = 'Jugador: 0');
}

// Evento para el botón de empezar
document.getElementById('start').addEventListener('click', function () {
    if (!systemLocked) { // Verificar si el sistema no está bloqueado
        systemLocked = true; // Bloquear el sistema
        display.innerText = 'JUGANDO !\nTOCAR *PARAR*';
        // Descontar los seguros marcados del total de seguros
        for (let i = 0; i < 6; i++) {
            if (totalSeguros[i] >= currentCount[i]) {
                totalSeguros[i] -= currentCount[i];
            } else {
                totalSeguros[i] = 0;
            }
            if (totalSegurosDisplays[i]) {
                totalSegurosDisplays[i].innerText = `Creditos: ${totalSeguros[i]}`;
            }
        }
    }
});

// Evento para el botón de parar
document.getElementById('stop').addEventListener('click', function () {
    if (systemLocked) {
        display.innerText = 'PRESIONE F4 PARA \n VOLVER ATRAS';
        systemLocked = false; // Desbloquear el sistema
    } else {
        display.innerText = 'SYSTEMA LISTO !\n TOCAR * EMPEZAR *';
        reset();
    }
});

// Eventos para los botones de marcador de los jugadores
for (let i = 1; i <= 6; i++) {
    let button = document.getElementById(`mark-button-j${i}`);
    if (button) {
        button.addEventListener('click', createClickListener(i));
    }
}
