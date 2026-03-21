#!/usr/bin/env python3
"""Generate files.json manifest for GitHub Pages file browser."""
import os
import json

IGNORE_DIRS = {".git"}
IGNORE_FILES = {"LICENSE", "README.md", "generate_manifest.py", "index.html"}


def build_tree(root):
    tree = {}
    for dirpath, dirnames, filenames in os.walk(root, topdown=True):
        dirnames[:] = sorted(d for d in dirnames if d not in IGNORE_DIRS and not d.startswith("."))
        filenames = sorted(f for f in filenames if f not in IGNORE_FILES and not f.startswith("."))

        rel = os.path.relpath(dirpath, root)
        if rel == ".":
            rel = ""

        node = tree
        if rel:
            for part in rel.split("/"):
                node = node.setdefault(part, {})

        node["__files__"] = [
            {"name": f, "size": os.path.getsize(os.path.join(dirpath, f))}
            for f in filenames
        ]
    return tree


if __name__ == "__main__":
    tree = build_tree(".")
    with open("files.json", "w") as fh:
        json.dump(tree, fh, separators=(",", ":"))
    print(f"files.json written ({os.path.getsize('files.json')} bytes)")
