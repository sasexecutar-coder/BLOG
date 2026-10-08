#!/usr/bin/env python3
"""Baixa os insumos originais fixados no manifesto e verifica SHA-256 antes de publicar localmente."""
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parent
MANIFEST = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
DEST = ROOT / "source"
DEST.mkdir(exist_ok=True)

for name, source in MANIFEST["sources"].items():
    target = DEST / name
    expected = source["sha256"]
    if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() == expected:
        print(f"OK existente: {name}")
        continue
    partial = DEST / (name + ".partial")
    sha = hashlib.sha256()
    try:
        with urlopen(source["url"], timeout=30) as response, partial.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
                sha.update(chunk)
        if sha.hexdigest() != expected:
            raise ValueError(f"SHA-256 divergente em {name}: {sha.hexdigest()}")
        partial.replace(target)
        print(f"OK baixado: {name} ({target.stat().st_size} bytes)")
    finally:
        partial.unlink(missing_ok=True)
