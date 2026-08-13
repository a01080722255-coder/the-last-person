This is the update log. Write like this. 0.00.1

0.00.14
- Added an in-game settings menu for Korean/English UI switching, SFX volume, footsteps volume, and mouse sensitivity.
- Paused movement and camera input while settings or crafting panels are open.
- Fixed the broken flashlight HUD label.
- Lowered zombie pressure and changed the health display to 10 Minecraft-style hearts with half-heart support.
- Added a centered create-world start screen with saved world name and Easy/Hard difficulty selection.
- Added Light/Normal/High graphics modes that adjust WebGL quality and scene fog.
- Added visible attack motion in Normal and High graphics modes and exposed weapon range in combat UI.

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

0.00.11
- Added outside-world food spawning so infinite chunks keep producing survival items near the player.
- Limited spawned food density and cleaned up faraway spawned food to protect performance during long exploration.
- Re-anchored the first-person hand and weapon to the camera so the arm no longer points away from the view.

0.00.12
- Split Three.js entities into separate zombie, item, and player render groups so movement updates rebuild less of the scene.
- Reduced zombie simulation update frequency slightly to lower React and WebGL churn during exploration.

0.00.13
- Added Vercel-specific project settings so Vercel builds the app as Next.js instead of using the Vinext/Sites build.
- Removed Google-hosted next/font usage to prevent Vercel/CI build failures caused by font fetch errors.
- Added a local Three.js module declaration so Vercel's Next.js type check can complete without an extra install.
- Added a Cloudflare workers module declaration so unused Sites database helpers do not break Vercel type checking.
- Excluded generated build and deployment folders from TypeScript checks so Vercel does not scan stale worker artifacts.
- Excluded Cloudflare-only worker and database helper folders from Vercel's Next.js type check.

