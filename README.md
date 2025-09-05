# Elevator Simulator

Simulador simples de elevador utilizando Python e threading para simular embarque e desembarque de passageiros.

## Tecnologias e Bibliotecas Utilizadas
- **Python 3.13**
- **threading**: Para simulação de concorrência e controle de acesso ao elevador.
- **time**: Para medir o tempo de execução e simular atrasos.

## Padrões de Projeto
- **Orientação a Objetos**: Classes `Elevador` e `Passageiro` representam os componentes principais.
- **Thread Safety**: Uso de `threading.Lock` para garantir acesso seguro à lista de passageiros.

## Setup e Configuração
1. Certifique-se de ter o Python 3.13 instalado.
2. Clone o repositório:
	```bash
	git clone https://github.com/schulzdimitrii-study/elevator-simulator.git
	cd elevator-simulator
	```
3. Execute o simulador:
	```bash
	python3 main.py
	```

## Estrutura do Projeto
- `main.py`: Arquivo principal de execução.
- `elevador.py`: Implementação da classe Elevador.
- `passageiro.py`: Implementação da classe Passageiro.

## Observações
- Não são necessárias bibliotecas externas além das padrão do Python.
- O projeto é apenas para fins didáticos e simulação simples.
