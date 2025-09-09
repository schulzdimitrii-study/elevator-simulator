from flask import Flask, jsonify, render_template
from flask_cors import CORS
import threading
import webbrowser
from app.elevator2 import Elevator, load_passengers
from app.elevator1 import Elevator as Elevator1

app = Flask(__name__, template_folder='templates')
CORS(app)

# Pools para simulação 2 elevadores
passengers_pool_2 = None
log_pool_2 = None
elevator1_2 = None
elevator2_2 = None

from app.elevator1 import Elevator as Elevator1
elevator1_single = Elevator1()


# Página inicial para escolha da simulação
@app.route('/')
def home():
    return render_template('home.html')

# Simulação 1 elevador
@app.route('/simulacao1')
def simulacao1():
    return render_template('index1.html')

# Simulação 2 elevadores
@app.route('/simulacao2')
def simulacao2():
    return render_template('index2.html')


# API para simulação 2 elevadores
@app.route('/api2/state', methods=['GET'])
def get_state_2():
    global elevator1_2, elevator2_2, passengers_pool_2, log_pool_2
    # Inicializa pools se necessário
    if not elevator1_2 or not elevator2_2 or not passengers_pool_2 or not log_pool_2:
        passengers_pool_2 = load_passengers()
        log_pool_2 = []
        elevator1_2 = Elevator("A", passengers_pool_2, log_pool_2)
        elevator2_2 = Elevator("B", passengers_pool_2, log_pool_2)
    resp_data = {
        "elevators": [
            elevator1_2.get_state(),
            elevator2_2.get_state()
        ],
        "passengers": passengers_pool_2,
        "log": log_pool_2
    }
    return jsonify(resp_data)


@app.route('/api2/reset', methods=['POST'])
def reset_2():
    global passengers_pool_2, log_pool_2, elevator1_2, elevator2_2
    passengers_pool_2 = load_passengers()
    log_pool_2 = []
    elevator1_2 = Elevator("A", passengers_pool_2, log_pool_2)
    elevator2_2 = Elevator("B", passengers_pool_2, log_pool_2)
    return jsonify({"message": "Simulation Reset"})


@app.route('/api2/start', methods=['POST'])
def start_2():
    global elevator1_2, elevator2_2, log_pool_2
    if not elevator1_2 or not elevator2_2:
        return jsonify({"error": "Elevadores não inicializados"}), 400
    log_pool_2.append("Simulação iniciada")
    threading.Thread(target=elevator1_2.elevator_thread, daemon=True).start()
    threading.Thread(target=elevator2_2.elevator_thread, daemon=True).start()
    return jsonify({"message": "Simulation Started"})


# API para simulação 1 elevador
@app.route('/api1/state', methods=['GET'])
def get_state_1():
    # Nunca recria o objeto, apenas retorna o estado
    state = elevator1_single.get_state()
    state["people"] = state.get("passengers", [])
    return jsonify(state)

@app.route('/api1/reset', methods=['POST'])
def reset_1():
    # Cria uma nova instância do elevador para garantir que nenhuma thread antiga continue rodando
    global elevator1_single
    from app.elevator1 import Elevator as Elevator1
    elevator1_single = Elevator1()
    state = elevator1_single.get_state()
    state["people"] = state.get("passengers", [])
    return jsonify(state)

@app.route('/api1/start', methods=['POST'])
def start_1():
    # Apenas inicia a thread e atualiza o log
    elevator1_single.log.append("Simulação iniciada")
    threading.Thread(target=elevator1_single.elevator_thread, daemon=True).start()
    return jsonify({"message": "Simulation Started"})

if __name__ == "__main__":
    # Inicializa pools para 2 elevadores
    passengers_pool_2 = load_passengers()
    log_pool_2 = []
    elevator1_2 = Elevator("A", passengers_pool_2, log_pool_2)
    elevator2_2 = Elevator("B", passengers_pool_2, log_pool_2)
    # Instância global do elevador de 1
    elevator1_single.log.append("Sistema inicializado. Aguardando início...")
    threading.Timer(1.5, lambda: webbrowser.open("http://localhost:8080")).start()
    app.run(port=8080)
