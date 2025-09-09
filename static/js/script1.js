
document.addEventListener('DOMContentLoaded', function() {
    // Cronômetro
    let timer = 0;
    let timerInterval = null;
    let timerRunning = false;
    const buildingEl = document.getElementById('building');
    const elevatorEl = document.getElementById('elevator');
    const floorDisplayEl = document.getElementById('floor-display');
    const directionDisplayEl = document.getElementById('direction-display');
    const elevatorStatusEl = document.getElementById('elevator-status');
    const eventLogEl = document.getElementById('event-log');
    const peopleListEl = document.getElementById('people-list');
    // Configuração
    const totalFloors = 10;
    const API_BASE = 'http://localhost:8080/api1';
    let people = [];
    let elevator = {
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
        // Cronômetro: inicia quando sai do 0, para quando volta ao 0
        if (data.current_floor !== 0 && !timerRunning) {
            timerRunning = true;
            timerInterval = setInterval(() => {
                timer++;
                updateTimerDisplay();
            }, 1000);
        }
        if (data.current_floor === 0 && timerRunning) {
            timerRunning = false;
            clearInterval(timerInterval);
        }
        updateTimerDisplay();
        function updateTimerDisplay() {
            const timerDisplayEl = document.getElementById('timer-display');
            const min = String(Math.floor(timer / 60)).padStart(2, '0');
            const sec = String(timer % 60).padStart(2, '0');
            timerDisplayEl.textContent = `${min}:${sec}`;
        }
        // Atualizar estado do elevador
        elevator = {
            currentFloor: data.current_floor,
            targetFloor: data.target_floor,
            moving: data.moving,
            direction: data.direction
        };
        // Atualizar pessoas
        people = data.people;
        // Quadrado do elevador anima suavemente entre andares
        const currentFloor = elevator.currentFloor;
        const targetBottom = currentFloor * 60;
        if (Math.abs((parseInt(elevatorEl.style.bottom) || 0) - targetBottom) > 1) {
            elevatorEl.style.transition = `bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)`;
            elevatorEl.style.bottom = `${targetBottom}px`;
            lastAnimatedFloor = currentFloor;
        }
        elevatorEl.textContent = "";
        // Painel mostra sempre o andar atual do backend
        floorDisplayEl.textContent = elevator.currentFloor;
        // Atualizar direção
        if (elevator.direction === 'up') {
            directionDisplayEl.textContent = '▲';
            elevatorStatusEl.textContent = `Subindo para o andar ${elevator.targetFloor}`;
        } else if (elevator.direction === 'down') {
            directionDisplayEl.textContent = '▼';
            elevatorStatusEl.textContent = `Descendo para o andar ${elevator.targetFloor}`;
        } else {
            directionDisplayEl.textContent = '■';
            elevatorStatusEl.textContent = `Parado no andar ${elevator.currentFloor}`;
        }
        // Atualizar visualização das pessoas
        updateBuilding();
        // Atualizar lista de pessoas
        updatePeopleList();
        // Atualizar log
    updateLog(Array.isArray(data.log) ? data.log : []);
    }
    // Atualizar visualização do prédio
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