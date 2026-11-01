import csv
import json
import os
from collections import defaultdict

def main():
    csv_path = 'backend/data/Resale_car_installment_clean.csv'
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    models = defaultdict(lambda: {
        'brand': '',
        'model': '',
        'years': [],
        'prices': [],
        'descriptions': [],
        'count': 0
    })

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            b = r['Brand'].strip()
            m = r['Model'].strip()
            key = (b, m)
            models[key]['brand'] = b
            models[key]['model'] = m
            models[key]['count'] += 1
            try:
                yr = int(float(r['Year']))
                models[key]['years'].append(yr)
            except:
                pass
            try:
                p = float(r['List_Price'])
                models[key]['prices'].append(p)
            except:
                pass
            desc = r.get('Description', '').strip()
            if desc and len(models[key]['descriptions']) < 5:
                models[key]['descriptions'].append(desc)

    inventory = []
    for (b, m), d in sorted(models.items(), key=lambda x: (x[0][0], x[0][1])):
        yrs = d['years']
        prices = d['prices']
        inventory.append({
            'brand': b,
            'model': m,
            'count': d['count'],
            'minYear': min(yrs) if yrs else None,
            'maxYear': max(yrs) if yrs else None,
            'avgPrice': round(sum(prices) / len(prices), 2) if prices else 0,
            'minPrice': min(prices) if prices else 0,
            'maxPrice': max(prices) if prices else 0,
            'sampleDescriptions': d['descriptions']
        })

    os.makedirs('frontend/src/data', exist_ok=True)
    out_path = 'frontend/src/data/vehicle-inventory.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2)

    print(f"Successfully generated inventory of {len(inventory)} unique vehicle models to {out_path}.")

if __name__ == '__main__':
    main()

