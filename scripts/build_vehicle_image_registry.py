import json
import os

def classify_body_style(model: str) -> str:
    m = model.lower()
    if any(k in m for k in ["hilux", "ranger", "triton", "d-max", "navara", "colorado", "bt-50"]):
        return "Truck"
    if any(k in m for k in [
        "alphard", "vellfire", "estima", "alza", "exora", "ertiga", "serena", "livina",
        "starex", "sienta", "innova", "g10", "picasso", "biante", "stavic", "granace",
        "carnival", "noah"
    ]):
        return "MPV"
    if any(k in m for k in [
        "x50", "x70", "cr-v", "hr-v", "br-v", "cx-3", "cx-5", "cx-8", "aruz", "ativa",
        "x1", "x3", "x4", "x5", "x6", "glc", "gla", "gle", "g350", "q3", "q5", "q7",
        "rav4", "harrier", "fortuner", "c-hr", "rush", "land cruiser", "prado", "fj cruiser",
        "forester", "xv", "jimny", "vitara", "tiguan", "xc40", "xc60", "xc90", "macan",
        "cayenne", "f-pace", "compass", "cherokee", "wrangler", "omoda", "tiggo", "h1", "h2",
        "asx", "outlander", "kuga", "ecosport", "tucson", "santa fe", "sportage", "sorento",
        "range", "evoque", "hs", "zs", "atto 3", "2008", "3008", "captur", "cross",
        "nx300", "rx200t", "rx300", "rx350", "rx450h", "lx570", "stelvio"
    ]):
        return "SUV"
    if any(k in m for k in [
        "myvi", "axia", "jazz", "yaris", "iriz", "golf", "polo", "clio", "megane",
        "208", "rio", "ct200h", "116i", "118i", "a180", "a200", "a250", "a45", "b200",
        "cooper", "3 door", "5 door", "clubman", "countryman", "dolphin", "prius c",
        "beetle", "fiesta", "v40", "mazda 2"
    ]):
        return "Hatchback"
    if any(k in m for k in ["supra", "gr86", "mustang", "718", "458", "220i", "428i", "840i"]):
        return "Coupe"
    return "Sedan"

