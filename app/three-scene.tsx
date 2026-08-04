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
};

const worldScale = 1.25;

function toWorld(value: { x: number; y: number }) {
  return new THREE.Vector3((value.x - 50) * worldScale, 0, (value.y - 50) * worldScale);
}

function makeBox(size: [number, number, number], color: number, position: THREE.Vector3) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshStandardMaterial({ color, roughness: 0.82 }),
  );
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
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

function makePlayer() {
  const player = new THREE.Group();
  const body = makeBox([1, 1.8, 0.6], 0x59675f, new THREE.Vector3(0, 1.2, 0));
  const head = makeBox([0.72, 0.72, 0.72], 0x171b1a, new THREE.Vector3(0, 2.42, 0));
  const arm = makeBox([0.3, 1.1, 0.3], 0x3d4b45, new THREE.Vector3(0.72, 1.2, -0.1));
  player.add(body, head, arm);
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
  const color = weapon.id === "gun" ? 0x202428 : weapon.id === "knife" ? 0xbcc4c5 : 0x7b5734;
  const size: [number, number, number] = weapon.id === "gun" ? [0.95, 0.34, 0.48] : weapon.id === "knife" ? [0.22, 1.3, 0.14] : [0.28, 1.85, 0.28];
  const mesh = makeBox(size, color, new THREE.Vector3(0, 0, 0));
  mesh.rotation.z = weapon.id === "gun" ? 0 : -0.45;
  group.add(mesh);
  return group;
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
}: ThreeSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    dynamic: THREE.Group;
    hand: THREE.Group;
    itemTexture?: THREE.Texture;
    animation: number;
  } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(root.clientWidth, root.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    root.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(area === "city" ? 0x202833 : 0x6d8ec5);
    scene.fog = new THREE.Fog(area === "city" ? 0x202833 : 0x7d8c78, 45, 120);

    const camera = new THREE.PerspectiveCamera(72, root.clientWidth / root.clientHeight, 0.1, 180);
    const hemi = new THREE.HemisphereLight(0xd7e9ff, 0x253126, 1.75);
    const sun = new THREE.DirectionalLight(0xffe0a3, 2.7);
    sun.position.set(-26, 46, 18);
    sun.castShadow = true;
    sun.shadow.camera.left = -60;
    sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60;
    sun.shadow.camera.bottom = -60;
    scene.add(hemi, sun);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(130, 130, 26, 26),
      new THREE.MeshStandardMaterial({ color: area === "city" ? 0x3f4242 : 0x546f46, roughness: 0.95 }),
    );
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

    const dynamic = new THREE.Group();
    const hand = new THREE.Group();
    scene.add(dynamic, hand);

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
      renderer.render(scene, camera);
      if (stateRef.current) stateRef.current.animation = requestAnimationFrame(render);
    };

    stateRef.current = { renderer, scene, camera, dynamic, hand, animation: requestAnimationFrame(render) };

    return () => {
      window.removeEventListener("resize", onResize);
      const current = stateRef.current;
      if (current) cancelAnimationFrame(current.animation);
      renderer.dispose();
      root.removeChild(renderer.domElement);
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;

    const indoors = area === "countryside" && !outside;
    state.scene.background = new THREE.Color(indoors ? 0x10110f : area === "city" ? 0x202833 : 0x6d8ec5);
    state.scene.fog = new THREE.Fog(indoors ? 0x10110f : area === "city" ? 0x202833 : 0x7d8c78, indoors ? 30 : 45, indoors ? 82 : 120);
    state.dynamic.clear();

    if (indoors) {
      addInteriorRoom(state.dynamic);
    } else if (area === "countryside") {
      const house = makeBox([13, 4, 9], 0x6f5a3e, toWorld({ x: 41, y: 73 }).setY(2));
      const roof = makeBox([15, 2, 11], 0x3d332b, toWorld({ x: 41, y: 73 }).setY(5.2));
      state.dynamic.add(house, roof);
    } else {
      [
        { x: 16, y: 16, w: 9, h: 18, d: 9 },
        { x: 68, y: 18, w: 10, h: 12, d: 10 },
        { x: 58, y: 67, w: 18, h: 9, d: 10 },
      ].forEach((building) => {
        state.dynamic.add(makeBox([building.w, building.h, building.d], 0x373c40, toWorld(building).setY(building.h / 2)));
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
      state.dynamic.add(mesh);
    });

    zombies.filter((zombie) => zombie.area === area && zombie.hp > 0).forEach((zombie) => {
      const model = makeZombie();
      model.position.copy(toWorld(zombie));
      model.lookAt(toWorld(position));
      state.dynamic.add(model);
    });

    items.filter((item) => item.area === area).forEach((item) => {
      const base = toWorld(item);
      const material = state.itemTexture
        ? new THREE.MeshBasicMaterial({ map: makeItemTexture(state.itemTexture, item.sprite), transparent: true })
        : new THREE.MeshStandardMaterial({ color: 0xe2bb55 });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.18), material);
      mesh.position.copy(base.setY(0.9));
      mesh.rotation.y = Math.PI;
      mesh.castShadow = true;
      state.dynamic.add(mesh);
    });

    const player = makePlayer();
    player.position.copy(toWorld(position));
    player.rotation.y = (angle * Math.PI) / 180;
    if (viewMode === "third") state.dynamic.add(player);

    state.hand.clear();
    const weapon = makeWeapon(currentWeapon);
    if (weapon) state.hand.add(weapon);
  }, [area, items, objects, zombies, position, angle, viewMode, outside, currentWeapon]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    const pos = toWorld(position);
    const yaw = (angle * Math.PI) / 180;
    const pitchRadians = THREE.MathUtils.degToRad(pitch);
    const forward = new THREE.Vector3(Math.sin(yaw), Math.sin(pitchRadians), -Math.cos(yaw));
    const flatForward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));

    if (viewMode === "first") {
      state.camera.position.copy(pos).add(new THREE.Vector3(0, 3.1 + (walking ? Math.sin(performance.now() / 90) * 0.07 : 0), 0));
      state.camera.lookAt(state.camera.position.clone().add(forward));
      state.hand.position.copy(state.camera.position).add(flatForward.clone().multiplyScalar(2.05)).add(new THREE.Vector3(0.85, -0.82, -0.22));
      state.hand.rotation.set(-0.45, yaw - 0.52, -0.2);
      state.hand.visible = true;
    } else {
      state.camera.position.copy(pos).add(new THREE.Vector3(-Math.sin(yaw) * 12, 9, Math.cos(yaw) * 12));
      state.camera.lookAt(pos.clone().add(new THREE.Vector3(0, 1.8, 0)));
      state.hand.visible = false;
    }
  }, [position, angle, pitch, viewMode, walking]);

  return <div className="three-scene" ref={rootRef} aria-hidden="true" />;
}
