#!/bin/python

import requests
import json
import re
import shutil
from PIL import Image

THUMBNAIL = 150, 219

if __name__ == "__main__":
    with open("card_data.json", "r") as file:
        data = json.load(file)

        for card in data:
            resp = requests.get(card["image_url"], stream=True)
            resp.raise_for_status()
            fname_base = re.sub(
                r"\s+", " ", re.sub(r"""[?/'!,:&."]""", "_", card["name"])
            )
            fname = f"card_images/{fname_base}.jpg"
            with open(fname, "wb") as img:
                resp.raw.decode_content = True
                shutil.copyfileobj(resp.raw, img)
            with Image.open(fname) as im:
                im.save(fname, "JPEG", progressive=True)
                im.thumbnail(THUMBNAIL)
                im.save(f"card_images/small/{fname_base}.jpg", "JPEG", progressive=True)