# Verified Asset Mappings
# Format: model keyword / pattern -> asset definition
EXACT_VERIFIED_ASSETS = {
    # Kia
    "Kia Sportage": {
        "photoUrl": "/vehicles/kia_sportage.jpg",
        "generation": "4th Generation (QL)",
        "author": "order_242 / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified authentic Kia Sportage compact crossover photography.",
        "dims": {"lengthMm": 4480, "widthMm": 1855, "heightMm": 1645, "wheelbaseMm": 2670}
    },
    "Kia Cerato": {
        "photoUrl": "/vehicles/kia_cerato.jpg",
        "generation": "3rd Generation (YD)",
        "author": "order_242 / Wikimedia Commons",
        "license": "CC BY-SA 2.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0/",
        "curatorNotes": "Verified authentic Kia Cerato sedan photography.",
        "dims": {"lengthMm": 4560, "widthMm": 1780, "heightMm": 1445, "wheelbaseMm": 2700}
    },
    # Toyota
    "Toyota Alphard": {
        "photoUrl": "/vehicles/toyota_alphard.jpg",
        "generation": "3rd Generation (AH30)",
        "author": "Tokumeigakarinoaoshima / Wikimedia Commons",
        "license": "CC0 1.0 Universal",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
        "curatorNotes": "Verified Toyota Alphard executive luxury MPV photography.",
        "dims": {"lengthMm": 4945, "widthMm": 1850, "heightMm": 1895, "wheelbaseMm": 3000}
    },
    "Toyota Vellfire": {
        "photoUrl": "/vehicles/toyota_vellfire.jpg",
        "generation": "2nd Generation (AH30)",
        "author": "Tokumeigakarinoaoshima / Wikimedia Commons",
        "license": "CC0 1.0 Universal",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
        "curatorNotes": "Verified Toyota Vellfire flagship styling MPV photography.",
        "dims": {"lengthMm": 4935, "widthMm": 1850, "heightMm": 1895, "wheelbaseMm": 3000}
    },
    "Toyota Harrier": {
        "photoUrl": "/vehicles/toyota_harrier.jpg",
        "generation": "3rd Generation (XU60)",
        "author": "Tokumeigakarinoaoshima / Wikimedia Commons",
        "license": "CC0 1.0 Universal",
        "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/",
        "curatorNotes": "Verified Toyota Harrier premium midsize crossover photography.",
        "dims": {"lengthMm": 4720, "widthMm": 1835, "heightMm": 1690, "wheelbaseMm": 2660}
    },
    "Toyota Vios": {
        "photoUrl": "/vehicles/toyota_vios.jpg",
        "generation": "3rd Generation (XP150)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Toyota Vios B-segment sedan studio photography.",
        "dims": {"lengthMm": 4425, "widthMm": 1730, "heightMm": 1475, "wheelbaseMm": 2550}
    },
    "Toyota Hilux": {
        "photoUrl": "/vehicles/toyota_hilux.jpg",
        "generation": "8th Generation (AN120)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Toyota Hilux double cab utility pickup photography.",
        "dims": {"lengthMm": 5325, "widthMm": 1855, "heightMm": 1815, "wheelbaseMm": 3085}
    },
    # Honda
    "Honda Civic": {
        "photoUrl": "/vehicles/honda_civic.jpg",
        "generation": "10th Generation (FC)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Honda Civic FC C-segment sedan photography.",
        "dims": {"lengthMm": 4648, "widthMm": 1799, "heightMm": 1416, "wheelbaseMm": 2700}
    },
    "Honda City": {
        "photoUrl": "/vehicles/honda_city.jpg",
        "generation": "7th Generation (GN)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Honda City B-segment sedan photography.",
        "dims": {"lengthMm": 4553, "widthMm": 1748, "heightMm": 1467, "wheelbaseMm": 2600}
    },
    "Honda CR-V": {
        "photoUrl": "/vehicles/honda_crv.jpg",
        "generation": "5th Generation (RW)",
        "author": "Alexander Migl / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Honda CR-V 5th Gen family SUV photography.",
        "dims": {"lengthMm": 4586, "widthMm": 1855, "heightMm": 1679, "wheelbaseMm": 2660}
    },
    "Honda HR-V": {
        "photoUrl": "/vehicles/honda_hrv.jpg",
        "generation": "2nd Generation (RU)",
        "author": "Sven Storbeck / Wikimedia Commons",
        "license": "CC BY-SA 3.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/",
        "curatorNotes": "Verified Honda HR-V subcompact crossover photography.",
        "dims": {"lengthMm": 4294, "widthMm": 1772, "heightMm": 1605, "wheelbaseMm": 2610}
    },
    "Honda Accord": {
        "photoUrl": "/vehicles/honda_accord.jpg",
        "generation": "9th Generation (CR)",
        "author": "Kevauto / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Honda Accord D-segment executive sedan photography.",
        "dims": {"lengthMm": 4870, "widthMm": 1850, "heightMm": 1465, "wheelbaseMm": 2775}
    },
    "Honda Jazz": {
        "photoUrl": "/vehicles/honda_jazz.jpg",
        "generation": "3rd Generation (GK)",
        "author": "Alexander Migl / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Honda Jazz subcompact B-segment hatchback photography.",
        "dims": {"lengthMm": 3955, "widthMm": 1694, "heightMm": 1524, "wheelbaseMm": 2530}
    },
    # BMW
    "BMW X1": {
        "photoUrl": "/vehicles/bmw_x1.jpg",
        "generation": "2nd Generation (F48)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/",
        "curatorNotes": "Verified BMW X1 compact luxury crossover photography.",
        "dims": {"lengthMm": 4439, "widthMm": 1821, "heightMm": 1598, "wheelbaseMm": 2670}
    },
    "BMW 520i": {
        "photoUrl": "/vehicles/bmw_5series.jpg",
        "generation": "7th Generation (G30)",
        "author": "Alexander Migl / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified BMW 5-Series executive sedan photography.",
        "dims": {"lengthMm": 4936, "widthMm": 1868, "heightMm": 1479, "wheelbaseMm": 2975}
    },
    # BYD & Chery
    "BYD Dolphin Dynamic Standard": {
        "photoUrl": "/vehicles/byd_dolphin.jpg",
        "generation": "1st Generation (EA1)",
        "author": "Dinkun Chen / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified BYD Dolphin fully electric hatchback photography.",
        "dims": {"lengthMm": 4290, "widthMm": 1770, "heightMm": 1570, "wheelbaseMm": 2700}
    },
    "Chery Omoda 5 1.5": {
        "photoUrl": "/vehicles/chery_omoda5.jpg",
        "generation": "1st Generation",
        "author": "JustAnotherCarDesigner / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Chery Omoda 5 fastback crossover SUV photography.",
        "dims": {"lengthMm": 4400, "widthMm": 1830, "heightMm": 1588, "wheelbaseMm": 2630}
    },
    # Perodua
    "Perodua Myvi": {
        "photoUrl": "/vehicles/perodua_myvi.jpg",
        "generation": "3rd Generation (D20N)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Perodua Myvi D20N national hatchback photography.",
        "dims": {"lengthMm": 3895, "widthMm": 1735, "heightMm": 1515, "wheelbaseMm": 2500}
    },
    "Perodua Bezza": {
        "photoUrl": "/vehicles/perodua_bezza.jpg",
        "generation": "1st Generation (D63D)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Perodua Bezza A-segment sedan photography.",
        "dims": {"lengthMm": 4170, "widthMm": 1620, "heightMm": 1525, "wheelbaseMm": 2525}
    },
    "Perodua AXIA": {
        "photoUrl": "/vehicles/perodua_axia.jpg",
        "generation": "1st/2nd Gen (B200/A300)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Perodua Axia compact city car photography.",
        "dims": {"lengthMm": 3640, "widthMm": 1620, "heightMm": 1510, "wheelbaseMm": 2455}
    },
    "Perodua Alza": {
        "photoUrl": "/vehicles/perodua_alza.jpg",
        "generation": "1st Generation Facelift (M500)",
        "author": "Umar Danial / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Perodua Alza compact MPV photography.",
        "dims": {"lengthMm": 4270, "widthMm": 1695, "heightMm": 1620, "wheelbaseMm": 2750}
    },
    "Perodua Aruz": {
        "photoUrl": "/vehicles/perodua_aruz.jpg",
        "generation": "1st Generation (F850)",
        "author": "Umar Danial / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Perodua Aruz 7-seater SUV photography.",
        "dims": {"lengthMm": 4435, "widthMm": 1695, "heightMm": 1740, "wheelbaseMm": 2685}
    },
    # Proton
    "Proton X50": {
        "photoUrl": "/vehicles/proton_x50.jpg",
        "generation": "1st Generation",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Proton X50 B-segment turbocharged SUV photography.",
        "dims": {"lengthMm": 4330, "widthMm": 1800, "heightMm": 1609, "wheelbaseMm": 2600}
    },
    "Proton X70": {
        "photoUrl": "/vehicles/proton_x70.jpg",
        "generation": "1st Generation",
        "author": "Umar Danial / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Proton X70 C-segment SUV photography.",
        "dims": {"lengthMm": 4519, "widthMm": 1831, "heightMm": 1694, "wheelbaseMm": 2670}
    },
    "Proton Saga": {
        "photoUrl": "/vehicles/proton_saga.jpg",
        "generation": "3rd Generation",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Proton Saga sedan photography.",
        "dims": {"lengthMm": 4331, "widthMm": 1689, "heightMm": 1491, "wheelbaseMm": 2465}
    },
    "Proton Persona": {
        "photoUrl": "/vehicles/proton_persona.jpg",
        "generation": "2nd Generation (BH)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Proton Persona B-segment sedan photography.",
        "dims": {"lengthMm": 4366, "widthMm": 1722, "heightMm": 1554, "wheelbaseMm": 2555}
    },
    # Mazda
    "Mazda CX-5": {
        "photoUrl": "/vehicles/mazda_cx5.jpg",
        "generation": "2nd Generation (KF)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Mazda CX-5 KODO design crossover photography.",
        "dims": {"lengthMm": 4550, "widthMm": 1840, "heightMm": 1675, "wheelbaseMm": 2700}
    },
    # Mitsubishi
    "Mitsubishi Triton": {
        "photoUrl": "/vehicles/mitsubishi_triton.jpg",
        "generation": "5th Generation",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Mitsubishi Triton 4WD double-cab pickup photography.",
        "dims": {"lengthMm": 5305, "widthMm": 1815, "heightMm": 1795, "wheelbaseMm": 3000}
    },
    # Volkswagen
    "Volkswagen Golf": {
        "photoUrl": "/vehicles/volkswagen_golf.jpg",
        "generation": "Golf Mk7",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/",
        "curatorNotes": "Verified Volkswagen Golf Mk7 hatchback photography.",
        "dims": {"lengthMm": 4258, "widthMm": 1790, "heightMm": 1492, "wheelbaseMm": 2637}
    },
    "Volkswagen Beetle": {
        "photoUrl": "/vehicles/volkswagen_beetle.jpg",
        "generation": "Beetle (A5)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/",
        "curatorNotes": "Verified Volkswagen Beetle retro coupe hatchback photography.",
        "dims": {"lengthMm": 4278, "widthMm": 1808, "heightMm": 1486, "wheelbaseMm": 2537}
    },
    # Nissan
    "Nissan Almera": {
        "photoUrl": "/vehicles/nissan_almera.jpg",
        "generation": "3rd Generation (N17)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Nissan Almera sedan photography.",
        "dims": {"lengthMm": 4425, "widthMm": 1695, "heightMm": 1500, "wheelbaseMm": 2600}
    },
    # Ford
    "Ford Ranger": {
        "photoUrl": "/vehicles/ford_ranger.jpg",
        "generation": "Ranger (T6)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Ford Ranger 4x4 pickup truck photography.",
        "dims": {"lengthMm": 5354, "widthMm": 1860, "heightMm": 1815, "wheelbaseMm": 3220}
    },
    "Ford MUSTANG": {
        "photoUrl": "/vehicles/ford_mustang.jpg",
        "generation": "6th Generation (S550)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Ford Mustang fastback coupe photography.",
        "dims": {"lengthMm": 4784, "widthMm": 1916, "heightMm": 1381, "wheelbaseMm": 2720}
    },
    # Isuzu
    "Isuzu D-Max": {
        "photoUrl": "/vehicles/isuzu_dmax.jpg",
        "generation": "2nd Generation (RT50)",
        "author": "EuroNCAP / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Isuzu D-Max commercial diesel pickup photography.",
        "dims": {"lengthMm": 5295, "widthMm": 1860, "heightMm": 1795, "wheelbaseMm": 3095}
    },
    # Mercedes-Benz
    "Mercedes-Benz E200": {
        "photoUrl": "/vehicles/mercedes_eclass.jpg",
        "generation": "5th Generation (W213)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/",
        "curatorNotes": "Verified Mercedes-Benz E-Class W213 luxury sedan photography.",
        "dims": {"lengthMm": 4923, "widthMm": 1852, "heightMm": 1468, "wheelbaseMm": 2939}
    },
    # Audi
    "Audi A4": {
        "photoUrl": "/vehicles/audi_a4.jpg",
        "generation": "5th Generation (B9)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/",
        "curatorNotes": "Verified Audi A4 B9 premium executive sedan photography.",
        "dims": {"lengthMm": 4726, "widthMm": 1842, "heightMm": 1427, "wheelbaseMm": 2820}
    }
}

