document.addEventListener('DOMContentLoaded', () => {
  let timer = 0;
  let timerInterval = null;
  let timerRunning = false;
  let simulationStarted = false;
  let people = [];

  const totalFloors = 10;
  const FLOOR_HEIGHT_PX = 60;
  const buildingEl = document.getElementById('building');
  const eventLog = document.getElementById('event-log');

  const simMatch = window.location.pathname.match(/simulation_(\d+)/);
  const simId = simMatch ? simMatch[1] : '1';

  // Endpoints do backend
  const API = {
    state: `/api/state_${simId}`,
    start: `/api/start_${simId}`,
    reset: `/api/reset_${simId}`
  };

  // Mapeia elevadores do DOM
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const elevatorElements = Array.from(document.querySelectorAll('.elevator'));

  function pickElement(letter, baseId) {
    const specific = document.getElementById(`${baseId}-${letter}`);

    if (specific) return specific;
    if (letter === 'A') return document.getElementById(baseId);

    return null;
  }

  const elevatorsUI = elevatorElements.map((el, idx) => {
    const letter = LETTERS[idx];

    return {
      letter,
      carEl: el,
      floorEl: pickElement(letter, 'floor-display'),
      directionEl: pickElement(letter, 'direction-display'),
      statusEl: pickElement(letter, 'elevator-status'),
      state: { current_floor: 0, target_floor: 0, moving: false, direction: 'stopped' }
    };
  });

  // Funções de UI
  function initializeBuilding() {
    if (!buildingEl) return;

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

  function animateCar(carEl, currentFloor) {
    const targetBottom = (currentFloor || 0) * FLOOR_HEIGHT_PX;
    const currentBottom = parseInt(carEl.style.bottom || '0', 10) || 0;

    if (Math.abs(currentBottom - targetBottom) > 1) {
      carEl.style.transition = 'bottom 0.5s cubic-bezier(0.4,0,0.2,1)';
      carEl.style.bottom = `${targetBottom}px`;
    }
  }

  function paintElevatorUI(elev) {
    const { carEl, floorEl, directionEl, statusEl, state, letter } = elev;

    if (!carEl) return;
    animateCar(carEl, state.current_floor);
    carEl.textContent = elevatorsUI.length > 1 ? letter : '';

    if (floorEl) floorEl.textContent = state.current_floor;

    if (directionEl && statusEl) {
      if (state.direction === 'up') {
        directionEl.textContent = '▲';
        statusEl.textContent = `Subindo para o andar ${state.target_floor}`;
      } else if (state.direction === 'down') {
        directionEl.textContent = '▼';
        statusEl.textContent = `Descendo para o andar ${state.target_floor}`;
      } else {
        directionEl.textContent = '■';
        statusEl.textContent = `Parado no andar ${state.current_floor}`;
      }
    }
  }

  function updateTimerDisplay() {
    const min = String(Math.floor(timer / 60)).padStart(2, '0');
    const sec = String(timer % 60).padStart(2, '0');
    const timerDisplay = document.getElementById('timer-display');

    if (timerDisplay) timerDisplay.textContent = `${min}:${sec}`;
  }

  function updateBuilding() {
    for (let f = 0; f < totalFloors; f++) {
      const pc = document.getElementById(`people-${f}`);
      if (pc) pc.innerHTML = '';
    }

    people.forEach(p => {
      let show = null;
      if (!p.in_elevator && p.current_floor === 0) show = 0;
      if (!p.in_elevator && p.current_floor === p.destiny_floor) show = p.destiny_floor;

      if (show !== null) {
        const container = document.getElementById(`people-${show}`);

        if (container) {
          const div = document.createElement('div');
          div.className = 'person';
          div.textContent = p.destiny_floor;
          div.title = `Pessoa ${p.name} → Andar ${p.destiny_floor}`;
          container.appendChild(div);
        }
      }
    });
  }

  function updateLog(logEntries) {
    if (!eventLog) return;
    const recent = (logEntries || []).slice(-50);
    eventLog.innerHTML = '';

    recent.forEach(txt => {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.textContent = txt;
      eventLog.appendChild(div);
    });
  }

  function updateView(data) {
    // Normaliza formato de estado dos elevadores
    let elevatorsState = [];

    if (Array.isArray(data.elevators)) {
      elevatorsState = data.elevators;
    } else if (typeof data.current_floor !== 'undefined') {
      // Simulação 1
      elevatorsState = [{
        current_floor: data.current_floor,
        target_floor: data.target_floor,
        moving: data.moving,
        direction: data.direction
      }];
    }

    elevatorsUI.forEach((ui, i) => {
      if (elevatorsState[i]) ui.state = { ...ui.state, ...elevatorsState[i] };
      paintElevatorUI(ui);
    });

    const logs = Array.isArray(data.log) ? data.log : [];
    const startedByLog = logs.some(l => typeof l === 'string' && l.includes('Simulação iniciada'));
    const firstElev = elevatorsUI[0];

    if (!simulationStarted && (startedByLog || (firstElev && firstElev.state.current_floor !== 0))) {
      simulationStarted = true;

      if (!timerRunning) {
        timerRunning = true;
        timerInterval = setInterval(() => { timer++; updateTimerDisplay(); }, 1000);
      }
    }

    if (simulationStarted) {
      const needed = elevatorsUI.map(e => `Elevador ${e.letter} finalizou.`);
      const allFinishedLog = needed.length > 0 && needed.every(m => logs.some(l => typeof l === 'string' && l.includes(m)));
      const singleFallback = (elevatorsUI.length === 1 && firstElev.state.current_floor === 0 && firstElev.state.direction === 'stopped');

      if ((allFinishedLog || singleFallback) && timerRunning) {
        timerRunning = false;
        clearInterval(timerInterval);
      }
    }
    updateTimerDisplay();

    people = data.passengers || data.people || [];
    updateBuilding();
    updateLog(logs);
  }

  // Ações

  function getSyncMode() {
    const select = document.getElementById('sync-mode-select');
    return select ? select.value : 'on';
  }

  function getSortMode() {
    const select = document.getElementById('sort-mode-select');
    return select.value; 
  }

  async function resetSimulation() {
    try {
      const sync = getSyncMode();
      const sortByPriority = getSortMode();
      const resp = await fetch(API.reset + `?sync=${sync}&sort_by_priority=${sortByPriority}`, { method: 'POST' });
      if (!resp.ok) throw new Error('Falha ao resetar');
      timer = 0;
      timerRunning = false;
      clearInterval(timerInterval);
      simulationStarted = false;
      updateTimerDisplay();
    } catch (e) { console.error(e); }
  }

  async function startSimulation() {
    try {
      const sync = getSyncMode();
      const sortByPriority = getSortMode();
      const resp = await fetch(API.start + `?sync=${sync}&sort_by_priority=${sortByPriority}`, { method: 'POST' });
      if (!resp.ok) throw new Error('Falha ao iniciar');
    } catch (e) { console.error(e); }
  }

  async function fetchState() {
    try {
      const resp = await fetch(API.state);

      if (!resp.ok) throw new Error('Falha ao obter estado');
      const data = await resp.json();
      updateView(data);
    } catch (e) { console.error(e); }
  }

  // Init
  const startBtn = document.getElementById('start-auto-btn');
  const resetBtn = document.getElementById('reset-btn');

  if (startBtn) startBtn.addEventListener('click', startSimulation);
  if (resetBtn) resetBtn.addEventListener('click', resetSimulation);

  // Reset automático ao trocar o modo
  const syncSelect = document.getElementById('sync-mode-select');
  if (syncSelect) {
    syncSelect.addEventListener('change', () => {
      resetSimulation();
    });
  }

  const sortSelect = document.getElementById('sort-mode-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      resetSimulation();
    });
  }

  initializeBuilding();
  setInterval(fetchState, 200);
  fetchState();
});
