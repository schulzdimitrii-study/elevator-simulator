document.addEventListener('DOMContentLoaded', function () {
  // ======= CONFIG =======
  const totalFloors = 10;            // ajuste se quiser mais/menos andares
  const FLOOR_HEIGHT_PX = 60;        // altura visual de cada andar
  const API_BASE = 'http://localhost:8080/api4'; // usa endpoints /api4/* do backend:contentReference[oaicite:1]{index=1}

  // ======= ESTADO LOCAL =======
  let timer = 0;
  let timerInterval = null;
  let timerRunning = false;
  let simulationStarted = false;

  const buildingEl = document.getElementById('building');

  // 4 elevadores (DOM)
  const elevatorAEl = document.getElementById('elevatorA');
  const elevatorBEl = document.getElementById('elevatorB');
  const elevatorCEl = document.getElementById('elevatorC');
  const elevatorDEl = document.getElementById('elevatorD');

  // Displays A..D (mantive o id "floor-display" tradicional para o A)
  const floorDisplayAEl = document.getElementById('floor-display');
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

  // Pessoas / fallback de elevadores locais
  let people = [];
  let elevatorA = { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' };
  let elevatorB = { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' };
  let elevatorC = { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' };
  let elevatorD = { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' };

  // ======= BUILDING =======
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

  // ======= UI =======
  function animateCar(carEl, currentFloor) {
    const targetBottom = currentFloor * FLOOR_HEIGHT_PX;
    const currentBottom = parseInt(carEl.style.bottom || '0', 10) || 0;
    if (Math.abs(currentBottom - targetBottom) > 1) {
      carEl.style.transition = 'bottom 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
      carEl.style.bottom = `${targetBottom}px`;
    }
  }

  function paintElevatorUI(car, carEl, label, floorEl, dirEl, statusEl) {
    animateCar(carEl, car.current_floor);
    carEl.textContent = label;
    floorEl.textContent = car.current_floor;
    if (car.direction === 'up') {
      dirEl.textContent = '▲';
      statusEl.textContent = `Subindo para o andar ${car.target_floor}`;
    } else if (car.direction === 'down') {
      dirEl.textContent = '▼';
      statusEl.textContent = `Descendo para o andar ${car.target_floor}`;
    } else {
      dirEl.textContent = '■';
      statusEl.textContent = `Parado no andar ${car.current_floor}`;
    }
  }

  function updateTimerDisplay() {
    const min = String(Math.floor(timer / 60)).padStart(2, '0');
    const sec = String(timer % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${min}:${sec}`;
  }

  function updateBuilding() {
    // limpa pessoas em todos os andares
    for (let floor = 0; floor < totalFloors; floor++) {
      const peopleContainer = document.getElementById(`people-${floor}`);
      if (peopleContainer) peopleContainer.innerHTML = '';
    }
    // desenha pessoas (mesma lógica básica do seu projeto)
    people.forEach(person => {
      let showFloor = null;
      if (!person.in_elevator && person.current_floor === 0) showFloor = 0;
      if (!person.in_elevator && person.current_floor === person.destiny_floor) showFloor = person.destiny_floor;
      if (showFloor !== null) {
        const peopleContainer = document.getElementById(`people-${showFloor}`);
        if (peopleContainer) {
          const personEl = document.createElement('div');
          personEl.className = 'person';
          personEl.textContent = person.destiny_floor;
          personEl.title = `Pessoa ${person.name} → Andar ${person.destiny_floor}`;
          peopleContainer.appendChild(personEl);
        }
      }
    });
  }

  function updateLog(logEntries) {
    const recentEntries = (logEntries || []).slice(-50);
    eventLogEl.innerHTML = '';
    recentEntries.forEach(entry => {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.textContent = entry;
      eventLogEl.appendChild(logEntry);
    });
    eventLogEl.scrollTop = eventLogEl.scrollHeight;
  }

  // ======= BACKEND =======
  function updateView(data) {
    const arr = Array.isArray(data.elevators) ? data.elevators : [];
    elevatorA = arr[0] || elevatorA;
    elevatorB = arr[1] || elevatorB;
    elevatorC = arr[2] || elevatorC;
    elevatorD = arr[3] || elevatorD;

    paintElevatorUI(elevatorA, elevatorAEl, 'A', floorDisplayAEl, directionDisplayAEl, elevatorStatusAEl);
    paintElevatorUI(elevatorB, elevatorBEl, 'B', floorDisplayBEl, directionDisplayBEl, elevatorStatusBEl);
    paintElevatorUI(elevatorC, elevatorCEl, 'C', floorDisplayCEl, directionDisplayCEl, elevatorStatusCEl);
    paintElevatorUI(elevatorD, elevatorDEl, 'D', floorDisplayDEl, directionDisplayDEl, elevatorStatusDEl);

    // Início do cronômetro quando aparecer a mensagem "Simulação iniciada"
    if (!simulationStarted && Array.isArray(data.log) && data.log.some(l => typeof l === 'string' && l.includes('Simulação iniciada'))) {
      simulationStarted = true;
      timerRunning = true;
      timerInterval = setInterval(() => { timer++; updateTimerDisplay(); }, 1000);
    }

    // Para quando todos finalizarem (ajuste as strings se necessário)
    if (simulationStarted && Array.isArray(data.log)) {
      const finishedMarks = ['Elevador A finalizou.', 'Elevador B finalizou.', 'Elevador C finalizou.', 'Elevador D finalizou.'];
      const allFinished = finishedMarks.every(mark => data.log.some(l => typeof l === 'string' && l.includes(mark)));
      if (allFinished && timerRunning) {
        timerRunning = false;
        clearInterval(timerInterval);
      }
    }
    updateTimerDisplay();

    // pessoas + log
    people = data.passengers || [];
    updateBuilding();
    updateLog(data.log || []);
  }

  async function resetSystem() {
    try {
      const response = await fetch(`${API_BASE}/reset`, { method: 'POST' }); // /api4/reset:contentReference[oaicite:2]{index=2}
      if (!response.ok) throw new Error('Falha ao reiniciar sistema');
      // reseta cronômetro local
      timer = 0;
      timerRunning = false;
      clearInterval(timerInterval);
      document.getElementById('timer-display').textContent = '00:00';
      simulationStarted = false;
    } catch (err) {
      console.error('Erro:', err);
    }
  }

  async function startAuto() {
    try {
      const response = await fetch(`${API_BASE}/start`, { method: 'POST' }); // /api4/start:contentReference[oaicite:3]{index=3}
      if (!response.ok) throw new Error('Falha ao iniciar simulação automática');
    } catch (err) {
      console.error('Erro:', err);
    }
  }

  async function fetchState() {
    try {
      const response = await fetch(`${API_BASE}/state`); // /api4/state:contentReference[oaicite:4]{index=4}
      if (response.ok) {
        const data = await response.json();
        updateView(data);
      } else {
        throw new Error('Falha ao buscar estado');
      }
    } catch (err) {
      console.error('Erro:', err);
    }
  }

  // ======= EVENTOS / BOOT =======
  document.getElementById('start-auto-btn').addEventListener('click', startAuto);
  document.getElementById('reset-btn').addEventListener('click', resetSystem);

  initializeBuilding();
  setInterval(fetchState, 200); // pooling rápido para animação mais fluida
  fetchState();
});