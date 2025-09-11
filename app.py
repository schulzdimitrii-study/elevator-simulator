from flask import Flask, jsonify, render_template
from flask_cors import CORS
from app.simulation import Simulation

app = Flask(__name__, template_folder='templates')
CORS(app)

Simulation = Simulation()

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/simulacao1')
def simulacao1():
    return render_template('index1.html')

@app.route('/simulacao2')
def simulacao2():
    return render_template('index2.html')

@app.route('/simulacao4')
def simulacao4():
    return render_template('index4.html')

@app.route('/api1/state', methods=['GET'])
def get_state_1():
    sim = Simulation.ensure_simulation(1)
    elev = sim["elevators"][0]
    state = elev.get_state()
    state["people"] = sim["passengers"]
    state["log"] = sim["log"]
    return jsonify(state)


@app.route('/api1/reset', methods=['POST'])
def reset_1():
    sim = Simulation.reset_simulation(1)
    elev = sim["elevators"][0]
    state = elev.get_state()
    state["people"] = sim["passengers"]
    state["log"] = sim["log"]
    return jsonify(state)


@app.route('/api1/start', methods=['POST'])
def start_1():
    Simulation.start_simulation(1)
    return jsonify({"message": "Simulation Started"})

@app.route('/api2/state', methods=['GET'])
def get_state_2():
    sim = Simulation.ensure_simulation(2)
    resp_data = {
        "elevators": [e.get_state() for e in sim["elevators"]],
        "passengers": sim["passengers"],
        "log": sim["log"],
    }
    return jsonify(resp_data)


@app.route('/api2/reset', methods=['POST'])
def reset_2():
    Simulation.reset_simulation(2)
    return jsonify({"message": "Simulation Reset"})


@app.route('/api2/start', methods=['POST'])
def start_2():
    Simulation.start_simulation(2)
    return jsonify({"message": "Simulation Started"})

@app.route('/api4/state', methods=['GET'])
def get_state_4():
    sim = Simulation.ensure_simulation(4)
    resp_data = {
        "elevators": [e.get_state() for e in sim["elevators"]],
        "passengers": sim["passengers"],
        "log": sim["log"],
    }
    return jsonify(resp_data)

@app.route('/api4/reset', methods=['POST'])
def reset_4():
    Simulation.reset_simulation(4)
    return jsonify({"message": "Simulation Reset"})

@app.route('/api4/start', methods=['POST'])
def start_4():
    Simulation.start_simulation(4)
    return jsonify({"message": "Simulation Started"})

if __name__ == "__main__":
    app.run(port=8080)
