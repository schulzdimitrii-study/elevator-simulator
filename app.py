from flask import Flask, jsonify, render_template
import json
from flask_cors import CORS
import threading
import time

app = Flask(__name__, template_folder='templates')
CORS(app)

@app.route('/')
def index():
    return render_template('index.html')

def load_passengers():
    with open("passengers.json", "r", encoding="utf-8") as f:
        passengers = json.load(f)

    for p in passengers:
        p["current_floor"] = 0
        p["in_elevator"] = False
        
    return passengers

state = {
    "current_floor": 0,
    "target_floor": 0,
    "moving": False,
    "direction": "stopped",
    "passengers": load_passengers(),
    "log": [],
    "auto_mode": False
}

def elevator_thread():
    global first_run
    first_run = True
    returning_to_zero = False
    while True:
        if first_run and state.get("auto_mode") and state["passengers"]:
            first_run = False
            time.sleep(1)

            for passenger in state["passengers"]:
                passenger["in_elevator"] = True
            continue
        
        if state.get("auto_mode") and any(p["in_elevator"] for p in state["passengers"]):
            next_idx = None
            for idx, passenger in enumerate(state["passengers"]):
                if passenger["in_elevator"]:
                    next_idx = idx
                    break
                
            if next_idx is not None:
                passenger = state["passengers"][next_idx]
                target = passenger["destiny_floor"]
                
                if state["current_floor"] < target:
                    state["current_floor"] += 1
                    state["direction"] = "up"
                    pause = 1
                    
                elif state["current_floor"] > target:
                    state["current_floor"] -= 1
                    state["direction"] = "down"
                    pause = 1
                    
                else:
                    time.sleep(1)
                    passenger["in_elevator"] = False
                    passenger["current_floor"] = target
                    state["log"].append(f"Elevador levou {passenger['name']} ao andar {target}")
                    state["direction"] = "stopped"
                    pause = 2
            else:
                pause = 1
        elif state.get("auto_mode") and not any(p["in_elevator"] for p in state["passengers"]):
            if state["current_floor"] > 0:
                state["current_floor"] -= 1
                state["direction"] = "down"
                pause = 1
                returning_to_zero = True
                
            elif state["current_floor"] < 0:
                state["current_floor"] += 1
                state["direction"] = "up"
                pause = 1
                returning_to_zero = True
                
            elif state["current_floor"] == 0 and returning_to_zero:
                state["direction"] = "stopped"
                state["auto_mode"] = False
                state["log"].append("Simulação finalizada. Elevador voltou ao térreo.")
                returning_to_zero = False
                pause = 1
                
            else:
                pause = 1
                
        else:
            state["direction"] = "stopped"
            pause = 1
        time.sleep(pause)

threading.Thread(target=elevator_thread, daemon=True).start()

@app.route('/api/state')
def get_state():
    resp_data = dict(state)
    resp_data["people"] = state["passengers"]

    # Corrige target_floor para refletir o destino do passageiro que está sendo transportado
    target = None
    for passenger in state["passengers"]:
        if passenger.get("in_elevator"):
            target = passenger.get("destiny_floor")
            break
    if target is not None:
        resp_data["target_floor"] = target
    elif state.get("auto_mode") and not any(p.get("in_elevator") for p in state["passengers"]):
        # Se está voltando para o térreo sem passageiros
        resp_data["target_floor"] = 0
    elif state.get("auto_mode") and state["passengers"]:
        resp_data["target_floor"] = state["passengers"][0]["destiny_floor"]
    resp = jsonify(resp_data)
    return resp

@app.route('/api/reset', methods=['POST'])
def reset():
    state["current_floor"] = 0
    state["target_floor"] = 0
    state["moving"] = False
    state["direction"] = "stopped"
    state["passengers"] = load_passengers()
    state["log"] = []
    state["auto_mode"] = False
    global first_run
    first_run = True

    return jsonify({"status": "success"})

@app.route('/api/start_auto', methods=['POST'])
def start_auto():
    state["auto_mode"] = True
    state["log"].append("Simulação automática iniciada")
    
    return jsonify({"status": "auto_started"})

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
    )
