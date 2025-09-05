import time

class Elevator:
    def __init__(self):
        self.current_floor = 0
        self.is_moving = False
        
    def move_up(self, passenger,  destiny_floor):
        self.is_moving = True
        while self.current_floor < destiny_floor:
            self.current_floor += 1
            print(f'Elevador subindo com o(a) {passenger} para o andar {self.current_floor}º')
            time.sleep(0.5)
        self.is_moving = False
        print(f'Elevador chegou ao {self.current_floor}º andar')
        time.sleep(1)
        
    def move_down(self):
        self.is_moving = True
        while self.current_floor > 0:
            print(f'Elevador descendo: {self.current_floor}º andar')
            self.current_floor -= 1
            time.sleep(0.5)
        self.is_moving = False
        print('Elevador chegou ao térreo')
        time.sleep(1)
    
elevator = Elevator()