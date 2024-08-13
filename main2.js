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
    if (!systemLocked && (currentOperation === 'sell' || currentOperation === 'return') && stage === 2 && selectedPosition) {
        const quantity = parseInt(selectedQuantity, 10);

        // Verificar si no se ha ingresado una cantidad válida
        if (isNaN(quantity)) {
            return; // No hacer nada si la cantidad es NaN
        }

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
                const number = parseInt(button.innerText, 10);
                if (number >= 1 && number <= 6) {
                    selectedPosition = number;
                    updateDisplay(`JU# ${selectedPosition} ${currentOperation === 'sell' ? 'COMPRA' : 'REEMBOLSO'} \n0`);
                    stage = 2;
                }
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
            // Obtener el elemento de créditos y su valor actual
            const creditsElement = document.getElementById(`total-seguros-j${index}`);
            let credits = parseInt(creditsElement.innerText.replace('CREDITOS: ', ''), 10);

            // Verificar si hay créditos disponibles
            if (credits > 0) {
                currentCount[index - 1]++;

                // Reiniciar el contador a 0 si llega a 6 o si alcanza el número de créditos disponibles
                if (currentCount[index - 1] === 6 || currentCount[index - 1] > credits) {
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





// Función para manejar la operación "TARJETA JEFE"
const tarjetaJefe = () => {
    if (!systemLocked) {
        updateDisplay('SYSTEMA NO INICIADO');
        return;
    }

    let jefeOperationStage = 0;
    let selectedPlayer = '';
    let selectedPrize = '';

    // Filtrar jugadores con currentCount > 0
    const activePlayers = currentCount
        .map((count, index) => count > 0 ? index + 1 : null)
        .filter(player => player !== null);
    if (activePlayers.length === 0) {
        updateDisplay('NO HAY JUGADORES\nACTIVOS');
        return;
    }

    updateDisplay(' SELEC JUG #');

    // Iluminar números de jugadores activos con currentCount > 0
    numberButtons.forEach(button => {
        const number = parseInt(button.innerText, 10);
        if (activePlayers.includes(number)) {
            button.classList.add('active-number');
        } else {
            button.classList.remove('active-number');
        }
    });

    // Evento para los botones numéricos durante la operación "TARJETA JEFE"
    const handleNumberClick = (e) => {
        const number = parseInt(e.target.innerText, 10);

        if (jefeOperationStage === 0) {
            if (activePlayers.includes(number)) {
                selectedPlayer = number;
                updateDisplay(`JUG# ${selectedPlayer}\nCONFIRMAR CON F1`);

                // Remover clase activa de todos los números y resaltar el seleccionado
                numberButtons.forEach(button => button.classList.remove('selected-number'));
                e.target.classList.add('selected-number');

                jefeOperationStage = 1;
            } else {
                updateDisplay('JUGADOR INACTIVO');
            }
        } else if (jefeOperationStage === 1) {
            if (number >= 1 && number <= 8) {
                selectedPrize = number;
                const prizeNames = ['ESCALERA REAL', 'ESCALERA COLOR', 'POKER', 'FULL', 'COLOR', 'ESCALERA SENCILLA', 'CARTA MÁGICA', 'JUGADOR AFORTUNADO'];
                updateDisplay(`PREMIO: ${prizeNames[selectedPrize - 1]}\nCONFIRMAR CON F1`);

                // Resaltar la opción de premio seleccionada
                numberButtons.forEach(button => button.classList.remove('selected-prize'));
                e.target.classList.add('selected-prize');

                jefeOperationStage = 2;
            }
        }
    };

    // Evento para el botón F1 durante la operación "TARJETA JEFE"
    const handleF1Click = () => {
        if (jefeOperationStage === 1) {
            updateDisplay('SELEC PREMIO\n1-8');
        } else if (jefeOperationStage === 2) {
            const activeInsurance = currentCount[selectedPlayer - 1]; // Usar el currentCount en lugar de totalSeguros
            let payout = 0;

            switch (selectedPrize) {
                case 1:
                    payout = activeInsurance * 1000000; // 100% del pago
                    break;
                case 2:
                    payout = Math.min(activeInsurance * 2500000, 10000000); // 10% del pozo
                    break;
                case 3:
                    payout = activeInsurance * 250000;
                    break;
                case 4:
                    payout = activeInsurance * 50000;
                    break;
                case 5:
                    payout = activeInsurance * 25000;
                    break;
                case 6:
                    payout = activeInsurance * 10000;
                    break;
                case 7:
                    payout = activeInsurance * 20000;
                    break;
                case 8:
                    payout = activeInsurance * 10000;
                    break;
                default:
                    break;
            }
            updateDisplay(`PAGAR A JUG# ${selectedPlayer}\nPREMIO: $${payout}`);
            reset();
            cleanup(); // Limpiar los listeners después de la operación
        }
    };

    // Agregar event listeners
    numberButtons.forEach(button => button.addEventListener('click', handleNumberClick));
    document.getElementById('f1').addEventListener('click', handleF1Click);

    // Remover event listeners y clases CSS después de la operación
    const cleanup = () => {
        numberButtons.forEach(button => button.removeEventListener('click', handleNumberClick));
        document.getElementById('f1').removeEventListener('click', handleF1Click);
        numberButtons.forEach(button => button.classList.remove('active-number', 'selected-number', 'selected-prize'));
    };
};

// Asignar la función al botón "TARJETA JEFE"
document.getElementById('tarjeta-jefe').addEventListener('click', tarjetaJefe);
