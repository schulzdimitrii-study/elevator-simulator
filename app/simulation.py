import json
import threading
from app.elevator import Elevator

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
    
    def load_passengers(self):
        with open("passengers.json", "r", encoding="utf-8") as f:
            passengers = json.load(f)
        for p in passengers:
            p["in_elevator"] = False
            p["current_floor"] = 0
            p["is_arrived"] = False
        return passengers

    def ensure_simulation(self, sim_id: int, sync_mode: bool = True):
        """Garante que a simulação exista e retorna seu dicionário."""
        if sim_id not in self.simulations:
            names = self.ELEVATOR_NAME_MAP.get(sim_id)
            if not names:
                raise ValueError(f"Simulação {sim_id} não configurada")
            passengers = self.load_passengers()
            log = []
            duct_lock = threading.Lock()  # O duto compartilhado
            elevators = [Elevator(name, passengers, log, duct_lock, sync_mode) for name in names]
            self.simulations[sim_id] = {
                "passengers": passengers,
                "log": log,
                "elevators": elevators,
                "started": False,
                "duct_lock": duct_lock,
                "sync_mode": sync_mode,
            }
        return self.simulations[sim_id]


    def reset_simulation(self, sim_id: int, sync_mode: bool = True):
        """Reseta completamente a simulação (nova fila compartilhada & elevadores)."""
        names = self.ELEVATOR_NAME_MAP.get(sim_id)
        if not names:
            raise ValueError(f"Simulação {sim_id} não configurada")
        passengers = self.load_passengers()
        log = []
        duct_lock = threading.Lock()
        elevators = [Elevator(name, passengers, log, duct_lock, sync_mode) for name in names]
        self.simulations[sim_id] = {
            "passengers": passengers,
            "log": log,
            "elevators": elevators,
            "started": False,
            "duct_lock": duct_lock,
            "sync_mode": sync_mode,
        }
        return self.simulations[sim_id]


    def start_simulation(self, sim_id: int, sync_mode: bool = True):
        sim = self.ensure_simulation(sim_id, sync_mode)
        if not sim["started"]:
            sim["log"].append(f"Simulação iniciada (sincronismo: {'ON' if sync_mode else 'OFF'})")
            for elev in sim["elevators"]:
                threading.Thread(target=elev.elevator_thread, daemon=True).start()
            sim["started"] = True
        return sim
    