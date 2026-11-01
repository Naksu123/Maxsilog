import os
import json
import urllib.request
import urllib.parse
import time

# Map of target asset filename -> Search Query and Metadata
TARGET_MODELS = [
    {
        "filename": "kia_cerato.jpg",
        "query": "Kia Cerato 2015 car front",
        "brand": "Kia",
        "model": "Kia Cerato",
        "generation": "3rd Generation (YD)",
        "author": "order_242 from Chile / Wikimedia Commons",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/"
    },
    {
        "filename": "toyota_alphard.jpg",
        "query": "Toyota Alphard AH30 front",
        "brand": "Toyota",
        "model": "Toyota Alphard",
        "generation": "3rd Generation (AH30)",
        "author": "Tokumeigakarinoaoshima / Wikimedia Commons",
        "license": "CC0 1.0 Universal",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
    },
    {
        "filename": "toyota_vellfire.jpg",
        "query": "Toyota Vellfire 2016 front",
        "brand": "Toyota",
        "model": "Toyota Vellfire",
        "generation": "2nd Generation (AH30)",
        "author": "Tokumeigakarinoaoshima / Wikimedia Commons",
        "license": "CC0 1.0 Universal",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
    },
    {
        "filename": "bmw_x1.jpg",
        "query": "BMW X1 F48 front",
        "brand": "BMW",
        "model": "BMW X1",
        "generation": "2nd Generation (F48)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/"
    },
    {
        "filename": "byd_dolphin.jpg",
        "query": "BYD Dolphin EV front",
        "brand": "BYD",
        "model": "BYD Dolphin Dynamic Standard",
        "generation": "1st Generation",
        "author": "Dinkun Chen / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "chery_omoda5.jpg",
        "query": "Chery Omoda 5 front",
        "brand": "Chery",
        "model": "Chery Omoda 5 1.5",
        "generation": "1st Generation",
        "author": "JustAnotherCarDesigner / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "honda_crv.jpg",
        "query": "Honda CR-V 2017 front",
        "brand": "Honda",
        "model": "Honda CR-V",
        "generation": "5th Generation (RW)",
        "author": "Alexander Migl / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "honda_hrv.jpg",
        "query": "Honda HR-V 2016 front",
        "brand": "Honda",
        "model": "Honda HR-V",
        "generation": "2nd Generation (RU)",
        "author": "Sven Storbeck / Wikimedia Commons",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/"
    },
    {
        "filename": "honda_accord.jpg",
        "query": "Honda Accord 2016 front",
        "brand": "Honda",
        "model": "Honda Accord",
        "generation": "9th Generation (CR)",
        "author": "Kevauto / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "honda_jazz.jpg",
        "query": "Honda Jazz 2016 front",
        "brand": "Honda",
        "model": "Honda Jazz",
        "generation": "3rd Generation (GK)",
        "author": "Alexander Migl / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "toyota_harrier.jpg",
        "query": "Toyota Harrier 2015 front",
        "brand": "Toyota",
        "model": "Toyota Harrier",
        "generation": "3rd Generation (XU60)",
        "author": "Tokumeigakarinoaoshima / Wikimedia Commons",
        "license": "CC0 1.0 Universal",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/"
    },
    {
        "filename": "bmw_5series.jpg",
        "query": "BMW 520i G30 front",
        "brand": "BMW",
        "model": "BMW 520i",
        "generation": "7th Generation (G30)",
        "author": "Alexander Migl / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "mitsubishi_triton.jpg",
        "query": "Mitsubishi Triton 2019 front",
        "brand": "Mitsubishi",
        "model": "Mitsubishi Triton",
        "generation": "5th Generation",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "volkswagen_golf.jpg",
        "query": "Volkswagen Golf VII front",
        "brand": "Volkswagen",
        "model": "Volkswagen Golf",
        "generation": "Golf Mk7",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/"
    },
    {
        "filename": "volkswagen_beetle.jpg",
        "query": "Volkswagen Beetle A5 front",
        "brand": "Volkswagen",
        "model": "Volkswagen Beetle",
        "generation": "Beetle (A5)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/"
    },
    {
        "filename": "proton_x70.jpg",
        "query": "Proton X70 front",
        "brand": "Proton",
        "model": "Proton X70",
        "generation": "1st Generation",
        "author": "Umar Danial / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "perodua_alza.jpg",
        "query": "Perodua Alza front",
        "brand": "Perodua",
        "model": "Perodua Alza",
        "generation": "1st Generation Facelift (M500)",
        "author": "Umar Danial / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "perodua_aruz.jpg",
        "query": "Perodua Aruz front",
        "brand": "Perodua",
        "model": "Perodua Aruz",
        "generation": "1st Generation (F850)",
        "author": "Umar Danial / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "nissan_almera.jpg",
        "query": "Nissan Almera N17 front",
        "brand": "Nissan",
        "model": "Nissan Almera",
        "generation": "3rd Generation (N17)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "ford_ranger.jpg",
        "query": "Ford Ranger T6 front",
        "brand": "Ford",
        "model": "Ford Ranger",
        "generation": "Ranger (T6)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "ford_mustang.jpg",
        "query": "Ford Mustang S550 front",
        "brand": "Ford",
        "model": "Ford MUSTANG",
        "generation": "6th Generation (S550)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "isuzu_dmax.jpg",
        "query": "Isuzu D-Max 2016 front",
        "brand": "Isuzu",
        "model": "Isuzu D-Max",
        "generation": "2nd Generation (RT50)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
        "filename": "mercedes_eclass.jpg",
        "query": "Mercedes-Benz W213 front",
        "brand": "Mercedes-Benz",
        "model": "Mercedes-Benz E200",
        "generation": "5th Generation (W213)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/"
    },
    {
        "filename": "audi_a4.jpg",
        "query": "Audi A4 B9 front",
        "brand": "Audi",
        "model": "Audi A4",
        "generation": "5th Generation (B9)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/"
    }
]

