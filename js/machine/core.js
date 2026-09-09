/**
 * Núcleo de la Máquina Virtual de Seguros.
 * Máquina de estados compartida por la mesa estándar y el modo jefe.
 */
(function (global) {
    const PLAYER_COUNT = 6;
    const MAX_MARKS = 5;
    const MAX_QTY = 50;
    const MAX_QTY_DIGITS = 2;

    const PRIZES = [
        { name: 'ESCALERA REAL', payout: (n) => n * 1000000 },
        { name: 'ESCALERA COLOR', payout: (n) => Math.min(n * 2500000, 10000000) },
        { name: 'POKER', payout: (n) => n * 500000 },
        { name: 'FULL', payout: (n) => n * 100000 },
        { name: 'COLOR', payout: (n) => n * 50000 },
        { name: 'ESCALERA SENCILLA', payout: (n) => n * 10000 },
        { name: 'CARTA MAGICA', payout: (n) => n * 40000 },
        { name: 'JUGADOR AFORTUNADO', payout: (n) => n * 20000 }
    ];

    const MSG = {
        idle: 'SISTEMA LISTO !\n TOCAR * EMPEZAR *',
        playing: 'JUGANDO !\nTOCAR *PARAR*',
        stopHint: 'PRESIONE F4 PARA \n VOLVER',
        sell: 'JU#       COMPRA',
        refund: 'JU #       REEMBOLSO',
        low: 'VALOR MUY BAJO \n MIN: 1',
        high: `VALOR MUY ALTO \n MAX: ${MAX_QTY}`,
        noCredit: 'CREDITOS INSUF.\nREEMBOLSO',
        noPlayers: 'NO HAY JUGADORES\nACTIVOS',
        jefePlayer: 'SELEC JUG #',
        jefePrize: 'SELEC PREMIO\n1-8',
        inactive: 'JUGADOR INACTIVO'
    };

    function formatMoney(value) {
        return '$' + Number(value).toLocaleString('es-CL');
    }

    function createInsuranceMachine(config = {}) {
        const unitPrice = config.unitPrice ?? 1000;
        const enableJefe = Boolean(config.enableJefe);

        const state = {
            locked: false,
            pendingStop: false,
            operation: null,
            stage: 0,
            position: 0,
            quantity: '',
            replaceQuantity: false,
            confirmCount: 0,
            credits: Array(PLAYER_COUNT).fill(0),
            marks: Array(PLAYER_COUNT).fill(0),
            history: [],
            muted: localStorage.getItem('mvs-muted') === '1',
            soldSession: 0,
            refundedSession: 0,
            jefeStage: 0,
            jefePlayer: 0,
            jefePrize: 0
        };

        const display = document.getElementById('display');
        const statusBadge = document.getElementById('status-badge');
        const muteButton = document.getElementById('mute-button');
        const historyList = document.getElementById('history-list');
        const mesaTotal = document.getElementById('mesa-total');
        const soldStat = document.getElementById('stat-sold');
        const refundStat = document.getElementById('stat-refund');
        const creditDisplays = Array.from({ length: PLAYER_COUNT }, (_, i) =>
            document.getElementById(`total-seguros-j${i + 1}`)
        );
        const markDisplays = Array.from({ length: PLAYER_COUNT }, (_, i) =>
            document.getElementById(`current-count-j${i + 1}`)
        );
        const playerBoxes = Array.from({ length: PLAYER_COUNT }, (_, i) =>
            document.getElementById(`player-box-j${i + 1}`)
        );
        const markDots = Array.from({ length: PLAYER_COUNT }, (_, i) =>
            document.getElementById(`mark-dots-j${i + 1}`)
        );
        const numberButtons = document.querySelectorAll('.number');
        const functionButtons = {
            f1: document.getElementById('f1'),
            f2: document.getElementById('f2'),
            f3: document.getElementById('f3'),
            f4: document.getElementById('f4')
        };

        let audioCtx = null;

        function getAudio() {
            if (!audioCtx) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) audioCtx = new Ctx();
            }
            return audioCtx;
        }

        function playTone(frequency, duration, type = 'square') {
            if (state.muted) return;
            const ctx = getAudio();
            if (!ctx) return;
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type;
            osc.frequency.value = frequency;
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + duration);
        }

        function beepOk() { playTone(880, 0.08); }
        function beepConfirm() { playTone(1200, 0.12); }
        function beepError() { playTone(180, 0.18); }
        function beepClick() { playTone(520, 0.04); }

        function updateDisplay(message) {
            if (display) display.innerText = message;
        }

        function setStatus(status) {
            if (!statusBadge) return;
            statusBadge.textContent = status;
            statusBadge.dataset.status = status.toLowerCase();
        }

        function setActiveKeys(ids) {
            Object.values(functionButtons).forEach((btn) => btn && btn.classList.remove('is-active'));
            ids.forEach((id) => functionButtons[id] && functionButtons[id].classList.add('is-active'));
        }

        function highlightPlayers(positions) {
            playerBoxes.forEach((box, index) => {
                if (!box) return;
                box.classList.toggle('is-selected', positions.includes(index + 1));
            });
        }

        function highlightNumbers(positions, className) {
            numberButtons.forEach((button) => {
                const value = parseInt(button.dataset.value, 10);
                button.classList.toggle(className, positions.includes(value));
            });
        }

        function clearNumberHighlights() {
            numberButtons.forEach((button) => {
                button.classList.remove('active-number', 'selected-number', 'selected-prize');
            });
        }

        function renderMarks(index) {
            const marks = state.marks[index];
            if (markDisplays[index]) {
                markDisplays[index].innerText = `JUGADOR: ${marks}`;
            }
            if (markDots[index]) {
                markDots[index].innerHTML = Array.from({ length: MAX_MARKS }, (_, dot) =>
                    `<span class="mark-dot${dot < marks ? ' is-on' : ''}"></span>`
                ).join('');
            }
        }

        function renderCredits(index) {
            if (creditDisplays[index]) {
                creditDisplays[index].innerText = `CREDITOS: ${state.credits[index]}`;
            }
            if (playerBoxes[index]) {
                playerBoxes[index].classList.toggle('has-credits', state.credits[index] > 0);
            }
        }

        function renderStats() {
            const tableTotal = state.credits.reduce((sum, value) => sum + value, 0);
            if (mesaTotal) mesaTotal.textContent = String(tableTotal);
            if (soldStat) soldStat.textContent = String(state.soldSession);
            if (refundStat) refundStat.textContent = String(state.refundedSession);
        }

        function renderHistory() {
            if (!historyList) return;
            if (state.history.length === 0) {
                historyList.innerHTML = '<li class="history-empty">Sin operaciones en esta sesión</li>';
                return;
            }
            historyList.innerHTML = state.history.map((item) =>
                `<li><span>${item.time}</span><strong>${item.text}</strong></li>`
            ).join('');
        }

        function addHistory(text) {
            const time = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            state.history.unshift({ time, text });
            state.history = state.history.slice(0, 10);
            renderHistory();
        }

        function flashDisplay() {
            if (!display) return;
            display.classList.add('is-flash');
            setTimeout(() => display.classList.remove('is-flash'), 180);
        }

        function resetOperation() {
            state.operation = null;
            state.stage = 0;
            state.position = 0;
            state.quantity = '';
            state.replaceQuantity = false;
            state.confirmCount = 0;
            state.jefeStage = 0;
            state.jefePlayer = 0;
            state.jefePrize = 0;
            highlightPlayers([]);
            clearNumberHighlights();
            setActiveKeys([]);
        }

        function goIdle() {
            resetOperation();
            state.locked = false;
            state.pendingStop = false;
            updateDisplay(MSG.idle);
            setStatus('LISTO');
            document.body.classList.remove('is-playing', 'is-paused', 'is-jefe');
        }

        function goPlaying() {
            resetOperation();
            state.locked = true;
            state.pendingStop = false;
            updateDisplay(MSG.playing);
            setStatus('JUGANDO');
            document.body.classList.add('is-playing');
            document.body.classList.remove('is-paused', 'is-jefe');
        }

        function resetMarks() {
            state.marks.fill(0);
            state.marks.forEach((_, index) => renderMarks(index));
        }

        function canOperate() {
            return !state.locked && !state.pendingStop && state.jefeStage === 0;
        }

        function pressVisual(element) {
            if (!element) return;
            element.classList.add('is-pressed');
            setTimeout(() => element.classList.remove('is-pressed'), 120);
        }

        function handleF1() {
            pressVisual(functionButtons.f1);
            if (state.jefeStage > 0) {
                handleJefeF1();
                return;
            }
            if (!canOperate() || !state.operation || state.stage < 2 || !state.position) {
                return;
            }

            const quantity = parseInt(state.quantity, 10);
            if (Number.isNaN(quantity)) {
                beepError();
                return;
            }
            if (quantity < 1) {
                updateDisplay(MSG.low);
                beepError();
                flashDisplay();
                state.confirmCount = 0;
                return;
            }
            if (state.operation === 'sell' && quantity > MAX_QTY) {
                updateDisplay(MSG.high);
                beepError();
                flashDisplay();
                state.confirmCount = 0;
                return;
            }
            if (state.operation === 'return' && quantity > state.credits[state.position - 1]) {
                updateDisplay(MSG.noCredit);
                beepError();
                flashDisplay();
                state.confirmCount = 0;
                return;
            }

            state.confirmCount += 1;
            const prefix = state.operation === 'sell' ? 'CONF.' : 'REEMB.';
            if (state.confirmCount === 1) {
                updateDisplay(`${prefix} JUG. # ${state.position} \n${formatMoney(quantity * unitPrice)}`);
                setActiveKeys(['f1']);
                beepOk();
                return;
            }

            applyOperation(state.operation, state.position, quantity);
        }

        function applyOperation(operation, position, quantity) {
            const totalValue = quantity * unitPrice;
            if (operation === 'sell') {
                state.credits[position - 1] += quantity;
                state.soldSession += quantity;
                updateDisplay(`CONF. JUG. # ${position}\n ${formatMoney(totalValue)}`);
                addHistory(`Venta J${position}: ${quantity} · ${formatMoney(totalValue)}`);
            } else {
                state.credits[position - 1] -= quantity;
                state.refundedSession += quantity;
                updateDisplay(`REEMB. JUG. # ${position}\n ${formatMoney(totalValue)}`);
                addHistory(`Reembolso J${position}: ${quantity} · ${formatMoney(totalValue)}`);
            }
            renderCredits(position - 1);
            renderStats();
            beepConfirm();
            flashDisplay();
            resetOperation();
            setTimeout(() => {
                if (!state.operation && !state.locked) goIdle();
            }, 900);
        }

        function handleF2() {
            pressVisual(functionButtons.f2);
            if (!canOperate() || state.operation) return;
            state.operation = 'sell';
            state.stage = 1;
            updateDisplay(MSG.sell);
            setStatus('COMPRA');
            setActiveKeys(['f2', 'f4']);
            highlightNumbers([1, 2, 3, 4, 5, 6], 'active-number');
            beepClick();
        }

        function handleF3() {
            pressVisual(functionButtons.f3);
            if (!canOperate() || state.operation) return;
            if (!state.credits.some((total) => total > 0)) {
                updateDisplay('SIN CREDITOS\nPARA REEMBOLSO');
                beepError();
                flashDisplay();
                setTimeout(() => {
                    if (!state.operation) updateDisplay(MSG.idle);
                }, 900);
                return;
            }
            state.operation = 'return';
            state.stage = 1;
            updateDisplay(MSG.refund);
            setStatus('REEMBOLSO');
            setActiveKeys(['f3', 'f4']);
            const withCredits = state.credits
                .map((total, index) => (total > 0 ? index + 1 : null))
                .filter(Boolean);
            highlightNumbers(withCredits, 'active-number');
            beepClick();
        }

        function handleF4() {
            pressVisual(functionButtons.f4);
            if (state.jefeStage > 0) {
                goPlaying();
                beepClick();
                return;
            }
            if (state.pendingStop) {
                goPlaying();
                beepClick();
                return;
            }
            if (!state.locked) {
                goIdle();
                beepClick();
            }
        }

        function handleNumber(value, button) {
            if (button) pressVisual(button);
            if (state.jefeStage > 0) {
                handleJefeNumber(value, button);
                return;
            }
            if (!canOperate() || !state.operation) return;

            if (state.stage === 1) {
                if (value < 1 || value > PLAYER_COUNT) {
                    beepError();
                    return;
                }
                if (state.operation === 'return' && state.credits[value - 1] <= 0) {
                    updateDisplay('JUGADOR SIN\nCREDITOS');
                    beepError();
                    flashDisplay();
                    return;
                }
                state.position = value;
                state.stage = 2;
                state.confirmCount = 0;
                highlightPlayers([value]);
                clearNumberHighlights();
                if (state.operation === 'return') {
                    state.quantity = String(state.credits[value - 1]);
                    state.replaceQuantity = true;
                    updateDisplay(`JU# ${value} REEMBOLSO\n ${state.quantity}`);
                } else {
                    state.quantity = '';
                    state.replaceQuantity = false;
                    updateDisplay(`JU# ${value} COMPRA \n0`);
                }
                setActiveKeys(['f1', 'f4']);
                beepOk();
                return;
            }

            if (state.stage === 2) {
                const maxDigits = state.operation === 'return' ? 3 : MAX_QTY_DIGITS;
                if (state.replaceQuantity) {
                    state.quantity = String(value);
                    state.replaceQuantity = false;
                } else {
                    if (state.quantity.length >= maxDigits) {
                        beepError();
                        return;
                    }
                    state.quantity += String(value);
                }
                state.confirmCount = 0;
                updateDisplay(`JU# ${state.position} ${state.operation === 'sell' ? 'COMPRA' : 'REEMBOLSO'}\n ${state.quantity}`);
                beepClick();
            }
        }

        function handleMark(index) {
            if (!canOperate()) return;
            const credits = state.credits[index];
            if (credits <= 0) {
                beepError();
                return;
            }
            let next = state.marks[index] + 1;
            const limit = Math.min(MAX_MARKS, credits);
            if (next > limit) next = 0;
            state.marks[index] = next;
            renderMarks(index);
            beepClick();
        }

        function handleStart() {
            pressVisual(document.getElementById('start'));
            if (!canOperate()) return;
            state.credits.forEach((_, index) => {
                state.credits[index] = Math.max(state.credits[index] - state.marks[index], 0);
                renderCredits(index);
            });
            renderStats();
            const used = state.marks.reduce((sum, value) => sum + value, 0);
            if (used > 0) addHistory(`Mano iniciada · ${used} seguro(s) usados`);
            goPlaying();
            beepConfirm();
        }

        function handleStop() {
            pressVisual(document.getElementById('stop'));
            if (state.jefeStage > 0) return;
            if (state.locked) {
                state.locked = false;
                state.pendingStop = true;
                updateDisplay(MSG.stopHint);
                setStatus('PAUSA');
                setActiveKeys(['f4']);
                document.body.classList.remove('is-playing');
                document.body.classList.add('is-paused');
                beepClick();
                return;
            }
            if (state.pendingStop) {
                resetMarks();
                addHistory('Mano finalizada');
                goIdle();
                beepOk();
            }
        }

        function activeMarkedPlayers() {
            return state.marks
                .map((count, index) => (count > 0 ? index + 1 : null))
                .filter(Boolean);
        }

        function handleJefe() {
            const jefeButton = document.getElementById('tarjeta-jefe');
            pressVisual(jefeButton);
            if (!enableJefe) return;
            if (!state.locked) {
                updateDisplay('SISTEMA NO INICIADO');
                beepError();
                flashDisplay();
                return;
            }
            const active = activeMarkedPlayers();
            if (active.length === 0) {
                updateDisplay(MSG.noPlayers);
                beepError();
                flashDisplay();
                setTimeout(() => {
                    if (state.locked && state.jefeStage === 0) updateDisplay(MSG.playing);
                }, 900);
                return;
            }
            resetOperation();
            state.locked = true;
            state.jefeStage = 1;
            updateDisplay(MSG.jefePlayer);
            setStatus('JEFE');
            setActiveKeys(['f4']);
            highlightNumbers(active, 'active-number');
            document.body.classList.add('is-jefe');
            beepOk();
        }

        function handleJefeNumber(value, button) {
            const active = activeMarkedPlayers();
            if (state.jefeStage === 1) {
                if (!active.includes(value)) {
                    updateDisplay(MSG.inactive);
                    beepError();
                    return;
                }
                state.jefePlayer = value;
                state.jefeStage = 2;
                highlightPlayers([value]);
                clearNumberHighlights();
                if (button) button.classList.add('selected-number');
                updateDisplay(`JUG# ${value}\nCONFIRMAR CON F1`);
                setActiveKeys(['f1', 'f4']);
                beepOk();
                return;
            }
            if (state.jefeStage === 3 && value >= 1 && value <= 8) {
                state.jefePrize = value;
                state.jefeStage = 4;
                numberButtons.forEach((btn) => btn.classList.remove('selected-prize'));
                if (button) button.classList.add('selected-prize');
                updateDisplay(`PREMIO: ${PRIZES[value - 1].name}\nCONFIRMAR CON F1`);
                setActiveKeys(['f1', 'f4']);
                beepOk();
            }
        }

        function handleJefeF1() {
            if (state.jefeStage === 2) {
                state.jefeStage = 3;
                updateDisplay(MSG.jefePrize);
                highlightNumbers([1, 2, 3, 4, 5, 6, 7, 8], 'active-number');
                setActiveKeys(['f4']);
                beepOk();
                return;
            }
            if (state.jefeStage === 4) {
                const marks = state.marks[state.jefePlayer - 1];
                const prize = PRIZES[state.jefePrize - 1];
                const payout = prize.payout(marks);
                updateDisplay(`PAGAR A JUG# ${state.jefePlayer}\n${formatMoney(payout)}`);
                addHistory(`Premio J${state.jefePlayer}: ${prize.name} · ${formatMoney(payout)}`);
                beepConfirm();
                flashDisplay();
                setTimeout(goPlaying, 1600);
            }
        }

        function toggleMute() {
            state.muted = !state.muted;
            localStorage.setItem('mvs-muted', state.muted ? '1' : '0');
            syncMuteButton();
        }

        function syncMuteButton() {
            if (!muteButton) return;
            muteButton.textContent = state.muted ? 'Sonido off' : 'Sonido on';
            muteButton.setAttribute('aria-pressed', String(state.muted));
            muteButton.classList.toggle('is-muted', state.muted);
        }

        function bindUi() {
            functionButtons.f1 && functionButtons.f1.addEventListener('click', handleF1);
            functionButtons.f2 && functionButtons.f2.addEventListener('click', handleF2);
            functionButtons.f3 && functionButtons.f3.addEventListener('click', handleF3);
            functionButtons.f4 && functionButtons.f4.addEventListener('click', handleF4);
            document.getElementById('start')?.addEventListener('click', handleStart);
            document.getElementById('stop')?.addEventListener('click', handleStop);
            document.getElementById('tarjeta-jefe')?.addEventListener('click', handleJefe);
            muteButton?.addEventListener('click', toggleMute);

            numberButtons.forEach((button) => {
                button.addEventListener('click', () => {
                    handleNumber(parseInt(button.dataset.value, 10), button);
                });
            });

            for (let i = 1; i <= PLAYER_COUNT; i += 1) {
                const button = document.getElementById(`mark-button-j${i}`);
                if (button) {
                    button.addEventListener('click', () => handleMark(i - 1));
                }
            }

            document.addEventListener('keydown', (event) => {
                const key = event.key;
                if (['F1', 'F2', 'F3', 'F4'].includes(key)) {
                    event.preventDefault();
                    ({ F1: handleF1, F2: handleF2, F3: handleF3, F4: handleF4 }[key]());
                    return;
                }
                if (key === 'Escape') {
                    const openModal = document.querySelector('.modal.show');
                    if (openModal) {
                        openModal.classList.remove('show');
                        return;
                    }
                    handleF4();
                    return;
                }
                if (key === 'Enter') {
                    handleF1();
                    return;
                }
                if (/^[0-9]$/.test(key)) {
                    const button = document.querySelector(`.number[data-value="${key}"]`);
                    handleNumber(Number(key), button);
                }
            });

            document.querySelectorAll('[data-open-modal]').forEach((button) => {
                button.addEventListener('click', () => {
                    document.getElementById(button.dataset.openModal)?.classList.add('show');
                });
            });

            document.querySelectorAll('[data-close-modal]').forEach((button) => {
                button.addEventListener('click', () => {
                    button.closest('.modal')?.classList.remove('show');
                });
            });

            document.querySelectorAll('.modal').forEach((modal) => {
                modal.addEventListener('click', (event) => {
                    if (event.target === modal) modal.classList.remove('show');
                });
            });
        }

        function init() {
            bindUi();
            syncMuteButton();
            state.credits.forEach((_, index) => {
                renderCredits(index);
                renderMarks(index);
            });
            renderStats();
            renderHistory();
            goIdle();
        }

        init();

        return {
            state,
            updateDisplay,
            formatMoney,
            goIdle,
            goPlaying
        };
    }

    global.createInsuranceMachine = createInsuranceMachine;
})(window);
