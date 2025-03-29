#!/bin/python

import json

THUMBNAIL = 150, 219

CARD_OVERRIDES = {
    "CXyz Gimmick Puppet Fanatix Machinix": {
        "archetype": "Gimmick Puppet",
    },
    "Snake-Eyes Doomed Dragon": {
        "archetype": "Snake-Eye",
    },
}

ATTRIBUTE_OVERRIDES = {"type": {"S": "Monster"}}


def repair_card_data(data):
    for card in data:
        if card["name"] in CARD_OVERRIDES:
            for key, value in CARD_OVERRIDES[card["name"]].items():
                card[key] = value
            print(card)

    data.sort(key=lambda card: card["name"])
    data.sort(key=lambda card: card["full_type"])


if __name__ == "__main__":
    with open("card_data.json", "r") as file:
        data = json.load(file)
        file.close()

        repair_card_data(data)

        with open("card_data.json", "w") as f:
            json.dump(data, f, indent=4)
