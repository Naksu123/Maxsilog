import json
import os

def test_models():
    reg_path = "frontend/src/data/vehicle-image-registry.json"
    with open(reg_path, "r", encoding="utf-8") as f:
        registry = json.load(f)

    reg_map = {item["datasetModel"].lower().strip(): item for item in registry}

    test_cases = [
        {"brand": "Kia", "model": "Kia Sportage", "expected_tier": "exact", "expected_asset": "kia_sportage.jpg"},
        {"brand": "Kia", "model": "Kia Cerato", "expected_tier": "exact", "expected_asset": "kia_cerato.jpg"},
        {"brand": "Toyota", "model": "Toyota Vios", "expected_tier": "exact", "expected_asset": "toyota_vios.jpg"},
        {"brand": "Toyota", "model": "Toyota Alphard", "expected_tier": "exact", "expected_asset": "toyota_alphard.jpg"},
        {"brand": "Honda", "model": "Honda Civic", "expected_tier": "exact", "expected_asset": "honda_civic.jpg"},
        {"brand": "Perodua", "model": "Perodua Myvi", "expected_tier": "exact", "expected_asset": "perodua_myvi.jpg"},
        {"brand": "BMW", "model": "BMW X1", "expected_tier": "exact", "expected_asset": "bmw_x1.jpg"},
        {"brand": "BYD", "model": "BYD Dolphin Dynamic Standard", "expected_tier": "exact", "expected_asset": "byd_dolphin.jpg"},
        {"brand": "Chery", "model": "Chery Omoda 5 1.5", "expected_tier": "exact", "expected_asset": "chery_omoda5.jpg"},
        # Additional brands from remaining dataset
        {"brand": "Mazda", "model": "Mazda CX-5", "expected_tier": "exact", "expected_asset": "mazda_cx5.jpg"},
        {"brand": "Mitsubishi", "model": "Mitsubishi Triton", "expected_tier": "exact", "expected_asset": "mitsubishi_triton.jpg"},
        {"brand": "Volkswagen", "model": "Volkswagen Golf", "expected_tier": "exact", "expected_asset": "volkswagen_golf.jpg"},
        {"brand": "Ford", "model": "Ford Ranger", "expected_tier": "exact", "expected_asset": "ford_ranger.jpg"},
        {"brand": "Isuzu", "model": "Isuzu D-Max", "expected_tier": "exact", "expected_asset": "isuzu_dmax.jpg"},
        {"brand": "Nissan", "model": "Nissan Almera", "expected_tier": "exact", "expected_asset": "nissan_almera.jpg"},
        {"brand": "Audi", "model": "Audi A4", "expected_tier": "exact", "expected_asset": "audi_a4.jpg"},
        # Compatible platform cases
        {"brand": "BMW", "model": "BMW 330e", "expected_tier": "compatible", "expected_asset": "bmw_3series.jpg"},
        {"brand": "Mercedes-Benz", "model": "Mercedes-Benz C200", "expected_tier": "compatible", "expected_asset": "mercedes_cclass.jpg"},
        # Uncurated model (should return honest body-style fallback, NEVER Honda or BMW)
        {"brand": "Porsche", "model": "Porsche Macan", "expected_tier": "segment-fallback", "expected_asset": "fallback_suv.jpg"},
        {"brand": "Hyundai", "model": "Hyundai Grand Starex", "expected_tier": "segment-fallback", "expected_asset": "fallback_mpv.jpg"},
    ]

    print("=" * 75)
    print(" REPRESENTATIVE BRAND & MODEL VERIFICATION SUITE")
    print("=" * 75)

    all_passed = True
    for tc in test_cases:
        m_lower = tc["model"].lower().strip()
        entry = reg_map.get(m_lower)
        if not entry:
            print(f"[FAIL] Missing mapping for {tc['model']}")
            all_passed = False
            continue

        resolved_asset = os.path.basename(entry["photoUrl"])
        tier = entry["matchTier"]
        status = entry["verificationStatus"]
        is_fallback = entry["isFallback"]
        badge = entry["badgeLabel"]

        # Check for Honda/BMW misattribution
        if tc["brand"] not in ["Honda", "BMW"] and ("honda" in resolved_asset or "bmw" in resolved_asset):
            print(f"[CRITICAL FAIL] Unrelated Brand Leakage! {tc['brand']} {tc['model']} resolved to {resolved_asset}")
            all_passed = False
            continue

        asset_match = (resolved_asset == tc["expected_asset"])
        tier_match = (tier == tc["expected_tier"])

        if asset_match and tier_match:
            print(f" [PASS] {tc['brand']:12} | {tc['model']:30} -> {resolved_asset:20} [{badge}]")
        else:
            print(f" [FAIL] {tc['brand']:12} | {tc['model']:30} -> Got: {resolved_asset} ({tier}), Expected: {tc['expected_asset']} ({tc['expected_tier']})")
            all_passed = False

    print("=" * 75)
    if all_passed:
        print(" ALL REPRESENTATIVE TEST CASES PASSED WITH 100% ACCURACY & HONEST ATTRIBUTION.")
    else:
        print(" SOME TEST CASES FAILED.")
    print("=" * 75)

if __name__ == "__main__":
    test_models()
