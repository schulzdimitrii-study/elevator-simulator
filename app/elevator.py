class Elevator:
    def __init__(self):
        self.current_floor = 0
        self.target_floor = 0
        self.moving = False
        self.direction = 'stopped'

elevator = Elevator()