from flask import Blueprint, render_template

simulations_bp = Blueprint('simulations_bp', __name__)


@simulations_bp.route('/simulation_1')
def simulation_1():
    return render_template('one_elevator.html')


@simulations_bp.route('/simulation_2')
def simulation_2():
    return render_template('two_elevators.html')


@simulations_bp.route('/simulation_4')
def simulation_4():
    return render_template('four_elevators.html')