
document.addEventListener('DOMContentLoaded', function() {
    let timer = 0;
    let timerInterval = null;
    let timerRunning = false;
    let simulationStarted = false;
    const buildingEl = document.getElementById('building');
    const elevatorAEl = document.getElementById('elevatorA');
    const elevatorBEl = document.getElementById('elevatorB');
    const floorDisplayAEl = document.getElementById('floor-display');
    const directionDisplayAEl = document.getElementById('direction-display-A');
    const elevatorStatusAEl = document.getElementById('elevator-status-A');
    const floorDisplayBEl = document.getElementById('floor-display-B');
    const directionDisplayBEl = document.getElementById('direction-display-B');
    const elevatorStatusBEl = document.getElementById('elevator-status-B');
    const eventLogEl = document.getElementById('event-log');
    const peopleListEl = document.getElementById('people-list');

    const totalFloors = 10;
    const API_BASE = 'http://localhost:8080/api2';

    let people = [];
    let elevatorA = {
        currentFloor: 0,
        targetFloor: 0,
        moving: false,
        direction: 'stopped'
    };
    let elevatorB = {
        currentFloor: 0,
        targetFloor: 0,
        moving: false,
        direction: 'stopped'
    };
    // Inicializar a construção
    function initializeBuilding() {
        buildingEl.innerHTML = '';
        // Criar andares (do mais alto para o mais baixo)
        for (let floor = totalFloors - 1; floor >= 0; floor--) {
            const floorEl = document.createElement('div');
            floorEl.className = 'floor';
            floorEl.id = `floor-${floor}`;
            const floorLabel = document.createElement('span');
            floorLabel.className = 'floor-label';
            floorLabel.textContent = `Andar ${floor}`;
            const peopleContainer = document.createElement('div');
            peopleContainer.className = 'floor-people';
            peopleContainer.id = `people-${floor}`;
            floorEl.appendChild(floorLabel);
            floorEl.appendChild(peopleContainer);
            buildingEl.appendChild(floorEl);
        }
    }
    // Atualizar a visualização com base nos dados do backend
    function updateView(data) {
        // Atualizar estado dos elevadores
        const elevA = data.elevators[0];
        const elevB = data.elevators[1];
        elevatorA = elevA;
        elevatorB = elevB;
        // Animar elevador A
        const targetBottomA = elevatorA.current_floor * 60;
        if (Math.abs((parseInt(elevatorAEl.style.bottom) || 0) - targetBottomA) > 1) {
            elevatorAEl.style.transition = `bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)`;
            elevatorAEl.style.bottom = `${targetBottomA}px`;
        }
        elevatorAEl.textContent = "A";
        floorDisplayAEl.textContent = elevatorA.current_floor;
        if (elevatorA.direction === 'up') {
            directionDisplayAEl.textContent = '▲';
            elevatorStatusAEl.textContent = `Subindo para o andar ${elevatorA.target_floor}`;
        } else if (elevatorA.direction === 'down') {
            directionDisplayAEl.textContent = '▼';
            elevatorStatusAEl.textContent = `Descendo para o andar ${elevatorA.target_floor}`;
        } else {
            directionDisplayAEl.textContent = '■';
            elevatorStatusAEl.textContent = `Parado no andar ${elevatorA.current_floor}`;
        }
        // Animar elevador B
        const targetBottomB = elevatorB.current_floor * 60;
        if (Math.abs((parseInt(elevatorBEl.style.bottom) || 0) - targetBottomB) > 1) {
            elevatorBEl.style.transition = `bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)`;
            elevatorBEl.style.bottom = `${targetBottomB}px`;
        }
        elevatorBEl.textContent = "B";
        floorDisplayBEl.textContent = elevatorB.current_floor;
        if (elevatorB.direction === 'up') {
            directionDisplayBEl.textContent = '▲';
            elevatorStatusBEl.textContent = `Subindo para o andar ${elevatorB.target_floor}`;
        } else if (elevatorB.direction === 'down') {
            directionDisplayBEl.textContent = '▼';
            elevatorStatusBEl.textContent = `Descendo para o andar ${elevatorB.target_floor}`;
        } else {
            directionDisplayBEl.textContent = '■';
            elevatorStatusBEl.textContent = `Parado no andar ${elevatorB.current_floor}`;
        }

        // Cronômetro global: inicia quando a simulação começa, para quando ambos elevadores finalizarem
    if (!simulationStarted && Array.isArray(data.log) && data.log.length > 0 && typeof data.log[0] === 'string' && data.log[0].includes("Simulação iniciada")) {
        simulationStarted = true;
        timerRunning = true;
        timerInterval = setInterval(() => {
            timer++;
            updateTimerDisplay();
        }, 1000);
    }
    // Verifica se ambos elevadores finalizaram
    if (simulationStarted && data.log && data.log.some(l => l.includes("Elevador A finalizou.")) && data.log.some(l => l.includes("Elevador B finalizou."))) {
        if (timerRunning) {
            timerRunning = false;
            clearInterval(timerInterval);
        }
    }
    updateTimerDisplay();
    function updateTimerDisplay() {
        const min = String(Math.floor(timer / 60)).padStart(2, '0');
        const sec = String(timer % 60).padStart(2, '0');
        document.getElementById('timer-display').textContent = `${min}:${sec}`;
    }
        // Atualizar pessoas
        people = data.passengers;
        updateBuilding();
        updateLog(data.log);
    }

    function updateBuilding() {
        // Limpar todas as pessoas
        for (let floor = 0; floor < totalFloors; floor++) {
            const peopleContainer = document.getElementById(`people-${floor}`);
            peopleContainer.innerHTML = '';
        }
        // Adicionar pessoas ao andar 0 no início, depois no destino
        people.forEach(person => {
            let showFloor = null;
            // Se ainda não chegou ao destino e não está no elevador, está no andar 0
            if (!person.in_elevator && person.current_floor === 0) {
                showFloor = 0;
            }
            // Se já chegou ao destino, aparece no andar destino
            if (!person.in_elevator && person.current_floor === person.destiny_floor) {
                showFloor = person.destiny_floor;
            }
            if (showFloor !== null) {
                const peopleContainer = document.getElementById(`people-${showFloor}`);
                const personEl = document.createElement('div');
                personEl.className = 'person';
                personEl.textContent = person.destiny_floor;
                personEl.title = `Pessoa ${person.name} → Andar ${person.destiny_floor}`;
                peopleContainer.appendChild(personEl);
            }
        });
    }
    // Atualizar lista de pessoas (bolinhas)
    function updatePeopleList() {
        peopleListEl.innerHTML = '';
        people.forEach(person => {
            // Só mostra bolinha se está no andar 0 e não está no elevador nem chegou ao destino
            if (!person.in_elevator && person.current_floor === 0) {
                const personBall = document.createElement('div');
                personBall.className = 'person';
                personBall.textContent = person.destiny_floor;
                personBall.title = `Pessoa ${person.name} → Andar ${person.destiny_floor}`;
                peopleListEl.appendChild(personBall);
            }
        });
    }
    // Atualizar log de eventos
    function updateLog(logEntries) {
        // Manter as últimas entradas apenas para não sobrecarregar a interface
        const recentEntries = logEntries.slice(-15);
        eventLogEl.innerHTML = '';
        recentEntries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = entry;
            eventLogEl.appendChild(logEntry);
        });
        eventLogEl.scrollTop = eventLogEl.scrollHeight;
    }
    // Reiniciar o sistema
    async function resetSystem() {
        try {
            const response = await fetch(`${API_BASE}/reset`, {
                method: 'POST'
            });
            if (response.ok) {
            } else {
                throw new Error('Falha ao reiniciar sistema');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }
    // Iniciar simulação automática
    async function startAuto() {
        try {
            const response = await fetch(`${API_BASE}/start`, {
                method: 'POST'
            });
            if (response.ok) {
            } else {
                throw new Error('Falha ao iniciar simulação automática');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }
    // Buscar estado atual do backend
    async function fetchState() {
        try {
            const response = await fetch(`${API_BASE}/state`);

            if (response.ok) {
                const data = await response.json();

                updateView(data);
            } else {
                throw new Error('Falha ao buscar estado');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }
    // Event Listeners
    document.getElementById('start-auto-btn').addEventListener('click', startAuto);
    document.getElementById('reset-btn').addEventListener('click', resetSystem);
    // Adiciona pessoas automaticamente ao iniciar a simulação

    // Após reset, sempre adiciona passageiros e inicia simulação automaticamente
    document.getElementById('reset-btn').addEventListener('click', async function() {
        await resetSystem();
        timer = 0;
        timerRunning = false;
        clearInterval(timerInterval);
        const timerDisplayEl = document.getElementById('timer-display');
        timerDisplayEl.textContent = '00:00';
    });

    initializeBuilding();
    setInterval(fetchState, 200);
    fetchState();
});