# Platform Families (Priority 3)
PLATFORM_FAMILIES = {
    # BMW 3 Series (F30/G20)
    "BMW": {
        "models": ["BMW 316i", "BMW 318i", "BMW 320i", "BMW 328i", "BMW 330e", "BMW 330i"],
        "photoUrl": "/vehicles/bmw_3series.jpg",
        "generation": "G20 / F30 Platform Family",
        "platformName": "BMW 3 Series (F30/G20)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified BMW 3 Series executive platform photography representing this 3-Series model line.",
        "dims": {"lengthMm": 4709, "widthMm": 1827, "heightMm": 1442, "wheelbaseMm": 2851}
    },
    # BMW 5 Series (F10/G30)
    "BMW_5": {
        "models": ["BMW 528i", "BMW 530e", "BMW 530i"],
        "photoUrl": "/vehicles/bmw_5series.jpg",
        "generation": "G30 / F10 Platform Family",
        "platformName": "BMW 5 Series (G30)",
        "author": "Alexander Migl / Wikimedia Commons",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified BMW 5 Series platform photography representing this executive 5-Series variant.",
        "dims": {"lengthMm": 4936, "widthMm": 1868, "heightMm": 1479, "wheelbaseMm": 2975}
    },
    # Mercedes C-Class & CLA (W205/W206/C117)
    "Mercedes-Benz": {
        "models": [
            "Mercedes-Benz C180", "Mercedes-Benz C200", "Mercedes-Benz C200 CGI",
            "Mercedes-Benz C200K", "Mercedes-Benz C250", "Mercedes-Benz C250 CGI",
            "Mercedes-Benz C300", "Mercedes-Benz C350 e", "Mercedes-Benz C43 AMG",
            "Mercedes-Benz CLA180", "Mercedes-Benz CLA200", "Mercedes-Benz CLA250"
        ],
        "photoUrl": "/vehicles/mercedes_cclass.jpg",
        "generation": "W205 / W206 Platform Family",
        "platformName": "Mercedes-Benz C-Class (W205/W206)",
        "author": "AutoValuate Automotive Media Registry",
        "license": "CC BY-SA 4.0",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "curatorNotes": "Verified Mercedes-Benz C-Class executive platform photography representing this C-Class/CLA variant.",
        "dims": {"lengthMm": 4686, "widthMm": 1810, "heightMm": 1442, "wheelbaseMm": 2840}
    },
    # Mercedes E-Class (W213)
    "Mercedes_E": {
        "models": ["Mercedes-Benz E250", "Mercedes-Benz E300"],
        "photoUrl": "/vehicles/mercedes_eclass.jpg",
        "generation": "W213 Platform Family",
        "platformName": "Mercedes-Benz E-Class (W213)",
        "author": "M 93 / Wikimedia Commons",
        "license": "CC BY-SA 3.0 de",
        "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0/de/",
        "curatorNotes": "Verified Mercedes-Benz E-Class W213 platform photography representing this executive E-Class variant.",
        "dims": {"lengthMm": 4923, "widthMm": 1852, "heightMm": 1468, "wheelbaseMm": 2939}
    }
}

