This is the update log. Write like this. 0.00.1

0.00.2
- Fixed first-person movement so WASD follows the direction the player is looking.
- Fixed strafing being blocked in some sections by removing the indoor Y-axis movement clamp.
- Split first-person character and hand styling into app/game-first-person.css so each file stays under 1000 lines.

0.00.3
- Added vertical mouse look for the first-person camera.
- Increased first-person camera tracking so the view follows the player instead of feeling centered on the map.
- Kept WASD movement aligned to the current horizontal viewing direction.

0.00.4
- Refactored the game view to use Three.js instead of CSS-based 2.5D projection.
- Added a real WebGL scene with 3D ground, roads, buildings, zombies, interactable objects, item billboards, and a first-person weapon.
- Verified the Three.js canvas renders nonblank pixels in the local browser preview.

