"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Area = "countryside" | "city";

type SceneItem = {
  id: string;
  name: string;
  sprite: number;
  x: number;
  y: number;
  area: Area;
};

type SceneZombie = {
  id: string;
  x: number;
  y: number;
  hp: number;
  area: Area;
};

type SceneObject = {
  id: string;
  name: string;
  x: number;
  y: number;
  area: Area;
  type: "door" | "car" | "bench";
};

type SceneWeapon = {
  id: string;
  sprite: number;
};

type ThreeSceneProps = {
  area: Area;
  position: { x: number; y: number };
  angle: number;
  pitch: number;
  viewMode: "first" | "third";
  outside: boolean;
  walking: boolean;
  items: SceneItem[];
  zombies: SceneZombie[];
  objects: SceneObject[];
  currentWeapon?: SceneWeapon;
  flashlightOn: boolean;
};

const worldScale = 1.25;
const chunkSize = 16;
const materialCache = new Map<number, THREE.MeshStandardMaterial>();

function toWorld(value: { x: number; y: number }) {
  return new THREE.Vector3((value.x - 50) * worldScale, 0, (value.y - 50) * worldScale);
}

function makeBox(size: [number, number, number], color: number, position: THREE.Vector3) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    makeBlockMaterial(color),
  );
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeBlockMaterial(color: number) {
  const cached = materialCache.get(color);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  const base = new THREE.Color(color);
  if (context) {
    context.fillStyle = `#${base.getHexString()}`;
    context.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 8) {
      for (let x = 0; x < 64; x += 8) {
        const n = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + color) * 43758.5453;
        const shade = (n - Math.floor(n)) * 0.16 - 0.08;
        const pixel = base.clone().offsetHSL(0, 0, shade);
        context.fillStyle = `#${pixel.getHexString()}`;
        context.fillRect(x, y, 8, 8);
      }
    }
    context.strokeStyle = "rgba(0,0,0,0.18)";
    context.lineWidth = 2;
    context.strokeRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, map: texture, roughness: 0.88 });
  material.userData.shared = true;
  texture.userData.shared = true;
  materialCache.set(color, material);
  return material;
}

function makeItemTexture(source: THREE.Texture, sprite: number) {
  const texture = source.clone();
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.repeat.set(0.25, 1 / 3);
  texture.offset.set((sprite % 4) * 0.25, 1 - (Math.floor(sprite / 4) + 1) / 3);
  return texture;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((entry) => {
        if (!entry.userData.shared) {
          if ("map" in entry && entry.map && !entry.map.userData.shared) entry.map.dispose();
          entry.dispose();
        }
      });
    } else if (material) {
      if (!material.userData.shared) {
        if ("map" in material && material.map && !material.map.userData.shared) material.map.dispose();
        material.dispose();
      }
    }
  });
}

function clearGroup(group: THREE.Group) {
  group.children.forEach((child) => disposeObject(child));
  group.clear();
}

function makeZombie() {
  const zombie = new THREE.Group();
  const body = makeBox([1.25, 2.25, 0.72], 0x536246, new THREE.Vector3(0, 1.25, 0));
  const head = makeBox([0.96, 0.82, 0.82], 0x82906c, new THREE.Vector3(0, 2.95, 0));
  const leftArm = makeBox([0.32, 1.45, 0.34], 0x344331, new THREE.Vector3(-0.86, 1.35, 0.02));
  const rightArm = makeBox([0.32, 1.45, 0.34], 0x2d3b2d, new THREE.Vector3(0.86, 1.35, 0.02));
  const eye = makeBox([0.18, 0.12, 0.05], 0xc54f45, new THREE.Vector3(-0.2, 3.05, -0.44));
  const eye2 = makeBox([0.14, 0.12, 0.05], 0xe6ddc9, new THREE.Vector3(0.22, 3.05, -0.44));
  leftArm.rotation.z = -0.28;
  rightArm.rotation.z = 0.28;
  zombie.add(body, head, leftArm, rightArm, eye, eye2);
  return zombie;
}

