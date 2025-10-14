from typing import List, Dict
import json
import threading
from app.elevator import Elevator
from app import simulation

class Simulation:
    def __init__(self):
        self.simulations = {}
        self.ELEVATOR_NAME_MAP = {
            1: ["A"],
            2: ["A", "B"],
            4: ["A", "B", "C", "D"],
        }
    
        # Estrutura: simulations[sim_id] = {
        #   'passengers': [...],
        #   'log': [...],
        #   'elevators': [Elevator,...],
        #   'started': bool
        # }
    
    def load_passengers(self, sort_by_priority: bool) -> List:
        with open("passengers.json", "r", encoding="utf-8") as f:
            passengers = json.load(f)

        if sort_by_priority:
            passengers.sort(key=lambda p: p['priority']['level'])
        else:
            passengers.sort(key=lambda p: p['destiny_floor'])
        
        for p in passengers:
            p["in_elevator"] = False
            p["current_floor"] = 0
            p["is_arrived"] = False
        return passengers
    
    def ensure_simulation(self, sim_id: int, sort_by_priority: bool = True, sync_mode: bool = True) -> Dict:
        return self.simulations.setdefault(sim_id, self._create_simulation(sim_id, sort_by_priority, sync_mode))

    def _create_simulation(self, sim_id: int, sort_by_priority: bool, sync_mode: bool) -> Dict:
        names = self.ELEVATOR_NAME_MAP.get(sim_id)
        if not names:
            raise ValueError(f"Simulação {sim_id} não configurada")
        
        passengers = self.load_passengers(sort_by_priority)
        log = []
        motorLock = threading.Lock()
        elevators = [Elevator(name, passengers, log, motorLock, sync_mode) for name in names]
        
        return {
            "passengers": passengers,
            "log": log,
            "elevators": elevators,
            "started": False,
            "motorLock": motorLock,
            "sync_mode": sync_mode,
        }


    def reset_simulation(self, sim_id: int, sort_by_priority: bool = True, sync_mode: bool = True) -> Dict:
        """Reseta completamente a simulação (nova fila compartilhada & elevadores)."""
        names = self.ELEVATOR_NAME_MAP.get(sim_id)
        if not names:
            raise ValueError(f"Simulação {sim_id} não configurada")
        passengers = self.load_passengers(sort_by_priority)
        log = []
        motorLock = threading.Lock()
        elevators = [Elevator(name, passengers, log, motorLock, sync_mode) for name in names]
        self.simulations[sim_id] = {
            "passengers": passengers,
            "log": log,
            "elevators": elevators,
            "started": False,
            "motorLock": motorLock,
            "sync_mode": sync_mode,
        }
        return self.simulations[sim_id]


    def start_simulation(self, sim_id: int, sort_by_priority: bool, sync_mode: bool = True):
        simulation = self.ensure_simulation(sim_id, sort_by_priority, sync_mode)
        if not simulation["started"]:
            simulation["log"].append(f"Simulação iniciada (sincronismo: {'ON' if sync_mode else 'OFF'})")
            for elev in simulation["elevators"]:
                threading.Thread(target=elev.elevator_thread, daemon=True).start()
            simulation["started"] = True
        else:
            # Atualiza o modo de sincronismo dos elevadores existentes
            for elev in simulation["elevators"]:
                elev.sync_mode = sync_mode
            simulation["sync_mode"] = sync_mode
            simulation["log"].append(f"Modo de sincronismo alterado para: {'ON' if sync_mode else 'OFF'}")
        return simulation
    
    def get_simulation(self, sim_id: int) -> Dict:
        simulation = self.simulations.get(sim_id)
        if not simulation:
            raise ValueError(f"Simulação {sim_id} não encontrada")
        
        return self.simulations.get(sim_id)
        