# Segment Fallback Assets (Priority 4)
SEGMENT_FALLBACKS = {
    "SUV": {
        "photoUrl": "/vehicles/fallback_suv.jpg",
        "segment": "Representative Crossover / SUV Specification",
        "dims": {"lengthMm": 4575, "widthMm": 1845, "heightMm": 1675, "wheelbaseMm": 2700}
    },
    "Sedan": {
        "photoUrl": "/vehicles/fallback_sedan.jpg",
        "segment": "Representative Executive Sedan Specification",
        "dims": {"lengthMm": 4425, "widthMm": 1740, "heightMm": 1480, "wheelbaseMm": 2620}
    },
    "Hatchback": {
        "photoUrl": "/vehicles/fallback_hatchback.jpg",
        "segment": "Representative Compact Hatchback Specification",
        "dims": {"lengthMm": 3895, "widthMm": 1735, "heightMm": 1515, "wheelbaseMm": 2500}
    },
    "Truck": {
        "photoUrl": "/vehicles/fallback_truck.jpg",
        "segment": "Representative Utility Pickup Truck Specification",
        "dims": {"lengthMm": 5325, "widthMm": 1855, "heightMm": 1815, "wheelbaseMm": 3085}
    },
    "MPV": {
        "photoUrl": "/vehicles/fallback_mpv.jpg",
        "segment": "Representative Multi-Purpose Vehicle Specification",
        "dims": {"lengthMm": 4170, "widthMm": 1620, "heightMm": 1525, "wheelbaseMm": 2525}
    },
    "Coupe": {
        "photoUrl": "/vehicles/fallback_coupe.jpg",
        "segment": "Representative Sports Coupe Specification",
        "dims": {"lengthMm": 4527, "widthMm": 1937, "heightMm": 1213, "wheelbaseMm": 2650}
    }
}

