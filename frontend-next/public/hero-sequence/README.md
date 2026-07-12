# Hero sequence frames

Cinematic scroll-scrub frames for the MedPrepAI landing hero.

## Replace with production assets

Export **180–240 WebP/PNG frames** from Blender/Cinema4D and drop them here:

```
frame0001.webp
frame0002.webp
…
frame0180.webp
```

Mobile variants (lower resolution, same choreography):

```
mobile/frame0001.webp
…
```

## Regenerate placeholders

```bash
yarn hero:frames
```

Placeholders are procedural stand-ins until final 3D renders are ready.
