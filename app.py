from flask import Flask, jsonify, render_template
from routes.elevators import elevators_bp
from routes.simulations import simulations_bp

app = Flask(__name__, template_folder='templates')
app.register_blueprint(simulations_bp)
app.register_blueprint(elevators_bp)


@app.route('/')
def home():
    return render_template('home.html')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080)
