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

0.00.5
- Changed the opening scene so the player starts inside the ruined house.
- Added a Three.js interior room with walls, ceiling, floor, door opening, and a small table.
- Limited movement to the room until the door interaction moves the player outside.

0.00.6
- Added 3D zombie health bars above living zombies.
- Added player-centered 16x16 terrain chunks so the outside world continues as the player walks.
- Darkened the world lighting and added a flashlight with 50% starting battery and 1% drain every 2 seconds.
- Added a battery pickup inside the house and a flashlight battery UI.
- Improved the first-person held weapon pose with a visible hand and forearm.

0.00.7
- Hardened the Three.js cleanup path so refreshing the page cannot crash while the WebGL canvas is being removed.
- Added WebGL context-loss handling during refresh and switched to the current Three.js shadow map option.

