// Declaración de variables
let systemLocked = false;
let currentOperation = '';
let stage = 0;
let selectedPosition = '';
let selectedQuantity = '';
let f1PressCount = 0;
let cancelAction = false;
let isActionPending = false;

const totalSeguros = Array(6).fill(0); // Total de seguros comprados por cada jugador
const currentCount = Array(6).fill(0); // Marcador de cada jugador

// Elementos del DOM
const display = document.getElementById('display');
const totalSegurosDisplays = Array.from({ length: 6 }, (_, i) => document.getElementById(`total-seguros-j${i + 1}`));
const currentCountDisplays = Array.from({ length: 6 }, (_, i) => document.getElementById(`current-count-j${i + 1}`));
const numberButtons = document.querySelectorAll('.number');

// Función para actualizar el display
const updateDisplay = (message) => {
    display.innerText = message;
};

// Función para reiniciar las variables y la interfaz
const reset = (resetCounters = false) => {
    currentOperation = '';
    stage = 0;
    selectedPosition = '';
    selectedQuantity = '';
    f1PressCount = 0;
    if (resetCounters) {
        currentCount.fill(0);
        currentCountDisplays.forEach(display => display.innerText = 'JUGADOR: 0');
    }
};

// Función para manejar la operación de venta o reembolso
const handleOperation = (operation, position, quantity) => {
    const totalValue = quantity * 500;
    if (operation === 'sell') {
        totalSeguros[position - 1] += quantity;
        updateDisplay(`CONF. JUG. # ${position}\n $${totalValue}`);
    } else if (operation === 'return') {
        totalSeguros[position - 1] -= quantity;
        updateDisplay(`REEMB. JUG. # ${position}\n $${totalValue}`);
    }
    totalSegurosDisplays[position - 1].innerText = `CREDITOS: ${totalSeguros[position - 1]}`;
    setTimeout(() => {
        updateDisplay('SYSTEMA LISTO !\n TOCAR * EMPEZAR *');
        reset();
    }, 1000);
};

// Evento para el botón F1 (Aceptar)
document.getElementById('f1').addEventListener('click', () => {
    if (!systemLocked && (currentOperation === 'sell' || currentOperation === 'return') && stage === 2) {
        const quantity = parseInt(selectedQuantity, 10);
        if (quantity < 1) {
            updateDisplay('VALOR MUY BAJO \n MIN: 1');
            return;
        } else if (quantity > 50) {
            updateDisplay('VALOR MUY ALTO \n MAX: 50');
            return;
        }
        if (currentOperation === 'return' && quantity > totalSeguros[selectedPosition - 1]) {
            return;
        }
        f1PressCount++;
        if (f1PressCount === 2) {
            handleOperation(currentOperation, selectedPosition, quantity);
        } else {
            updateDisplay(`${currentOperation === 'sell' ? 'CONF.' : 'REEMB.'} JUG. # ${selectedPosition} \n$${quantity * 500}`);
        }
    }
});

// Evento para el botón F2 (Vender)
document.getElementById('f2').addEventListener('click', () => {
    if (!systemLocked && currentOperation === '') {
        currentOperation = 'sell';
        stage = 1;
        updateDisplay('JU#       COMPRA');
    }
});

// Evento para el botón F3 (Reembolsar)
document.getElementById('f3').addEventListener('click', () => {
    if (!systemLocked && currentOperation === '' && totalSeguros.some(total => total > 0)) {
        currentOperation = 'return';
        stage = 1;
        updateDisplay('JU #       REEMBOLSO');
    }
});

// Evento para el botón F4 (Salir o Cancelar)
document.getElementById('f4').addEventListener('click', () => {
    if (isActionPending) {
        updateDisplay('JUGANDO !\nTOCAR *PARAR*');
        isActionPending = false;
        cancelAction = false;
        systemLocked = true;
    } else if (!systemLocked) {
        updateDisplay('SYSTEMA LISTO !\n TOCAR * EMPEZAR *');
        cancelAction = true;
        setTimeout(() => {
            cancelAction = false;
        }, 5000);
        reset();
    }
});

// Evento para los botones numéricos
numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        if (!systemLocked) {
            if (stage === 1) {
                selectedPosition = parseInt(button.innerText, 10);
                updateDisplay(`JU# ${selectedPosition} ${currentOperation === 'sell' ? 'COMPRA' : 'REEMBOLSO'} \n0`);
                stage = 2;
            } else if (stage === 2) {
                selectedQuantity += button.innerText;
                updateDisplay(`JU# ${selectedPosition} ${currentOperation === 'sell' ? 'COMPRA' : 'REEMBOLSO'}\n ${selectedQuantity}`);
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
            let credits = parseInt(creditsElement.innerText.replace('CREDITOS: ', ''), 10);

            if (credits > 0 && currentCount[index - 1] < 6) {
                currentCount[index - 1]++;

                // Reiniciar el contador a 0 si llega a 5
                if (currentCount[index - 1] === 6) {
                    currentCount[index - 1] = 0;
                }

                currentCountDisplays[index - 1].innerText = `JUGADOR: ${currentCount[index - 1]}`;
            }
        }
    };
}

// Evento para el botón de empezar
document.getElementById('start').addEventListener('click', () => {
    if (!systemLocked) {
        systemLocked = true;
        updateDisplay('JUGANDO !\nTOCAR *PARAR*');
        totalSeguros.forEach((_, i) => {
            totalSeguros[i] = Math.max(totalSeguros[i] - currentCount[i], 0);
            totalSegurosDisplays[i].innerText = `CREDITOS: ${totalSeguros[i]}`;
        });
    }
});

// Evento para el botón de parar
document.getElementById('stop').addEventListener('click', () => {
    if (systemLocked) {
        updateDisplay('PRESIONE F4 PARA \n VOLVER');
        systemLocked = false;
        isActionPending = true;
    } else if (isActionPending) {
        updateDisplay('SYSTEMA LISTO !\n TOCAR * EMPEZAR *');
        isActionPending = false;
        reset(true);
    }
});

// Eventos para los botones de marcador de los jugadores
for (let i = 1; i <= 6; i++) {
    let button = document.getElementById(`mark-button-j${i}`);
    if (button) {
        button.addEventListener('click', createClickListener(i));
    }
}