function addZombieHealthBar(zombie: THREE.Group, hp: number, maxHp: number) {
  const ratio = THREE.MathUtils.clamp(hp / maxHp, 0, 1);
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 24;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "rgba(0,0,0,0.82)";
    context.fillRect(0, 0, 128, 24);
    context.strokeStyle = "rgba(255,255,255,0.7)";
    context.lineWidth = 3;
    context.strokeRect(1.5, 1.5, 125, 21);
    context.fillStyle = ratio > 0.5 ? "#63d27d" : ratio > 0.25 ? "#e1bf54" : "#e45b4f";
    context.fillRect(7, 7, Math.max(4, 114 * ratio), 10);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.name = "zombie-health";
  sprite.position.set(0, 3.75, 0);
  sprite.scale.set(2.5, 0.48, 1);
  sprite.renderOrder = 20;
  zombie.add(sprite);
}

function makePlayer() {
  const player = new THREE.Group();
  const body = makeBox([1, 1.8, 0.6], 0x59675f, new THREE.Vector3(0, 1.2, 0));
  const head = makeBox([0.72, 0.72, 0.72], 0x171b1a, new THREE.Vector3(0, 2.42, 0));
  const leftArm = makeBox([0.3, 1.1, 0.3], 0x3d4b45, new THREE.Vector3(-0.72, 1.2, -0.1));
  const rightArm = makeBox([0.3, 1.1, 0.3], 0x3d4b45, new THREE.Vector3(0.72, 1.2, -0.1));
  const leftLeg = makeBox([0.32, 0.9, 0.34], 0x202624, new THREE.Vector3(-0.25, 0.15, 0));
  const rightLeg = makeBox([0.32, 0.9, 0.34], 0x202624, new THREE.Vector3(0.25, 0.15, 0));
  player.add(body, head, leftArm, rightArm, leftLeg, rightLeg);
  return player;
}

function addInteriorRoom(group: THREE.Group) {
  const floor = makeBox([42, 0.18, 36], 0x5e5849, new THREE.Vector3(0, 0, 37.5));
  const backWall = makeBox([42, 5.8, 0.8], 0x24231e, new THREE.Vector3(0, 2.9, 20));
  const leftWall = makeBox([0.8, 5.8, 36], 0x1d1d19, new THREE.Vector3(-21, 2.9, 37.5));
  const rightWall = makeBox([0.8, 5.8, 36], 0x202018, new THREE.Vector3(21, 2.9, 37.5));
  const frontLeft = makeBox([16, 5.8, 0.8], 0x26241d, new THREE.Vector3(-13, 2.9, 55));
  const frontRight = makeBox([16, 5.8, 0.8], 0x26241d, new THREE.Vector3(13, 2.9, 55));
  const ceiling = makeBox([42, 0.22, 36], 0x151512, new THREE.Vector3(0, 6.1, 37.5));
  const mat = new THREE.MeshStandardMaterial({ color: 0x6d664f, roughness: 0.95 });
  const table = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.45, 2.8), mat);
  table.position.set(-10, 1.05, 32);
  const tableLegA = makeBox([0.35, 1, 0.35], 0x493923, new THREE.Vector3(-11.8, 0.5, 31));
  const tableLegB = makeBox([0.35, 1, 0.35], 0x493923, new THREE.Vector3(-8.2, 0.5, 31));
  const tableLegC = makeBox([0.35, 1, 0.35], 0x493923, new THREE.Vector3(-11.8, 0.5, 33));
  const tableLegD = makeBox([0.35, 1, 0.35], 0x493923, new THREE.Vector3(-8.2, 0.5, 33));
  group.add(floor, backWall, leftWall, rightWall, frontLeft, frontRight, ceiling, table, tableLegA, tableLegB, tableLegC, tableLegD);
}

