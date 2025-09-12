## Elevator Simulator

![Python](https://img.shields.io/badge/Python-3.13-blue)
![Flask](https://img.shields.io/badge/Flask-3.1.2-brightgreen)
![Werkeug](https://img.shields.io/badge/Werkeug-3.1.3-yellow)
![flask-cors](https://img.shields.io/badge/Flask%20Cors-4.1.1-purple)
![threading](https://img.shields.io/badge/Threading-2.0.5-orange)

Simulador didático de elevadores com diferentes cenários (1, 2 ou 4 elevadores) usando Python, Flask e threads para movimentação contínua até todos os passageiros chegarem ao destino.

### Stack / Dependências Principais
| Componente | Uso |
|------------|-----|
| Python 3.13 | Linguagem principal |
| Flask / Werkzeug | API HTTP + templates HTML |
| flask-cors | Habilita CORS para as rotas de API |
| threading (stdlib) | Uma thread por elevador (loop infinito) |
| time (stdlib) | Simulação de tempo de deslocamento |
| `passengers.json` | Fonte de dados inicial dos passageiros |


(`thread` aparece em `requirements.txt`, mas o código atual usa apenas `threading`.)

### Arquitetura & Padrões
* Orientação a Objetos: `Elevator` (estado e movimento) e `Simulation` (orquestra cenários, estado compartilhado).
* Thread-per-worker: cada elevador roda em uma `threading.Thread` daemon, atualizando o estado de forma cooperativa (pausas com `sleep`).
* Estado compartilhado simples: listas mutáveis (`passengers`, `log`) injetadas no construtor dos elevadores (forma leve de Dependency Injection).
* Separação mínima: camada web (`app.py`) vs lógica de domínio (`app/elevator.py`, `app/simulation.py`).
* Dados idempotentes: `reset` recria totalmente estruturas (não há persistência externa).

### Estrutura Essencial
```
app.py                # Flask + rotas HTML/API
app/
  elevator.py         # Classe Elevator
  simulation.py       # Classe Simulation (criação e controle dos cenários)
passengers.json       # Lista de passageiros (campos: name, destiny_floor, ...)
templates/            # Páginas HTML (home e cenários)
static/               # CSS / JS para visualização
```

### Endpoints Principais (API JSON)
Cada conjunto (1, 2 ou 4 elevadores) possui trio de rotas:
* `GET /api{N}/state` – Estado atual (elevadores, passageiros, log).
* `POST /api{N}/start` – Inicia threads dos elevadores (idempotente).
* `POST /api{N}/reset` – Reinicia completamente o cenário.

Exemplos: `/api1/state`, `/api2/start`, `/api4/reset`.

Rotas HTML: `/` (home), `/simulacao1`, `/simulacao2`, `/simulacao4`.

### Setup Rápido
```bash
git clone https://github.com/schulzdimitrii-study/elevator-simulator.git
cd elevator-simulator

# (Opcional) Criar ambiente virtual
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux

pip install -r requirements.txt
python app.py  # inicia em http://localhost:8080
```

### Teste Rápido da API
```bash
curl http://localhost:8080/api1/state
curl -X POST http://localhost:8080/api1/start
```

### Personalizar Passageiros
Edite `passengers.json` (ex.: destino, nomes). Ao alterar, use `POST /apiN/reset` para recarregar.

### Limitações / Notas
* Não há locks: a simplicidade do loop e escrituras sequenciais minimizam condições de corrida, mas não é thread-safe para uso crítico.
* Sem persistência; toda simulação vive em memória enquanto o processo roda.
* Uso educacional / protótipo.

### Próximos Passos Possíveis (idéias)
* Adicionar prioridade ou multiple boarding por viagem.
* Métricas de desempenho (tempo médio de espera / viagem).
* Locks ou filas thread-safe para robustez.

---
MIT License – Uso livre para estudo.