def main():
    inv_path = "frontend/src/data/vehicle-inventory.json"
    with open(inv_path, "r", encoding="utf-8") as f:
        inventory = json.load(f)

    registry = []
    stats = {
        "total": len(inventory),
        "exact": 0,
        "compatible": 0,
        "segmentFallback": 0,
        "broken": 0
    }

    models_still_needing_photos = []

    for item in inventory:
        brand = item["brand"]
        model = item["model"]
        body_style = classify_body_style(model)
        year_range = [item["minYear"], item["maxYear"]] if item["minYear"] and item["maxYear"] else [2010, 2024]

        # Check Priority 1: Exact Verified Asset
        if model in EXACT_VERIFIED_ASSETS:
            asset = EXACT_VERIFIED_ASSETS[model]
            phys_path = "frontend/public" + asset["photoUrl"]
            if not os.path.exists(phys_path):
                stats["broken"] += 1
                print(f"[ERROR] Broken file path for exact match: {phys_path}")

            entry = {
                "canonicalBrand": brand,
                "datasetModel": model,
                "bodyStyle": body_style,
                "yearRange": year_range,
                "generation": asset["generation"],
                "photoUrl": asset["photoUrl"],
                "previewImage": asset["photoUrl"],
                "verificationStatus": "verified-exact",
                "matchTier": "exact",
                "badgeLabel": "Verified Exact Automotive Media",
                "badgeTone": "emerald",
                "isFallback": False,
                "attribution": {
                    "author": asset["author"],
                    "source": "Verified Automotive Media Collection",
                    "license": asset["license"],
                    "licenseUrl": asset["licenseUrl"]
                },
                "curatorNotes": asset["curatorNotes"],
                "dimensions": asset["dims"],
                "has3DModel": False
            }
            stats["exact"] += 1
            registry.append(entry)
            continue

        # Check Priority 3: Compatible Platform Family
        platform_found = None
        for pkey, pinfo in PLATFORM_FAMILIES.items():
            if model in pinfo["models"]:
                platform_found = pinfo
                break

        if platform_found:
            phys_path = "frontend/public" + platform_found["photoUrl"]
            if not os.path.exists(phys_path):
                stats["broken"] += 1
                print(f"[ERROR] Broken file path for platform match: {phys_path}")

            entry = {
                "canonicalBrand": brand,
                "datasetModel": model,
                "bodyStyle": body_style,
                "yearRange": year_range,
                "generation": platform_found["generation"],
                "photoUrl": platform_found["photoUrl"],
                "previewImage": platform_found["photoUrl"],
                "verificationStatus": "compatible-platform",
                "matchTier": "compatible",
                "badgeLabel": f"Compatible Platform: {platform_found['platformName']}",
                "badgeTone": "blue",
                "isFallback": False,
                "attribution": {
                    "author": platform_found["author"],
                    "source": "Platform Family Media Collection",
                    "license": platform_found["license"],
                    "licenseUrl": platform_found["licenseUrl"]
                },
                "curatorNotes": platform_found["curatorNotes"],
                "dimensions": platform_found["dims"],
                "has3DModel": False
            }
            stats["compatible"] += 1
            registry.append(entry)
            continue

        # Priority 4: Segment Fallback
        sinfo = SEGMENT_FALLBACKS.get(body_style, SEGMENT_FALLBACKS["Sedan"])
        phys_path = "frontend/public" + sinfo["photoUrl"]
        if not os.path.exists(phys_path):
            stats["broken"] += 1
            print(f"[ERROR] Broken fallback asset: {phys_path}")

        entry = {
            "canonicalBrand": brand,
            "datasetModel": model,
            "bodyStyle": body_style,
            "yearRange": year_range,
            "generation": "Market Segment Reference",
            "photoUrl": sinfo["photoUrl"],
            "previewImage": sinfo["photoUrl"],
            "verificationStatus": "segment-fallback",
            "matchTier": "segment-fallback",
            "badgeLabel": f"Segment Reference: {body_style}",
            "badgeTone": "amber",
            "isFallback": True,
            "fallbackReason": f"Showing representative {body_style} reference asset. Verified photoshoot for {brand} {model} is pending curation.",
            "attribution": {
                "author": "AutoValuate Automotive Media Registry",
                "source": "Verified Segment Reference Collection",
                "license": "CC BY-SA 4.0",
                "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
            },
            "curatorNotes": f"Representative vehicle imagery reflecting the {body_style} form factor and dimensional stance.",
            "dimensions": sinfo["dims"],
            "has3DModel": False
        }
        stats["segmentFallback"] += 1
        models_still_needing_photos.append(f"{brand} | {model}")
        registry.append(entry)

    # Save to JSON
    out_json = "frontend/src/data/vehicle-image-registry.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

    # Save models still needing images manifest
    out_missing = "frontend/src/data/models-pending-photoshoots.json"
    with open(out_missing, "w", encoding="utf-8") as f:
        json.dump(models_still_needing_photos, f, indent=2)

    exact_pct = round((stats["exact"] / stats["total"]) * 100, 2)
    usable_pct = round(((stats["exact"] + stats["compatible"]) / stats["total"]) * 100, 2)

    print("=" * 60)
    print(" VEHICLE IMAGE REGISTRY COMPILED")
    print("=" * 60)
    print(f"Total Unique Dataset Models: {stats['total']}")
    print(f"Exact Verified Models       : {stats['exact']} ({exact_pct}%)")
    print(f"Compatible Platform Models  : {stats['compatible']}")
    print(f"Total Usable Verified Models: {stats['exact'] + stats['compatible']} ({usable_pct}%)")
    print(f"Segment Fallback Models     : {stats['segmentFallback']}")
    print(f"Broken Image Paths          : {stats['broken']}")
    print("=" * 60)

if __name__ == "__main__":
    main()

