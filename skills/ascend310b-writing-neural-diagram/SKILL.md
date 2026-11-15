---
name: ascend310b-writing-neural-diagram
description: Audit TikZ neural-network and encoder-decoder diagrams for connector paths crossing module or text boxes. Use when drawing, reviewing, or repairing a neural-network architecture figure.
---

# Neural diagram path audit

Use `ascend310b_writing_neural_diagram_audit` after changing a TikZ neural-network diagram. The audit is geometry-first: it does not infer intent from appearance and it does not certify a figure merely because LaTeX compiles.

## Required layout contract

Keep a sidecar JSON beside the TikZ source, normally `<source>.layout.json`:

```json
{
  "boxes": [
    {"name": "encoder_attention", "kind": "module", "rect": [0.5, 2.0, 2.5, 2.5]}
  ],
  "paths": [
    {
      "name": "encoder_residual_1",
      "polyline": [[0.5, 2.0], [0.2, 2.0], [0.2, 2.5], [0.5, 2.5]],
      "allowed_boxes": []
    }
  ]
}
```

Coordinates must use the same TikZ canvas as the source. `rect` is `[xmin, ymin, xmax, ymax]`. A path is a polyline of points. A path may enter only boxes explicitly listed in `allowed_boxes`; touching a box boundary is reported as a collision. A deliberate T-junction may declare the other path name in `allow_crossing_with`; this suppresses only that declared path-pair warning and does not suppress box collisions.

## Review sequence

1. Name every visible module/text rectangle in the sidecar.
2. Represent every arrow and residual route as a polyline, including intermediate corners.
3. Run the tool with the source and sidecar.
4. Fix every `error` before visual review. Treat path crossings as warnings unless the crossing is semantically intentional and declared with `allow_crossing_with` in the sidecar.
5. Compile the PDF and inspect the final-size render. Geometry audit catches source-coordinate collisions; raster review catches labels, arrowheads, and glyphs that visually touch after scaling.

## Routing rules for neural diagrams

- Main flow uses the centerline between consecutive modules.
- Residual routes use a dedicated outer channel on the encoder or decoder side; never run a vertical residual segment through another module.
- Encoder-to-decoder `K,V` uses the empty gap between columns, with its label outside all boxes.
- Factor-modulation paths use a separate dashed outer channel or a dashed projector box; do not draw long dashed lines through explanatory text.
- Input/output arrows attach to node anchors (`.north`, `.south`, `.east`, `.west`) rather than guessed coordinates.

## Limits

The audit cannot recover exact node dimensions from arbitrary TikZ styles. The sidecar is an explicit geometry contract and must be updated when boxes move. A passing audit is necessary but not sufficient: compile and inspect the final PDF at the manuscript's actual size.
