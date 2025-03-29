#!/bin/python

import requests
import json
import csv

BASE_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php"


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
                "type": card["type"],
                "race": card["race"],
                "desc": card["desc"],
                "archetype": card.get("archetype", ""),
                "image_url": card["card_images"][0]["image_url"],
            }

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

    output.sort(key=lambda card: card["name"])
    output.sort(key=lambda card: card["type"])
    with open("card_data.json", "w") as f:
        json.dump(output, f, indent=4)
