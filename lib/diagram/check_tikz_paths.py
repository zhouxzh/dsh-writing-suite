#!/usr/bin/env python3
"""Geometry audit for TikZ neural diagrams.

The source is used for provenance and the JSON sidecar is the authoritative
layout contract. Coordinates use the same TikZ canvas as the source. A path is
a list of points; boxes are axis-aligned rectangles. The audit is conservative:
segments touching a box boundary are reported as collisions.
"""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path


def parse_source(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    nodes = re.findall(r"\\node[^\n]*\(([^)]+)\)", text)
    draws = re.findall(r"\\draw(?:\[[^]]*\])?\s+([^;]+);", text)
    return {"source": str(path), "node_names": nodes, "draw_count": len(draws)}


def point(value):
    return (float(value[0]), float(value[1]))


def normalize_box(item):
    x0, y0, x1, y1 = item["rect"]
    return {
        "name": item["name"],
        "rect": [min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)],
        "kind": item.get("kind", "module"),
    }


def orient(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def on_segment(a, b, p, eps=1e-9):
    return min(a[0], b[0]) - eps <= p[0] <= max(a[0], b[0]) + eps and min(a[1], b[1]) - eps <= p[1] <= max(a[1], b[1]) + eps


def segments_intersect(a, b, c, d):
    o1, o2, o3, o4 = orient(a, b, c), orient(a, b, d), orient(c, d, a), orient(c, d, b)
    if (o1 > 0) != (o2 > 0) and (o3 > 0) != (o4 > 0):
        return True
    return ((abs(o1) < 1e-9 and on_segment(a, b, c)) or
            (abs(o2) < 1e-9 and on_segment(a, b, d)) or
            (abs(o3) < 1e-9 and on_segment(c, d, a)) or
            (abs(o4) < 1e-9 and on_segment(c, d, b)))


def proper_path_crossing(a, b, c, d):
    if not segments_intersect(a, b, c, d):
        return False
    endpoints = (a, b, c, d)
    for p in (a, b):
        for q in (c, d):
            if math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9:
                return False
    return True


def point_in_box(p, rect, margin):
    x0, y0, x1, y1 = rect
    return x0 - margin <= p[0] <= x1 + margin and y0 - margin <= p[1] <= y1 + margin


def segment_hits_box(a, b, rect, margin):
    x0, y0, x1, y1 = rect
    expanded = [x0 - margin, y0 - margin, x1 + margin, y1 + margin]
    if point_in_box(a, expanded, 0) or point_in_box(b, expanded, 0):
        return True
    corners = [(expanded[0], expanded[1]), (expanded[2], expanded[1]),
               (expanded[2], expanded[3]), (expanded[0], expanded[3])]
    edges = list(zip(corners, corners[1:] + corners[:1]))
    return any(segments_intersect(a, b, c, d) for c, d in edges)


def make_suggestions(boxes, paths):
    xs = [v for b in boxes for v in (b["rect"][0], b["rect"][2])]
    ys = [v for b in boxes for v in (b["rect"][1], b["rect"][3])]
    if not xs or not ys:
        return []
    left, right, top, bottom = min(xs) - 0.35, max(xs) + 0.35, min(ys) - 0.35, max(ys) + 0.35
    return [
        {"name": "left_outer_channel", "polyline": [[left, top], [left, bottom]]},
        {"name": "right_outer_channel", "polyline": [[right, top], [right, bottom]]},
        {"name": "top_channel", "polyline": [[left, top], [right, top]]},
        {"name": "bottom_channel", "polyline": [[left, bottom], [right, bottom]]},
    ]


def audit(source, layout, margin, suggestions):
    source_info = parse_source(source)
    boxes = [normalize_box(b) for b in layout.get("boxes", [])]
    paths = layout.get("paths", [])
    findings = []
    for path in paths:
        points = [point(p) for p in path.get("polyline", [])]
        if len(points) < 2:
            findings.append({"severity": "error", "path": path.get("name"), "message": "path has fewer than two points"})
            continue
        allowed = set(path.get("allowed_boxes", []))
        for i, (a, b) in enumerate(zip(points, points[1:]), 1):
            for box in boxes:
                if box["name"] in allowed:
                    continue
                if segment_hits_box(a, b, box["rect"], margin):
                    findings.append({"severity": "error", "path": path.get("name"), "segment": i, "box": box["name"], "message": "connector segment crosses or touches a box"})
    for i, first in enumerate(paths):
        a_points = [point(p) for p in first.get("polyline", [])]
        for second in paths[i + 1:]:
            if ((first.get("allow_crossing_with") and second.get("name") in first["allow_crossing_with"]) or
                    (second.get("allow_crossing_with") and first.get("name") in second["allow_crossing_with"])):
                continue
            b_points = [point(p) for p in second.get("polyline", [])]
            for sa, sb in zip(a_points, a_points[1:]):
                for ta, tb in zip(b_points, b_points[1:]):
                    if proper_path_crossing(sa, sb, ta, tb):
                        findings.append({"severity": "warning", "path": first.get("name"), "other_path": second.get("name"), "message": "two connector paths cross"})
    result = {
        "ok": not any(f["severity"] == "error" for f in findings),
        "source": source_info,
        "boxes": len(boxes),
        "paths": len(paths),
        "margin": margin,
        "findings": findings,
    }
    if suggestions:
        result["suggested_channels"] = make_suggestions(boxes, paths)
    result["text"] = ("PASS" if result["ok"] else "FAIL") + f": {len(findings)} finding(s), {len(boxes)} boxes, {len(paths)} paths."
    return result


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True)
    ap.add_argument("--layout")
    ap.add_argument("--margin", type=float, default=0.04)
    ap.add_argument("--no-suggest", action="store_true")
    args = ap.parse_args()
    source = Path(args.source).resolve()
    layout_path = Path(args.layout).resolve() if args.layout else source.with_suffix(".layout.json")
    if not source.is_file():
        print(json.dumps({"ok": False, "text": f"source not found: {source}"}))
        return 1
    if not layout_path.is_file():
        print(json.dumps({"ok": False, "text": f"layout sidecar not found: {layout_path}; create it with boxes and paths"}))
        return 1
    try:
        layout = json.loads(layout_path.read_text(encoding="utf-8"))
        result = audit(source, layout, args.margin, not args.no_suggest)
    except Exception as exc:
        print(json.dumps({"ok": False, "text": f"layout parse/audit failed: {exc}"}))
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
