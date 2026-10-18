"""
Unit Tests for Data Preprocessing and Feature Extraction
"""

import math
import numpy as np
import pandas as pd
import pytest

from backend.ml.pipeline import (
    parse_mileage_to_numeric,
    clean_currency_to_float,
    extract_manufacturing_year,
    extract_engine_displacement,
    extract_state_from_location,
    clean_dataset
)


def test_parse_mileage_range():
    assert parse_mileage_to_numeric("70 - 75K KM") == 72500.0
    assert parse_mileage_to_numeric("0 - 5K KM") == 2500.0
    assert parse_mileage_to_numeric("105 - 110K KM") == 107500.0


def test_parse_mileage_single():
    assert parse_mileage_to_numeric("88300 KM") == 88300.0
    assert parse_mileage_to_numeric("118777 KM") == 118777.0


def test_parse_mileage_invalid():
    assert np.isnan(parse_mileage_to_numeric(None))
    assert np.isnan(parse_mileage_to_numeric("Invalid"))


def test_clean_currency_to_float():
    assert clean_currency_to_float("RM 83,000") == 83000.0
    assert clean_currency_to_float("RM 105,400") == 105400.0
    assert clean_currency_to_float("RM 1,172,000") == 1172000.0
    assert clean_currency_to_float("RM 32,600 / month") == 32600.0
    assert np.isnan(clean_currency_to_float(None))


def test_extract_manufacturing_year():
    assert extract_manufacturing_year("2018 Honda Civic 1.5 TC VTEC") == 2018.0
    assert extract_manufacturing_year("2012/2013 Mercedes-Benz C200") == 2013.0
    assert extract_manufacturing_year("2016/2017 Audi Q3 1.4 TFSI") == 2017.0
    assert np.isnan(extract_manufacturing_year(""))
    assert np.isnan(extract_manufacturing_year(None))


def test_extract_engine_displacement():
    assert extract_engine_displacement("2014 BMW X6 3.0 xDrive35i SUV") == 3.0
    assert extract_engine_displacement("2018 Honda Civic 1.5 TC") == 1.5
    assert extract_engine_displacement("2016 Mercedes-Benz S400L 3.5 Hybrid") == 3.5
    assert extract_engine_displacement("2017 Kia Rio 1.4 X Sedan") == 1.4
    assert np.isnan(extract_engine_displacement("Car with no engine info"))


def test_extract_state_from_location():
    assert extract_state_from_location("Selangor, Kajang") == "Selangor"
    assert extract_state_from_location("Kuala Lumpur, Cheras") == "Kuala Lumpur"
    assert extract_state_from_location("Penang, Bukit Mertajam") == "Penang"
    assert extract_state_from_location("Johor, Skudai") == "Johor"
    assert extract_state_from_location("Putrajaya, Putrajaya") == "Putrajaya"
    assert extract_state_from_location(None) == "Unknown"
