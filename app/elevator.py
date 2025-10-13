
import time
import threading

class Elevator:
    def __init__(self, name, passengers_pool, log_pool, duct_lock=None, sync_mode=True):
        self.name = name
        self.current_floor = 0
        self.target_floor = 0
        self.moving = False
        self.direction = 'stopped'
        self.passengers_pool = passengers_pool  # pool compartilhado
        self.log_pool = log_pool  # log compartilhado
        self.current_passenger = None
        self.duct_lock = duct_lock
        self.sync_mode = sync_mode

    def useDuct(self, destinys):
        """
        Simula o uso do duto para ir até os andares em destinos.
        Se sync_mode=True, usa o lock (sincronismo). Se False, não usa lock (condição de corrida).
        """
        if self.sync_mode and self.duct_lock:
            with self.duct_lock:
                self.log_pool.append(f"Elevador {self.name} entrou no duto (sincronizado) para {destinys}")
                self.moveToDestiny(destinys)
                self.log_pool.append(f"Elevador {self.name} saiu do duto (sincronizado)")
        else:
            self.log_pool.append(f"Elevador {self.name} entrou no duto (NÃO sincronizado) para {destinys}")
            self.moveToDestiny(destinys)
            self.log_pool.append(f"Elevador {self.name} saiu do duto (NÃO sincronizado)")

    def moveToDestiny(self, destinys):
        for destiny in destinys:
            while self.current_floor != destiny:
                if self.current_floor < destiny:
                    self.move_up()
                elif self.current_floor > destiny:
                    self.move_down()
                time.sleep(1)

    def elevator_thread(self):
        while True:
            # retorna se não estiver no terreo
            if self.current_floor > 0:
                self.target_floor = 0
                self.useDuct([0])

            self.direction = "stopped"
            self.target_floor = self.current_floor

            # Procurar passageiro esperando no térreo
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

                # leva o passageiro ao destiny usando o duto
                self.useDuct([target])
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
                # Nenhum passageiro esperando no térreo
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
