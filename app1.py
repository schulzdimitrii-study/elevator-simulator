from flask import Flask, jsonify, render_template
from flask_cors import CORS
import threading
import webbrowser
from app.elevator import elevator

app = Flask(__name__, template_folder='templates')
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/state', methods=['GET'])
def get_state():
    resp_data = elevator.get_state()
    resp_data["people"] = elevator.passengers

    target = None
    for passenger in elevator.passengers:
        if passenger.get("in_elevator"):
            target = passenger.get("destiny_floor")
            break
        
    if target is not None:
        resp_data["target_floor"] = target
    elif not any(p.get("in_elevator") for p in elevator.passengers):
        resp_data["target_floor"] = 0
    elif elevator.passengers:
        resp_data["target_floor"] = elevator.passengers[0]["destiny_floor"]
    resp = jsonify(resp_data)
    
    return resp

@app.route('/api/reset', methods=['POST'])
def reset():
    elevator.current_floor = 0
    elevator.target_floor = 0
    elevator.moving = False
    elevator.direction = "stopped"
    elevator.passengers = elevator.load_passengers()
    elevator.log = []

    return jsonify({"message": "Simulation Reset"})

@app.route('/api/start', methods=['POST'])
def start():
    elevator.log.append("Simulação iniciada")
    threading.Thread(target=elevator.elevator_thread, daemon=True).start()
    
    return jsonify({"message": "Simulation Started"})

if __name__ == "__main__":
    threading.Timer(1.5, lambda: webbrowser.open("http://localhost:8080"))
    app.run(port=8080)