from flask import Blueprint, render_template, jsonify, request
from app.simulation import Simulation
import ast

elevators_bp = Blueprint('elevators_bp', __name__)

simulation = Simulation()

# 1 Elevator Simulation Endpoints --------------------------------
@elevators_bp.route('/api/state_1', methods=['GET'])
def get_state_1():
    sim = simulation.ensure_simulation(1)
    elev = sim["elevators"][0]
    state = elev.get_state()
    state["people"] = sim["passengers"]
    state["log"] = sim["log"]
    return jsonify(state)


@elevators_bp.route('/api/reset_1', methods=['POST'])
def reset_1():
    sync = request.args.get('sync', 'on').lower() == 'on'
    sort_passengers_by_priority = ast.literal_eval(request.args.get('sort_by_priority'))
    sim = simulation.reset_simulation(1, sort_passengers_by_priority, sync)
    elev = sim["elevators"][0]
    state = elev.get_state()
    state["people"] = sim["passengers"]
    state["log"] = sim["log"]
    return jsonify(state)


@elevators_bp.route('/api/start_1', methods=['POST'])
def start_1():
    sync = request.args.get('sync', 'on').lower() == 'on'
    sort_passengers_by_priority = ast.literal_eval(request.args.get('sort_by_priority'))
    simulation.start_simulation(1, sort_passengers_by_priority, sync)
    
    return jsonify({"message": f"Simulation Started (sync={'on' if sync else 'off'})"})


# 2 Elevator Simulation Endpoints --------------------------------
@elevators_bp.route('/api/state_2', methods=['GET'])
def get_state_2():
    sim = simulation.ensure_simulation(2)
    resp_data = {
        "elevators": [e.get_state() for e in sim["elevators"]],
        "passengers": sim["passengers"],
        "log": sim["log"],
    }
    return jsonify(resp_data)


@elevators_bp.route('/api/reset_2', methods=['POST'])
def reset_2():
    sync = request.args.get('sync', 'on').lower() == 'on'
    sort_passengers_by_priority = ast.literal_eval(request.args.get('sort_by_priority'))
    simulation.reset_simulation(2, sort_passengers_by_priority, sync)

    return jsonify({"message": f"Simulation Reset (sync={'on' if sync else 'off'})"})


@elevators_bp.route('/api/start_2', methods=['POST'])
def start_2():
    sync = request.args.get('sync', 'on').lower() == 'on'
    sort_passengers_by_priority = ast.literal_eval(request.args.get('sort_by_priority'))
    simulation.start_simulation(2, sort_passengers_by_priority, sync)
    
    return jsonify({"message": f"Simulation Started (sync={'on' if sync else 'off'})"})


# 4 Elevator Simulation Endpoints --------------------------------
@elevators_bp.route('/api/state_4', methods=['GET'])
def get_state_4():
    sim = simulation.ensure_simulation(4)
    resp_data = {
        "elevators": [e.get_state() for e in sim["elevators"]],
        "passengers": sim["passengers"],
        "log": sim["log"],
    }
    return jsonify(resp_data)


@elevators_bp.route('/api/reset_4', methods=['POST'])
def reset_4():
    sync = request.args.get('sync', 'on').lower() == 'on'
    sort_passengers_by_priority = ast.literal_eval(request.args.get('sort_by_priority'))
    simulation.reset_simulation(4, sort_passengers_by_priority, sync)
    
    return jsonify({"message": f"Simulation Reset (sync={'on' if sync else 'off'})"})


@elevators_bp.route('/api/start_4', methods=['POST'])
def start_4():
    sync = request.args.get('sync', 'on').lower() == 'on'
    sort_passengers_by_priority = ast.literal_eval(request.args.get('sort_by_priority'))
    simulation.start_simulation(4, sort_passengers_by_priority, sync)
    return jsonify({"message": f"Simulation Started (sync={'on' if sync else 'off'})"})