function makeWeapon(weapon?: SceneWeapon) {
  if (!weapon) return null;
  const group = new THREE.Group();
  const sleeve = makeBox([0.44, 0.42, 1.18], 0x3d4b45, new THREE.Vector3(0, -0.05, 0.24));
  const hand = makeBox([0.5, 0.38, 0.38], 0x6a7569, new THREE.Vector3(0, 0.02, -0.46));
  sleeve.rotation.x = -0.14;
  group.add(sleeve, hand);

  const color = weapon.id === "gun" ? 0x202428 : weapon.id === "knife" ? 0xbcc4c5 : 0x7b5734;
  const size: [number, number, number] = weapon.id === "gun" ? [1.15, 0.34, 0.5] : weapon.id === "knife" ? [0.16, 1.15, 0.12] : [0.24, 1.7, 0.24];
  const mesh = makeBox(size, color, new THREE.Vector3(0.18, 0.24, -0.92));
  mesh.rotation.set(weapon.id === "gun" ? 0 : -0.95, weapon.id === "gun" ? -0.1 : 0.08, weapon.id === "gun" ? 0 : -0.35);
  group.add(mesh);

  if (weapon.id === "gun") {
    group.add(makeBox([0.36, 0.48, 0.22], 0x111315, new THREE.Vector3(-0.16, -0.02, -0.58)));
  }
  return group;
}

function chunkColor(cx: number, cz: number, area: Area) {
  const hash = Math.abs(Math.sin(cx * 12.9898 + cz * 78.233) * 43758.5453);
  const variation = Math.floor((hash % 1) * 18);
  if (area === "city") return new THREE.Color(0x24282a).offsetHSL(0, 0, variation / 500);
  return new THREE.Color(0x263820).offsetHSL(0.02, 0.02, variation / 420);
}

function addChunkField(group: THREE.Group, center: THREE.Vector3, area: Area) {
  const centerCx = Math.floor(center.x / chunkSize);
  const centerCz = Math.floor(center.z / chunkSize);
  for (let dz = -3; dz <= 3; dz += 1) {
    for (let dx = -3; dx <= 3; dx += 1) {
      const cx = centerCx + dx;
      const cz = centerCz + dz;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(chunkSize, 0.08, chunkSize),
        new THREE.MeshStandardMaterial({ color: chunkColor(cx, cz, area), roughness: 0.96 }),
      );
      tile.position.set(cx * chunkSize + chunkSize / 2, -0.06, cz * chunkSize + chunkSize / 2);
      tile.receiveShadow = true;
      group.add(tile);
    }
  }
}

