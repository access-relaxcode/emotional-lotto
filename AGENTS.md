# Project workflow

- The user authorizes publishing verified improvements to the existing public GitHub repository `access-relaxcode/emotional-lotto` after each requested update. Preserve unrelated remote changes, record the version in CHANGELOG.md, and verify uploaded contents. Do not publish to the separate MOODRIVE repository for lottery changes.
- Preserve direct-file execution: use plain HTML/CSS/JavaScript and local assets without requiring a build or server.
- Test lottery ranges and uniqueness with `node --test tests/lottery.test.cjs`; check browser flows and small screens for relevant UI changes.
- Preserve theme, volume, mute, reduced motion, and the ball → flap → ball sequence.
