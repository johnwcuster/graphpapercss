# 0.2.3 to 1.0 geometry changes

Baseline: [released 0.2.3 CSS](https://cdn.jsdelivr.net/gh/johnwcuster/graphpapercss@0.2.3/css/main.css), retained at `css/legacy/main.css`. SHA-256: `8bcfdcd401bfa53752569c4eb6c01400b20e27f4d36b87b53db7cf9b1cac60dc`.

All 72 released grid IDs are represented in the 1.0 architecture, available in the released 0.4.0 preview. Across neat, thin, and wide fields, 204 macro geometries match exactly. The twelve intentional changes below replace half-bit edges with whole-bit coordinates. Maximum edge displacement is 0.5 bit; formerly equal small columns differ by one bit. These replacements are frozen in `src/ruler/accepted-changes.mjs`. Full and ruled fields are new designed extents, not legacy parity claims.

| Grid | Field | 0.2.3 widths (bits) | 1.0 widths (bits) | 1.0 intervals (bits) |
| --- | --- | --- | --- | --- |
| grid_03a | neat | 25 / 17.5 / 17.5 | 25 / 18 / 17 | 2–27, 27–45, 45–62 |
| grid_03a | thin | 24 / 16.5 / 16.5 | 24 / 17 / 16 | 2–26, 27–44, 45–61 |
| grid_03a | wide | 23 / 15.5 / 15.5 | 23 / 16 / 15 | 3–26, 28–44, 46–61 |
| grid_03b | neat | 17.5 / 17.5 / 25 | 18 / 17 / 25 | 2–20, 20–37, 37–62 |
| grid_03b | thin | 16.5 / 16.5 / 24 | 17 / 16 / 24 | 2–19, 20–36, 37–61 |
| grid_03b | wide | 15.5 / 15.5 / 23 | 16 / 15 / 23 | 3–19, 21–36, 38–61 |
| grid_03c | neat | 17.5 / 25 / 17.5 | 18 / 25 / 17 | 2–20, 20–45, 45–62 |
| grid_03c | thin | 16.5 / 24 / 16.5 | 17 / 24 / 16 | 2–19, 20–44, 45–61 |
| grid_03c | wide | 15.5 / 23 / 15.5 | 16 / 23 / 15 | 3–19, 21–44, 46–61 |
| grid_03d | neat | 17.5 / 25 / 17.5 | 18 / 25 / 17 | 2–20, 20–45, 45–62 |
| grid_03d | thin | 16.5 / 24 / 16.5 | 17 / 24 / 16 | 2–19, 20–44, 45–61 |
| grid_03d | wide | 15.5 / 23 / 15.5 | 16 / 23 / 15 | 3–19, 21–44, 46–61 |

Coordinates are zero-based ruler bits. CSS line indices are coordinates plus one. See [visual comparisons with 0.2.3](geometry-changes.html).