export default function ThreeScene({
  area,
  position,
  angle,
  pitch,
  viewMode,
  outside,
  walking,
  items,
  zombies,
  objects,
  currentWeapon,
  flashlightOn,
}: ThreeSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    world: THREE.Group;
    chunks: THREE.Group;
    entities: THREE.Group;
    hand: THREE.Group;
    player?: THREE.Group;
    zombieModels: THREE.Group[];
    flashlight: THREE.SpotLight;
    flashlightTarget: THREE.Object3D;
    itemTexture?: THREE.Texture;
    animation: number;
  } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    root.appendChild(renderer.domElement);
    const onContextLost = (event: Event) => {
      event.preventDefault();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(area === "city" ? 0x07080c : 0x080d0b);
    scene.fog = new THREE.Fog(area === "city" ? 0x07080c : 0x080d0b, 28, 88);

    const camera = new THREE.PerspectiveCamera(72, root.clientWidth / root.clientHeight, 0.1, 180);
    const hemi = new THREE.HemisphereLight(0xb8c8d9, 0x151a15, 0.42);
    const sun = new THREE.DirectionalLight(0xffe0a3, 0.58);
    sun.position.set(-26, 46, 18);
    sun.castShadow = false;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    scene.add(hemi, sun);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 130, 26, 26), new THREE.MeshStandardMaterial({ color: 0x25341f, roughness: 0.95 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(130, 52, 0x6f875b, 0x40503a);
    grid.position.y = 0.02;
    scene.add(grid);

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2f2d29, roughness: 0.9 });
    const roadA = new THREE.Mesh(new THREE.BoxGeometry(9, 0.06, 130), roadMat);
    const roadB = new THREE.Mesh(new THREE.BoxGeometry(130, 0.06, 10), roadMat);
    roadA.position.y = 0.04;
    roadB.position.y = 0.05;
    scene.add(roadA, roadB);

    const world = new THREE.Group();
    const chunks = new THREE.Group();
    const entities = new THREE.Group();
    const hand = new THREE.Group();
    const flashlight = new THREE.SpotLight(0xfff0bd, 0, 42, Math.PI / 7, 0.54, 1.15);
    const flashlightTarget = new THREE.Object3D();
    flashlight.castShadow = false;
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    flashlight.target = flashlightTarget;
    scene.add(chunks, world, entities, hand, flashlight, flashlightTarget);

    new THREE.TextureLoader().load("/items-sprite.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      if (stateRef.current) stateRef.current.itemTexture = texture;
    });

    const onResize = () => {
      const width = root.clientWidth;
      const height = root.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    const render = () => {
      const activeCamera = camera;
      stateRef.current?.zombieModels.forEach((zombie) => {
        const health = zombie.getObjectByName("zombie-health");
        if (health) health.quaternion.copy(activeCamera.quaternion);
      });
      renderer.render(scene, camera);
      if (stateRef.current) stateRef.current.animation = requestAnimationFrame(render);
    };

    stateRef.current = {
      renderer,
      scene,
      camera,
      world,
      chunks,
      entities,
      hand,
      zombieModels: [],
      flashlight,
      flashlightTarget,
      animation: requestAnimationFrame(render),
    };

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      const current = stateRef.current;
      if (current) cancelAnimationFrame(current.animation);
      disposeObject(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === root) root.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const indoors = area === "countryside" && !outside;
    state.scene.background = new THREE.Color(indoors ? 0x050504 : area === "city" ? 0x07080c : 0x080d0b);
    state.scene.fog = new THREE.Fog(indoors ? 0x050504 : area === "city" ? 0x07080c : 0x080d0b, indoors ? 16 : 24, indoors ? 58 : 96);
    clearGroup(state.world);

    if (indoors) {
      addInteriorRoom(state.world);
    } else if (area === "countryside") {
      const house = makeBox([13, 4, 9], 0x6f5a3e, toWorld({ x: 41, y: 73 }).setY(2));
      const roof = makeBox([15, 2, 11], 0x3d332b, toWorld({ x: 41, y: 73 }).setY(5.2));
      state.world.add(house, roof);
    } else {
      [
        { x: 16, y: 16, w: 9, h: 18, d: 9 },
        { x: 68, y: 18, w: 10, h: 12, d: 10 },
        { x: 58, y: 67, w: 18, h: 9, d: 10 },
      ].forEach((building) => {
        state.world.add(makeBox([building.w, building.h, building.d], 0x373c40, toWorld(building).setY(building.h / 2)));
      });
    }

    objects.filter((object) => object.area === area).forEach((object) => {
      const base = toWorld(object);
      const mesh =
        object.type === "car"
          ? makeBox([5.4, 1.4, 2.6], 0x596a71, base.setY(0.8))
          : object.type === "bench"
            ? makeBox([4.2, 1, 1.7], 0x936337, base.setY(0.55))
            : makeBox([2.2, 3.3, 0.45], outside ? 0x4b3828 : 0x9b6a44, base.setY(1.7));
      state.world.add(mesh);
    });
  }, [area, objects, outside]);

  const chunkX = Math.floor(toWorld(position).x / chunkSize);
  const chunkZ = Math.floor(toWorld(position).z / chunkSize);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    clearGroup(state.chunks);
    addChunkField(state.chunks, new THREE.Vector3(chunkX * chunkSize, 0, chunkZ * chunkSize), area);
  }, [area, chunkX, chunkZ]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    clearGroup(state.entities);
    state.zombieModels = [];
    state.player = undefined;

    zombies.filter((zombie) => zombie.area === area && zombie.hp > 0).forEach((zombie) => {
      const model = makeZombie();
      model.position.copy(toWorld(zombie));
      model.lookAt(toWorld(position));
      addZombieHealthBar(model, zombie.hp, area === "city" ? 45 : 35);
      state.zombieModels.push(model);
      state.entities.add(model);
    });

    items.filter((item) => item.area === area).forEach((item) => {
      const base = toWorld(item);
      if (item.id === "battery") {
        const battery = new THREE.Group();
        battery.position.copy(base.setY(0.72));
        battery.add(makeBox([1.05, 0.5, 0.58], 0xd8ca52, new THREE.Vector3(0, 0, 0)));
        battery.add(makeBox([0.18, 0.28, 0.34], 0x363c35, new THREE.Vector3(0.62, 0, 0)));
        state.entities.add(battery);
        return;
      }
      const material = state.itemTexture
        ? new THREE.MeshBasicMaterial({ map: makeItemTexture(state.itemTexture, item.sprite), transparent: true })
        : new THREE.MeshStandardMaterial({ color: 0xe2bb55 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.18), material);
      mesh.position.copy(base.setY(0.9));
      mesh.rotation.y = Math.PI;
      mesh.castShadow = true;
      state.entities.add(mesh);
    });

    if (viewMode === "third") {
      const player = makePlayer();
      state.player = player;
      state.entities.add(player);
    }
  }, [area, items, zombies, viewMode]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    clearGroup(state.hand);
    const weapon = makeWeapon(currentWeapon);
    if (weapon) state.hand.add(weapon);
  }, [currentWeapon]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    const pos = toWorld(position);
    const yaw = (angle * Math.PI) / 180;
    const pitchRadians = THREE.MathUtils.degToRad(pitch);
    const forward = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitchRadians), Math.sin(pitchRadians), -Math.cos(yaw) * Math.cos(pitchRadians)).normalize();
    const flatForward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));

    if (viewMode === "first") {
      state.camera.position.copy(pos).add(new THREE.Vector3(0, 3.1 + (walking ? Math.sin(performance.now() / 90) * 0.07 : 0), 0));
      state.camera.lookAt(state.camera.position.clone().add(forward));
      state.hand.position.copy(state.camera.position).add(flatForward.clone().multiplyScalar(1.2)).add(right.clone().multiplyScalar(0.72)).add(new THREE.Vector3(0, -0.78, 0));
      state.hand.rotation.set(-0.28 + pitchRadians * 0.34, yaw - 0.2, -0.16);
      state.hand.visible = true;
    } else {
      state.camera.position.copy(pos).add(new THREE.Vector3(-Math.sin(yaw) * 12, 9, Math.cos(yaw) * 12));
      state.camera.lookAt(pos.clone().add(new THREE.Vector3(0, 1.8, 0)));
      state.hand.visible = false;
    }

    if (state.player) {
      state.player.position.copy(pos);
      state.player.rotation.y = yaw;
    }
    state.zombieModels.forEach((zombie) => zombie.lookAt(pos));

    state.flashlight.visible = flashlightOn;
    state.flashlight.intensity = flashlightOn ? (viewMode === "first" ? 5.6 : 3.4) : 0;
    state.flashlight.position.copy(state.camera.position).add(new THREE.Vector3(0, -0.08, 0));
    state.flashlightTarget.position.copy(state.camera.position).add(forward.clone().multiplyScalar(32));
  }, [position, angle, pitch, viewMode, walking, flashlightOn]);

  return <div className="three-scene" ref={rootRef} aria-hidden="true" />;
}
