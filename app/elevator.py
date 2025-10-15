import time
from typing import Dict


class Elevator:
    def __init__(self, name, passengers_pool, log_pool, motorLock=None, sync_mode=True):
        self.name = name
        self.current_floor = 0
        self.target_floor = 0
        self.moving = False
        self.direction = "stopped"
        self.passengers_pool = passengers_pool  # pool compartilhado
        self.log_pool = log_pool  # log compartilhado
        self.current_passenger = None
        self.motorLock = motorLock
        self.sync_mode = sync_mode

    def useMotor(self, destinys) -> None:
        """Recurso compartilhado entre os elevadores"""

        for destiny in destinys:
            while self.current_floor != destiny:
                if self.current_floor < destiny:
                    self.move_up()
                elif self.current_floor > destiny:
                    self.move_down()
                time.sleep(1)

    def elevator_thread(self) -> None:
        while True:

            if self.current_floor > 0:
                self.useMotor([0])

            self.direction = "stopped"
            self.target_floor = self.current_floor

            passenger = None
            for p in self.passengers_pool:
                if (
                    not p["in_elevator"]
                    and not p["is_arrived"]
                    and p["current_floor"] == 0
                ):
                    passenger = p
                    break

            if passenger:
                self._transport_passenger(passenger)
            else:
                if all(p["is_arrived"] for p in self.passengers_pool):
                    self.direction = "stopped"
                    self.log_pool.append(f"Elevador {self.name} finalizou.")
                    time.sleep(1)
                    raise SystemExit
                time.sleep(1)

    def _transport_passenger(self, passenger) -> None:
        """Ciclo completo:
        Leva o passageiro ao andar destino e retorna"""

        passenger["in_elevator"] = True
        passenger["current_floor"] = self.current_floor
        target = passenger["destiny_floor"]
        self.target_floor = target

        self.log_pool.append(
            f"Elevador {self.name} pegou {passenger['name']} no térreo e vai para {target}"
        )

        if self.sync_mode and self.motorLock:  # Modo sincronismo
            self.log_pool.append(f"Elevador {self.name} aguardando motor")
            with self.motorLock:
                self.log_pool.append(f"Elevador {self.name} usando o motor")

                self.useMotor([target])
                time.sleep(1)

                passenger["in_elevator"] = False
                passenger["current_floor"] = target
                passenger["is_arrived"] = True
                self.current_floor = target
                self.target_floor = self.current_floor
                self.log_pool.append(
                    f"Elevador {self.name} deixou {passenger['name']} no andar {target}"
                )

                self.useMotor([0])
                self.current_floor = 0
                self.target_floor = 0
                self.direction = "stopped"
                self.log_pool.append(
                    f"Elevador {self.name} retornou ao térreo e liberou o motor"
                )
                time.sleep(2)
        else:  # Modo sem sincronismo
            self.useMotor([target])
            passenger["in_elevator"] = False
            passenger["current_floor"] = target
            passenger["is_arrived"] = True
            self.useMotor([0])

    def get_state(self) -> Dict:
        return {
            "name": self.name,
            "current_floor": self.current_floor,
            "target_floor": self.target_floor,
            "moving": self.moving,
            "direction": self.direction,
        }

    def move_down(self) -> None:
        self.current_floor -= 1
        self.direction = "down"

    def move_up(self) -> None:
        self.current_floor += 1
        self.direction = "up"
