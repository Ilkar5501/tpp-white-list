#!/bin/python

import requests
import json
import csv
import repair_card_data

BASE_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php"

CATEGORIES = ["Effect", "Ritual", "Fusion", "Synchro", "Xyz", "Link", "Pendulum"]
ABILITIES = ["Flip", "Gemini", "Spirit", "Toon", "Tuner", "Union"]


def chunker(seq, size):
    return (seq[pos : pos + size] for pos in range(0, len(seq), size))


if __name__ == "__main__":
    data = requests.get(
        "https://docs.google.com/spreadsheets/d/1jpnQ0VkXkyV4AbT7q5NZYn2zB5_hh9g1MJFrm5jQn8g/export?format=csv"
    ).text
    names = []
    for line in csv.reader(data.splitlines()):
        names.append(line[1])

    output = []

    for chunk in chunker(names, 100):
        chunk = "|".join(chunk)
        response = requests.get(BASE_URL, {"name": chunk})
        response.raise_for_status()
        data = response.json()["data"]
        for card in data:
            card_info = {
                "name": card["name"],
                "full_type": card["type"],
                "race": card["race"],
                "desc": card["desc"],
                "frameType": card["frameType"],
                "archetype": card.get("archetype", ""),
                "image_url": card["card_images"][0]["image_url"],
            }

            if card["type"] == "Spell Card":
                card_info["type"] = "Spell Card"
            elif card["type"] == "Trap Card":
                card_info["type"] = "Trap Card"
            else:
                card_info["type"] = "Monster Card"
                card_info["category"] = []
                card_info["abilities"] = []
                for summon_ty in CATEGORIES:
                    if summon_ty in card["typeline"]:
                        card_info["category"].append(summon_ty)
                if len(card_info["category"]) == 0:
                    card_info["category"].append("Normal")

                for ability_ty in ABILITIES:
                    if ability_ty in card["typeline"]:
                        card_info["abilities"].append(ability_ty)
                if len(card_info["abilities"]) == 0:
                    del card_info["abilities"]

            if "attribute" in card and card["attribute"]:
                card_info["attribute"] = card["attribute"]
            if "atk" in card and card["atk"]:
                card_info["atk"] = card["atk"]
            if "def" in card and card["def"]:
                card_info["def"] = card["def"]
            if "level" in card and card["level"]:
                card_info["number_value"] = card["level"]
                card_info["level"] = card["level"]
            elif "linkval" in card and card["linkval"]:
                card_info["number_value"] = card["linkval"]
                card_info["linkval"] = card["linkval"]
            output.append(card_info)

    repair_card_data.repair_card_data(output)
    with open("card_data.json", "w") as f:
        json.dump(output, f, indent=4)
