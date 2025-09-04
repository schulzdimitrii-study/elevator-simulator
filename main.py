import threading
import time
from src.passenger import Passenger
from src.elevator import elevator

lock = threading.Lock()

def run_elevator():
    passageiro1 = Passenger('João', 4)
    passageiro2 = Passenger('Maria', 6)
    passageiro3 = Passenger('Ana', 8)

    passengers = [passageiro1, passageiro2, passageiro3]
    
    while passengers:
        lock.acquire()
        boarding_passenger = passengers.pop(0)
        lock.release()
        
        elevator.move_up(boarding_passenger.name, boarding_passenger.destiny_floor)
        elevator.move_down()
        
def main():
    t1 = threading.Thread(target = (run_elevator))
    t2 = threading.Thread(target = (run_elevator))
    t3 = threading.Thread(target = (run_elevator))

    start_time = time.time()

    t1.start()
    t2.start()
    t3.start()

    t1.join()
    t2.join()
    t3.join()

    end_time = time.time()
    print ('tempo: ', end_time - start_time)

if __name__ == "__main__":
    main()