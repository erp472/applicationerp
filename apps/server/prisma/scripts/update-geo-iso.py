#!/usr/bin/env python3
"""
Actualiza paises.iso2, iso3, phonecode, region usando dr5hn/countries-states-cities-database.
Matching por nombre en español (translations.es).
Marca activo=true solo en departamentos de Colombia (paises_idpaises=82).
"""

import json
import re
import unicodedata
import urllib.request
import psycopg2

DB_URL = "postgresql://postgres:123456@localhost:5432/pos_472"
DR5HN_COUNTRIES = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries.json"

def normalize(s: str) -> str:
    """Lowercase, sin acentos, sin caracteres especiales."""
    s = s.lower().strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9\s]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s

def fetch_dr5hn():
    print("→ Descargando dr5hn countries.json...")
    with urllib.request.urlopen(DR5HN_COUNTRIES) as r:
        return json.loads(r.read().decode("utf-8"))

def build_lookup(countries):
    """Mapa: nombre_normalizado → {iso2, iso3, phonecode, region}"""
    lookup = {}
    for c in countries:
        fields = {
            "iso2":      c.get("iso2"),
            "iso3":      c.get("iso3"),
            "phonecode": c.get("phonecode"),
            "region":    c.get("region"),
        }
        # nombre principal en inglés
        lookup[normalize(c["name"])] = fields
        # traducción al español
        es = c.get("translations", {}).get("es")
        if es:
            lookup[normalize(es)] = fields
    return lookup

# Correcciones manuales: nombre_bd_normalizado → iso2
MANUAL = {
    "afganistan":         "AF",
    "alemania":           "DE",
    "arabia saudita":     "SA",
    "antillas holandesas": "AN",
    "birmania":           "MM",
    "bielorrusia":        "BY",
    "butan":              "BT",
    "cabo verde":         "CV",
    "corea del norte":    "KP",
    "corea del sur":      "KR",
    "costa de marfil":    "CI",
    "emiratos arabes":    "AE",
    "emiratos arabes unidos": "AE",
    "estados unidos":     "US",
    "filipinas":          "PH",
    "guinea ecuatorial":  "GQ",
    "guinea bissau":      "GW",
    "islas caiman":       "KY",
    "islas cook":         "CK",
    "islas faroe":        "FO",
    "islas malvinas":     "FK",
    "islas marshall":     "MH",
    "islas salomon":      "SB",
    "islas virgenes americanas": "VI",
    "islas virgenes britanicas": "VG",
    "nueva zelanda":      "NZ",
    "paises bajos":       "NL",
    "papua nueva guinea": "PG",
    "reino unido":        "GB",
    "republica centroafricana": "CF",
    "republica checa":    "CZ",
    "republica democratica del congo": "CD",
    "republica del congo": "CG",
    "republica dominicana": "DO",
    "saint kitts y nevis": "KN",
    "san cristobal y nieves": "KN",
    "san marino":         "SM",
    "san vicente y las granadinas": "VC",
    "santo tome y principe": "ST",
    "sierra leona":       "SL",
    "sri lanka":          "LK",
    "surinam":            "SR",
    "suecia":             "SE",
    "timor oriental":     "TL",
    "trinidad y tobago":  "TT",
    "turquia":            "TR",
    "ucrania":            "UA",
}

def main():
    dr5hn = fetch_dr5hn()
    lookup = build_lookup(dr5hn)

    # Índice rápido iso2 → campos completos
    iso2_index = {c["iso2"]: c for c in dr5hn}

    conn = psycopg2.connect(
        host="localhost", port=5432,
        dbname="pos_472", user="postgres", password="123456"
    )
    cur = conn.cursor()

    cur.execute("SELECT idpaises, nombrepaises FROM paises ORDER BY idpaises")
    rows = cur.fetchall()

    matched = 0
    unmatched = []

    for pid, nombre in rows:
        key = normalize(nombre)
        data = lookup.get(key)

        if not data:
            # intento con correcciones manuales
            iso2 = MANUAL.get(key)
            if iso2 and iso2 in iso2_index:
                c = iso2_index[iso2]
                data = {
                    "iso2":      c.get("iso2"),
                    "iso3":      c.get("iso3"),
                    "phonecode": c.get("phonecode"),
                    "region":    c.get("region"),
                }

        if data:
            cur.execute(
                """UPDATE paises
                   SET iso2=%(iso2)s, iso3=%(iso3)s, phonecode=%(phonecode)s, region=%(region)s
                   WHERE idpaises=%(id)s""",
                {**data, "id": pid}
            )
            matched += 1
        else:
            unmatched.append((pid, nombre, key))

    print(f"✓ Países actualizados: {matched}/{len(rows)}")
    if unmatched:
        print(f"⚠ Sin match ({len(unmatched)}):")
        for pid, nombre, key in unmatched:
            print(f"  id={pid}  nombre='{nombre}'  key='{key}'")

    # Marcar activo=false en departamentos que NO son de Colombia (id=82)
    cur.execute("UPDATE departamentos SET activo=false WHERE paises_idpaises != 82")
    cur.execute("UPDATE departamentos SET activo=true  WHERE paises_idpaises = 82")
    print("✓ Departamentos: solo Colombia activos")

    # Ciudades: solo hay ciudades de Colombia en la BD, todas activas
    cur.execute("UPDATE ciudades SET activo=true")
    print("✓ Ciudades: todas activas (solo Colombia está sembrada)")

    conn.commit()
    cur.close()
    conn.close()
    print("✓ Listo.")

if __name__ == "__main__":
    main()
