import json

class Passenger:
    def init(self):
        self.is_arrived = False

    @classmethod
    def load_passengers(cls):
        with open("passengers.json", "r", encoding="utf-8") as f:
            passengers = json.load(f)

        for p in passengers:
            p["in_elevator"] = False
            p["is_arrived"] = False

        return passengers

    @staticmethod
    def get_passenger(passengers):
        """ Returns the first passenger who is not yet arrived """
        for passenger in passengers:
            if not passenger.get("is_arrived"):
                return passenger