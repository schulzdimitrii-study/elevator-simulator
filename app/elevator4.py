import json
import time

class Elevator:
    def __init__(self, name, passengers_pool, log_pool):
        self.name = name
        self.current_floor = 0
        self.target_floor = 0
        self.moving = False
        self.direction = 'stopped'
        self.passengers_pool = passengers_pool  # pool compartilhado
        self.log_pool = log_pool  # log compartilhado
        self.current_passenger = None

    def elevator_thread(self):
        while True:
            # retorna se não estiver no 0
            if self.current_floor > 0:
                self.target_floor = 0
            while self.current_floor > 0:
                self.move_down()
                time.sleep(1)
            self.direction = "stopped"
            self.target_floor = self.current_floor

            # verifica passageiro esperando no 0
            passenger = None
            for p in self.passengers_pool:
                if not p["in_elevator"] and not p["is_arrived"] and p["current_floor"] == 0:
                    passenger = p
                    break

            if passenger:
                passenger["in_elevator"] = True
                passenger["current_floor"] = self.current_floor
                target = passenger["destiny_floor"]
                self.target_floor = target
                pause = 1

                # leva o passageiro
                while self.current_floor != target:
                    if self.current_floor < target:
                        self.move_up()
                    elif self.current_floor > target:
                        self.move_down()
                    passenger["current_floor"] = self.current_floor
                    time.sleep(pause)

                time.sleep(1)
                passenger["in_elevator"] = False
                passenger["current_floor"] = target
                passenger["is_arrived"] = True
                self.current_floor = target
                self.target_floor = self.current_floor
                self.log_pool.append(f"Elevador {self.name} deixou {passenger['name']} no andar {target}")
                self.direction = "stopped"
                time.sleep(2)
            else:
                self.target_floor = self.current_floor
                if all(p["is_arrived"] for p in self.passengers_pool):
                    self.direction = "stopped"
                    self.log_pool.append(f"Elevador {self.name} finalizou.")
                    break
                time.sleep(1)

    def get_state(self):
        return {
            "name": self.name,
            "current_floor": self.current_floor,
            "target_floor": self.target_floor,
            "moving": self.moving,
            "direction": self.direction,
        }

    def move_down(self):
        self.current_floor -= 1
        self.direction = "down"

    def move_up(self):
        self.current_floor += 1
        self.direction = "up"

def load_passengers():
    with open("passengers.json", "r", encoding="utf-8") as f:
        passengers = json.load(f)
    for p in passengers:
        p["in_elevator"] = False
        p["current_floor"] = 0
        p["is_arrived"] = False
    return passengers

passengers_pool = load_passengers()
log_pool = []
elevator1 = Elevator("A", passengers_pool, log_pool)
elevator2 = Elevator("B", passengers_pool, log_pool)
elevator3 = Elevator("C", passengers_pool, log_pool)
elevator4 = Elevator("D", passengers_pool, log_pool)
