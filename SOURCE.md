# Sources and attribution

This repository is the maintained home of the merged DSH writing suite.

## Bundled modules

| Component | Origin | License | Relationship |
| --- | --- | --- | --- |
| `lib/paper`, paper skills | `zhouxzh/dsh-paper-suite`, now renamed `zhouxzh/dsh-writing-suite` | MIT | Original first-party paper tooling |
| `lib/book`, tutorial-writing tools and skills | `zhouxzh/Ascend310`, `tools/dsh-plugin-ascend310b-writing` | MIT | Copied working-tree implementation into the unified suite |
| `lib/diagram`, TikZ path audit skill | local `dsh-writing-neural-diagram-audit` companion | MIT | Promoted from companion plugin into the suite |
| `scientific-writing` skill | [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | MIT; shipped `LICENSE`/`SOURCE.md` retained | Vendored skill tree |
| `nature-polishing` and `nature-shared` skills | [Yuan1z0825/nature-skills](https://github.com/Yuan1z0825/nature-skills) | Apache-2.0; shipped `LICENSE`/`SOURCE.md` retained | Vendored skill trees |

The skill subdirectories retain their original license and source documents. Do not remove those files when packaging.

## Merge boundary

The merge unifies:

- package installation and versioning;
- one Host entry with stable legacy tool names;
- one browser sidebar and panel;
- one configuration surface (`tutorialRoot`, `paperRoot`, shared `repoRoot` fallback);
- skill installation across the combined skill collection.

Domain rules remain separated in `lib/book`, `lib/paper`, and `lib/diagram` so the modules can be tested and changed independently.
