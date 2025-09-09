import json
import time

class Elevator:
    def __init__(self):
        self.current_floor = 0
        self.target_floor = 0
        self.moving = False
        self.direction = 'stopped'
        self.passengers = self.load_passengers()
        self.log = []

    @classmethod
    def load_passengers(cls):
        with open("passengers.json", "r", encoding="utf-8") as f:
            passengers = json.load(f)

        for p in passengers:
            p["in_elevator"] = False
            
        return passengers

    def elevator_thread(self):
        global first_run
        first_run = True
        returning_to_zero = False
        while True:
            if first_run and self.passengers:
                first_run = False
                time.sleep(1)

                for passenger in self.passengers:
                    passenger["in_elevator"] = True
                continue
            
            if any(p["in_elevator"] for p in self.passengers):
                next_idx = None
                for idx, passenger in enumerate(self.passengers):
                    if passenger["in_elevator"]:
                        next_idx = idx
                        break
                    
                if next_idx is not None:
                    passenger = self.passengers[next_idx]
                    target = passenger["destiny_floor"]
                    
                    if self.current_floor < target:
                        self.move_up()
                        pause = 1
                        
                    elif self.current_floor > target:
                        self.move_down()
                        pause = 1
                        
                    else:
                        time.sleep(1)
                        passenger["in_elevator"] = False
                        self.current_floor = target
                        self.log.append(f"Elevador levou {passenger['name']} ao andar {target}")
                        self.direction = "stopped"
                        pause = 2
                else:
                    pause = 1
            elif not any(p["in_elevator"] for p in self.passengers):
                if self.current_floor > 0:
                    self.move_down()
                    returning_to_zero = True
                    
                elif self.current_floor < 0:
                    self.move_up()
                    pause = 1
                    returning_to_zero = True
                    
                elif self.current_floor == 0 and returning_to_zero:
                    self.direction = "stopped"
                    self.passengers["log"].append("Simulação finalizada. Elevador voltou ao térreo.")
                    returning_to_zero = False
                    pause = 1
                else:
                    pause = 1
                    
            else:
                self.direction = "stopped"
                pause = 1
            time.sleep(pause)
            
    def get_state(self):
        return {
            "current_floor": self.current_floor,
            "target_floor": self.target_floor,
            "moving": self.moving,
            "direction": self.direction,
            "passengers": self.passengers,
            "log": self.log
        }
        
    def move_down(self):
        self.current_floor -= 1
        self.direction = "down"
        
    def move_up(self):
        self.current_floor += 1
        self.direction = "up"
        
        
elevator = Elevator()