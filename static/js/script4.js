document.addEventListener('DOMContentLoaded', function() {
    let timer = 0;
    let timerInterval = null;
    let timerRunning = false;
    let simulationStarted = false;
    const buildingEl = document.getElementById('building');
    const elevatorAEl = document.getElementById('elevatorA');
    const elevatorBEl = document.getElementById('elevatorB');
    const elevatorCEl = document.getElementById('elevatorC');
    const elevatorDEl = document.getElementById('elevatorD');
    const floorDisplayAEl = document.getElementById('floor-display-A');
    const directionDisplayAEl = document.getElementById('direction-display-A');
    const elevatorStatusAEl = document.getElementById('elevator-status-A');
    const floorDisplayBEl = document.getElementById('floor-display-B');
    const directionDisplayBEl = document.getElementById('direction-display-B');
    const elevatorStatusBEl = document.getElementById('elevator-status-B');
    const floorDisplayCEl = document.getElementById('floor-display-C');
    const directionDisplayCEl = document.getElementById('direction-display-C');
    const elevatorStatusCEl = document.getElementById('elevator-status-C');
    const floorDisplayDEl = document.getElementById('floor-display-D');
    const directionDisplayDEl = document.getElementById('direction-display-D');
    const elevatorStatusDEl = document.getElementById('elevator-status-D');
    const eventLogEl = document.getElementById('event-log');
    const peopleListEl = document.getElementById('people-list');
    const totalFloors = 10;
    const API_BASE = 'http://localhost:8080/api4';
    let people = [];
    let elevators = [
        { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' },
        { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' },
        { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' },
        { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' }
    ];
    function initializeBuilding() {
        buildingEl.innerHTML = '';
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
    function updateView(data) {
        elevators = data.elevators;
        // Animar elevadores
        [elevatorAEl, elevatorBEl, elevatorCEl, elevatorDEl].forEach((el, idx) => {
            const targetBottom = elevators[idx].current_floor * 60;
            if (Math.abs((parseInt(el.style.bottom) || 0) - targetBottom) > 1) {
                el.style.transition = `bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)`;
                el.style.bottom = `${targetBottom}px`;
            }
        });
        elevatorAEl.textContent = "A";
        elevatorBEl.textContent = "B";
        elevatorCEl.textContent = "C";
        elevatorDEl.textContent = "D";
        floorDisplayAEl.textContent = elevators[0].current_floor;
        floorDisplayBEl.textContent = elevators[1].current_floor;
        floorDisplayCEl.textContent = elevators[2].current_floor;
        floorDisplayDEl.textContent = elevators[3].current_floor;
        // Direção e status
        [directionDisplayAEl, directionDisplayBEl, directionDisplayCEl, directionDisplayDEl].forEach((dirEl, idx) => {
            if (elevators[idx].direction === 'up') dirEl.textContent = '▲';
            else if (elevators[idx].direction === 'down') dirEl.textContent = '▼';
            else dirEl.textContent = '■';
        });
        [elevatorStatusAEl, elevatorStatusBEl, elevatorStatusCEl, elevatorStatusDEl].forEach((statusEl, idx) => {
            if (elevators[idx].direction === 'up') statusEl.textContent = `Subindo para o andar ${elevators[idx].target_floor}`;
            else if (elevators[idx].direction === 'down') statusEl.textContent = `Descendo para o andar ${elevators[idx].target_floor}`;
            else statusEl.textContent = `Parado no andar ${elevators[idx].current_floor}`;
        });
        // Cronômetro
        if (!simulationStarted && Array.isArray(data.log) && data.log.length > 0 && typeof data.log[0] === 'string' && data.log[0].includes("Simulação iniciada")) {
            simulationStarted = true;
            timerRunning = true;
            timerInterval = setInterval(() => {
                timer++;
                updateTimerDisplay();
            }, 1000);
        }
        if (simulationStarted && data.log && data.log.filter(l => l.includes("finalizou.")).length === 4) {
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
        // Pessoas
        people = data.passengers;
        updateBuilding();
        updateLog(data.log);
    }
    function updateBuilding() {
        for (let floor = 0; floor < totalFloors; floor++) {
            const peopleContainer = document.getElementById(`people-${floor}`);
            peopleContainer.innerHTML = '';
        }
        people.forEach(person => {
            let showFloor = null;
            if (!person.in_elevator && person.current_floor === 0) showFloor = 0;
            if (!person.in_elevator && person.current_floor === person.destiny_floor) showFloor = person.destiny_floor;
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
    function updateLog(logEntries) {
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
    async function resetSystem() {
        try {
            const response = await fetch(`${API_BASE}/reset`, { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao reiniciar sistema');
        } catch (error) { console.error('Erro:', error); }
    }
    async function startAuto() {
        try {
            const response = await fetch(`${API_BASE}/start`, { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao iniciar simulação automática');
        } catch (error) { console.error('Erro:', error); }
    }
    async function fetchState() {
        try {
            const response = await fetch(`${API_BASE}/state`);
            if (response.ok) {
                const data = await response.json();
                updateView(data);
            } else {
                throw new Error('Falha ao buscar estado');
            }
        } catch (error) { console.error('Erro:', error); }
    }
    document.getElementById('start-auto-btn').addEventListener('click', startAuto);
    document.getElementById('reset-btn').addEventListener('click', async function() {
        await resetSystem();
        timer = 0;
        timerRunning = false;
        clearInterval(timerInterval);
        document.getElementById('timer-display').textContent = '00:00';
    });
    initializeBuilding();
    setInterval(fetchState, 200);
    fetchState();
});
