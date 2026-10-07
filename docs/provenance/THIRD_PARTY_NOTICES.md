# Third-Party Notices — `public/models/home-brain/`

`brain-points.bin` and `brain-poster.webp` are derived only from subject `sub-01` of OpenNeuro dataset
**ds006128**, "Data for 'Modeling 2D Spatio-Tactile Population Receptive Fields of the Fingertip in Human Primary
Somatosensory Cortex'":

- Repository: https://github.com/OpenNeuroDatasets/ds006128
- Snapshot: `1.0.11` — DOI https://doi.org/10.18112/openneuro.ds006128.v1.0.11
- License: CC0 1.0 Universal (https://creativecommons.org/publicdomain/zero/1.0/)
- Inputs (FreeSurfer derivatives, SHA-256 checked by the generator): `surf/lh.pial.T1`, `surf/rh.pial.T1`,
  `surf/lh.sulc`, `surf/rh.sulc`, `mri/aseg.mgz`. Exact URLs and hashes: `manifest.json`.
- Changes: points sampled on the pial surfaces by area × sulcal depth (gyral crowns kept, sulcal fundi thinned), plus
  shell points of the aseg cerebellum and brain stem; centered, uniformly scaled and quantized to int16 with a fixed
  seed. The poster is a render of the same points. Generator: `apps/blog/scripts/prepare-home-brain.mjs`.

No third-party application code or processed mesh is used. Marker positions on the page are conceptual and do not
claim any anatomical localization of executive functions.