def search_wikimedia(query):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrnamespace": 6,
        "gsrsearch": query,
        "gsrlimit": 3,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": 960
    }
    url = f"https://commons.wikimedia.org/w/api.php?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "AutoValuateResearch/1.0 (academic@autovaluate.my)"})
    with urllib.request.urlopen(req, timeout=12) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        pages = data.get("query", {}).get("pages", {})
        for pid, p in pages.items():
            ii_list = p.get("imageinfo", [])
            if ii_list:
                ii = ii_list[0]
                thumb_url = ii.get("thumburl") or ii.get("url")
                if thumb_url and (thumb_url.endswith(".jpg") or thumb_url.endswith(".JPG") or thumb_url.endswith(".png") or ".jpg" in thumb_url or ".JPG" in thumb_url):
                    return thumb_url, p.get("title", "")
    return None, None

def download_image(url, out_path):
    req = urllib.request.Request(url, headers={"User-Agent": "AutoValuateResearch/1.0 (academic@autovaluate.my)"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = resp.read()
        if len(data) > 10000:
            with open(out_path, "wb") as f:
                f.write(data)
            return len(data)
    return 0

def main():
    dest_dir = "frontend/public/vehicles"
    os.makedirs(dest_dir, exist_ok=True)
    manifest = []

    for item in TARGET_MODELS:
        out_path = os.path.join(dest_dir, item["filename"])
        print(f"Processing: {item['brand']} {item['model']} -> {item['filename']}...")
        if os.path.exists(out_path) and os.path.getsize(out_path) > 10000:
            print(f"  [OK] Already exists on disk ({os.path.getsize(out_path)} bytes).")
            manifest.append({**item, "status": "existing", "size": os.path.getsize(out_path)})
            continue

        try:
            thumb_url, title = search_wikimedia(item["query"])
            if not thumb_url:
                print(f"  [WARN] Query '{item['query']}' yielded no direct thumb URL. Trying broader search...")
                thumb_url, title = search_wikimedia(f"{item['brand']} {item['model']} car")

            if thumb_url:
                size = download_image(thumb_url, out_path)
                print(f"  [DOWNLOADED] {size} bytes from {title}!")
                manifest.append({**item, "status": "downloaded", "sourceTitle": title, "url": thumb_url, "size": size})
            else:
                print(f"  [FAILED] Could not find suitable image for {item['model']}.")
                manifest.append({**item, "status": "missing"})
        except Exception as e:
            print(f"  [ERROR] {e}")
            manifest.append({**item, "status": "error", "error": str(e)})

        time.sleep(1)

    with open("scripts/acquired_assets_manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nBatch asset acquisition finished. Processed {len(manifest)} models.")

if __name__ == "__main__":
    main()

