from flask import Flask, jsonify, render_template
from flask_cors import CORS
from app.simulation import Simulation


app = Flask(__name__, template_folder='templates')
CORS(app)

simulation = Simulation()

@app.route('/')
def home():
    return render_template('home.html')

# 1 Elevator Simulation Endpoints --------------------------------
@app.route('/simulation_1')
def simulation_1():
    return render_template('one_elevator.html')

@app.route('/api/state_1', methods=['GET'])
def get_state_1():
    sim = simulation.ensure_simulation(1)
    elev = sim["elevators"][0]
    state = elev.get_state()
    state["people"] = sim["passengers"]
    state["log"] = sim["log"]
    return jsonify(state)


@app.route('/api/reset_1', methods=['POST'])
def reset_1():
    sim = simulation.reset_simulation(1)
    elev = sim["elevators"][0]
    state = elev.get_state()
    state["people"] = sim["passengers"]
    state["log"] = sim["log"]
    return jsonify(state)


@app.route('/api/start_1', methods=['POST'])
def start_1():
    simulation.start_simulation(1)
    return jsonify({"message": "Simulation Started"})

# 2 Elevator Simulation Endpoints --------------------------------
@app.route('/simulation_2')
def simulation_2():
    return render_template('two_elevators.html')

@app.route('/api/state_2', methods=['GET'])
def get_state_2():
    sim = simulation.ensure_simulation(2)
    resp_data = {
        "elevators": [e.get_state() for e in sim["elevators"]],
        "passengers": sim["passengers"],
        "log": sim["log"],
    }
    return jsonify(resp_data)

@app.route('/api/reset_2', methods=['POST'])
def reset_2():
    simulation.reset_simulation(2)
    return jsonify({"message": "Simulation Reset"})

@app.route('/api/start_2', methods=['POST'])
def start_2():
    simulation.start_simulation(2)
    return jsonify({"message": "Simulation Started"})

# 4 Elevator Simulation Endpoints --------------------------------
@app.route('/simulation_4')
def simulation_4():
    return render_template('four_elevators.html')

@app.route('/api/state_4', methods=['GET'])
def get_state_4():
    sim = simulation.ensure_simulation(4)
    resp_data = {
        "elevators": [e.get_state() for e in sim["elevators"]],
        "passengers": sim["passengers"],
        "log": sim["log"],
    }
    return jsonify(resp_data)

@app.route('/api/reset_4', methods=['POST'])
def reset_4():
    simulation.reset_simulation(4)
    return jsonify({"message": "Simulation Reset"})

@app.route('/api/start_4', methods=['POST'])
def start_4():
    simulation.start_simulation(4)
    return jsonify({"message": "Simulation Started"})

if __name__ == "__main__":
    app.run(port=8080)
