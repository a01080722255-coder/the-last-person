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

0.00.8
- Optimized the Three.js scene so chunks, world objects, entities, and the held weapon rebuild only when their own data changes.
- Reduced per-frame React updates by stabilizing walking state and updating zombie movement at a lower simulation tick.
- Lowered WebGL pixel ratio and disabled expensive realtime shadows while keeping the blocky shapes and world layout intact.
- Memoized visible world item and object lists to avoid unnecessary scene work during movement.
- Updated the server-render test to validate the current game shell instead of the removed starter skeleton.

0.00.9
- Upgraded block textures with cached pixel-style procedural materials while preserving the optimized scene structure.
- Made zombie health bars brighter, billboarded, and depth-independent so they stay visible.
- Made melee and gun hit detection more forgiving and show remaining zombie health on hit.
- Added the missing third-person player arm and legs.
- Removed forced WebGL context loss during cleanup to prevent refresh crashes.
- Added one-time refresh recovery for stale dynamically imported game chunks after deployment.

0.00.10
- Fixed sticky movement input by clearing WASD when the browser loses focus, pointer lock exits, or the game pauses.
- Changed Space into a jump key and kept attacks on mouse click so jumping no longer triggers weapon actions.
- Added Minecraft-like biome chunks with plains, desert, scrub terrain, and sparse block props while preserving the optimized chunk window.
- Let outside-world zombies move beyond the original map bounds and spawn near the player in distant chunks.
- Hardened refresh recovery so stale chunk reloads cannot loop repeatedly.

