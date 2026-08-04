"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Area = "countryside" | "city";
type ViewMode = "first" | "third";
type ItemKind = "food" | "weapon";

type Item = {
  id: string;
  name: string;
  kind: ItemKind;
  heal?: number;
  damage?: number;
  cooldown?: number;
  icon: string;
  sprite: number;
};

type WorldItem = Item & {
  x: number;
  y: number;
  area: Area;
};

type Zombie = {
  id: string;
  x: number;
  y: number;
  hp: number;
  area: Area;
};

type Interactable = {
  id: string;
  name: string;
  hint: string;
  x: number;
  y: number;
  area: Area;
  type: "door" | "car" | "bench";
};

const maxHealth = 100;
const mapMin = 6;
const mapMax = 94;
const interactRange = 18;

const text = {
  opening: "\ub098\ub294 \uc65c \uc774\uacf3\uc5d0 \uc788\ub294\uc9c0 \ubaa8\ub974\uaca0\ub2e4.",
  start: "\uc2dc\uc791",
  crafting: "\uc81c\uc791\ub300",
  close: "\ub2eb\uae30",
  health: "\uccb4\ub825",
  inventory: "\uc778\ubca4\ud1a0\ub9ac",
  empty: "\ube44\uc5b4 \uc788\uc74c",
  countryside: "\uc2dc\uace8",
  city: "\ub3c4\uc2ec",
  first: "\ub9c8\uc778\ud06c\ub798\ud504\ud2b8 \ubdf0",
  third: "3\uc778\uce6d",
  q: "Q \uc0c1\ud638\uc791\uc6a9",
  attack: "\ud074\ub9ad/Space \uacf5\uaca9",
  eat: "E \uc74c\uc2dd \uc0ac\uc6a9",
  view: "V \uc2dc\uc810 \uc804\ud658",
  room: "\uc9d1 \uc548: \ubb38\uc744 \ucc3e\uc544 \ubc16\uc73c\ub85c",
  gameOver: "\uac8c\uc784 \uc624\ubc84",
  restart: "\ub2e4\uc2dc \uc2dc\uc791",
};

const items: Record<string, Item> = {
  apple: { id: "apple", name: "\uc0ac\uacfc", kind: "food", heal: 5, icon: "A", sprite: 0 },
  juice: { id: "juice", name: "\uc8fc\uc2a4", kind: "food", heal: 5, icon: "J", sprite: 1 },
  grapes: { id: "grapes", name: "\ud3ec\ub3c4", kind: "food", heal: 10, icon: "G", sprite: 2 },
  bread: { id: "bread", name: "\ube75", kind: "food", heal: 10, icon: "B", sprite: 3 },
  rawMeat: { id: "rawMeat", name: "\uc0dd\uace0\uae30", kind: "food", heal: -5, icon: "R", sprite: 4 },
  cookedMeat: { id: "cookedMeat", name: "\uad6c\uc6b4 \uace0\uae30", kind: "food", heal: 10, icon: "M", sprite: 5 },
  bat1: { id: "bat1", name: "\ubc29\ub9dd\uc774 1\ub2e8\uacc4", kind: "weapon", damage: 5, cooldown: 2, icon: "1", sprite: 6 },
  bat2: { id: "bat2", name: "\ubc29\ub9dd\uc774 2\ub2e8\uacc4", kind: "weapon", damage: 10, cooldown: 2, icon: "2", sprite: 7 },
  bat3: { id: "bat3", name: "\ubc29\ub9dd\uc774 3\ub2e8\uacc4", kind: "weapon", damage: 15, cooldown: 2, icon: "3", sprite: 8 },
  knife: { id: "knife", name: "\uce7c", kind: "weapon", damage: 30, cooldown: 10, icon: "K", sprite: 9 },
  gun: { id: "gun", name: "\ucd1d", kind: "weapon", damage: 45, cooldown: 1.5, icon: "P", sprite: 10 },
};

const initialInventory: Item[] = [items.bat1];

const initialWorldItems: WorldItem[] = [
  { ...items.apple, x: 42, y: 57, area: "countryside" },
  { ...items.juice, x: 62, y: 37, area: "countryside" },
  { ...items.bread, x: 25, y: 69, area: "countryside" },
  { ...items.bat1, x: 76, y: 50, area: "countryside" },
  { ...items.knife, x: 82, y: 75, area: "countryside" },
  { ...items.grapes, x: 38, y: 29, area: "city" },
  { ...items.cookedMeat, x: 72, y: 65, area: "city" },
  { ...items.gun, x: 88, y: 34, area: "city" },
  { ...items.rawMeat, x: 18, y: 80, area: "city" },
];

const initialZombies: Zombie[] = [
  { id: "z1", x: 70, y: 72, hp: 35, area: "countryside" },
  { id: "z2", x: 91, y: 43, hp: 35, area: "countryside" },
  { id: "z3", x: 47, y: 33, hp: 45, area: "city" },
  { id: "z4", x: 63, y: 78, hp: 45, area: "city" },
  { id: "z5", x: 91, y: 54, hp: 45, area: "city" },
  { id: "z6", x: 25, y: 48, hp: 45, area: "city" },
];

const interactables: Interactable[] = [
  {
    id: "door",
    name: "\ud5c8\ubb3c\uc5b4\uc9c4 \uc9d1\uc758 \ubb38",
    hint: "Q: \ubb38\uc744 \uc5f4\uace0 \ubc16\uc73c\ub85c \ub098\uac00\uae30",
    x: 50,
    y: 92,
    area: "countryside",
    type: "door",
  },
  {
    id: "bench",
    name: "\ub0a1\uc740 \uc81c\uc791\ub300",
    hint: "Q: \uc81c\uc791\ub300 \uc5f4\uae30",
    x: 18,
    y: 22,
    area: "countryside",
    type: "bench",
  },
  {
    id: "car",
    name: "\ubd80\uc11c\uc9c4 \uc790\ub3d9\ucc28",
    hint: "Q: \ub3c4\uc2ec\uc73c\ub85c \uc774\ub3d9\ud558\uae30",
    x: 96,
    y: 88,
    area: "countryside",
    type: "car",
  },
];

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function angleDifference(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

function spriteStyle(index: number): CSSProperties {
  const column = index % 4;
  const row = Math.floor(index / 4);
  return {
    backgroundImage: "url('/items-sprite.png')",
    backgroundPosition: `${column * 33.333333}% ${row * 50}%`,
  };
}

export default function Game() {
  const [started, setStarted] = useState(false);
  const [health, setHealth] = useState(maxHealth);
  const [area, setArea] = useState<Area>("countryside");
  const [position, setPosition] = useState({ x: 50, y: 84 });
  const [angle, setAngle] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("first");
  const [inventory, setInventory] = useState<Item[]>(initialInventory);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [worldItems, setWorldItems] = useState(initialWorldItems);
  const [zombies, setZombies] = useState(initialZombies);
  const [xp, setXp] = useState(0);
  const [outside, setOutside] = useState(false);
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [message, setMessage] = useState(text.opening);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [walking, setWalking] = useState(false);
  const [stepPhase, setStepPhase] = useState(0);
  const [eatingSprite, setEatingSprite] = useState<number | null>(null);
  const keys = useRef<Set<string>>(new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const pickupAudio = useRef<HTMLAudioElement | null>(null);
  const footstepAudio = useRef<HTMLAudioElement | null>(null);
  const lastDamageAt = useRef(0);
  const positionRef = useRef(position);

  const currentWeapon = inventory[selectedSlot]?.kind === "weapon" ? inventory[selectedSlot] : undefined;
  const aliveZombies = zombies.filter((zombie) => zombie.area === area && zombie.hp > 0);

  const nearestItem = useMemo(() => {
    return worldItems
      .filter((item) => item.area === area)
      .map((item) => ({ item, range: distance(item, position) }))
      .filter(({ range }) => range <= interactRange)
      .sort((a, b) => a.range - b.range)[0]?.item;
  }, [area, position, worldItems]);

  const nearestObject = useMemo(() => {
    return interactables
      .filter((object) => object.area === area)
      .map((object) => ({ object, range: distance(object, position) }))
      .filter(({ range }) => range <= interactRange)
      .sort((a, b) => a.range - b.range)[0]?.object;
  }, [area, position]);

  const prompt = nearestItem
    ? `Q: ${nearestItem.name} \ud68d\ub4dd`
    : nearestObject
      ? nearestObject.type === "car" && xp < 20
        ? "\uacbd\ud5d8\uce58 20 \ud544\uc694: \uc790\ub3d9\ucc28 \uc218\ub9ac \ubd88\uac00"
        : nearestObject.hint
      : "WASD \uc774\ub3d9 · \ub9c8\uc6b0\uc2a4 \ud68c\uc804 · \ud074\ub9ad \uacf5\uaca9";

  const gameOver = health <= 0;
  const cameraPanX = viewMode === "first" ? clamp((50 - position.x) * 2.25, -98, 98) : 0;
  const cameraPanY = viewMode === "first" ? clamp((58 - position.y) * 1.55, -82, 96) : 0;
  const worldPitch = viewMode === "first" ? clamp(82 + pitch * 0.75, 66, 98) : 58;
  const worldRotation = `translate(${cameraPanX}%, ${cameraPanY}%) rotateX(${worldPitch}deg) rotateZ(${-angle}deg)`;
  const cameraVars = {
    "--camera-bob": walking && started && !gameOver ? `${Math.sin(stepPhase) * 7}px` : "0px",
    "--camera-sway": walking && started && !gameOver ? `${Math.cos(stepPhase * 0.5) * 5}px` : "0px",
    "--look-y": `${pitch * 0.75}vh`,
  } as CSSProperties;

  const playPickup = useCallback(() => {
    const audio = pickupAudio.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, []);

  const startFootsteps = useCallback(() => {
    const audio = footstepAudio.current;
    if (!audio || !started || gameOver) return;
    audio.volume = 0.42;
    audio.loop = true;
    void audio.play().catch(() => undefined);
  }, [gameOver, started]);

  const stopFootsteps = useCallback(() => {
    const audio = footstepAudio.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const showMessage = useCallback((value: string) => {
    setMessage(value);
  }, []);

  const interact = useCallback(() => {
    if (gameOver) return;

    if (nearestItem) {
      if (inventory.length >= 9) {
        showMessage("\uc778\ubca4\ud1a0\ub9ac\uac00 \uac00\ub4dd \ucc3c\ub2e4.");
        return;
      }
      setInventory((current) => [...current, nearestItem]);
      setWorldItems((current) => current.filter((item) => item !== nearestItem));
      playPickup();
      showMessage(`${nearestItem.name}\uc744(\ub97c) \ucc59\uacbc\ub2e4.`);
      return;
    }

    if (!nearestObject) return;

    if (nearestObject.type === "door") {
      setOutside(true);
      setPosition({ x: 50, y: 68 });
      setAngle(0);
      showMessage("\ubb38\uc774 \uc0ac\uc545 \uc18c\ub9ac\ub97c \ub0b4\uba70 \uc5f4\ub838\ub2e4. \uc774\uc81c \ubc16\uc73c\ub85c \ub098\uac08 \uc218 \uc788\ub2e4.");
      return;
    }

    if (nearestObject.type === "bench") {
      setCraftingOpen(true);
      showMessage("\ub0a1\uc740 \uc81c\uc791\ub300\uac00 \uc544\uc9c1 \uc4f8 \ub9cc\ud558\ub2e4.");
      return;
    }

    if (nearestObject.type === "car") {
      if (xp < 20) {
        showMessage("\uc544\uc9c1 \ub3c4\uc2ec\uc73c\ub85c \ub5a0\ub0a0 \uc900\ube44\uac00 \ub418\uc9c0 \uc54a\uc558\ub2e4.");
        return;
      }
      setArea("city");
      setPosition({ x: 14, y: 82 });
      setAngle(22);
      showMessage("\ub3c4\uc2ec\uc5d0 \ub3c4\ucc29\ud588\ub2e4. \uc18c\ub9ac\uac00 \ub354 \ub9ce\uace0, \uadf8\ub9bc\uc790\ub3c4 \ub354 \uae4a\ub2e4.");
    }
  }, [gameOver, inventory.length, nearestItem, nearestObject, playPickup, showMessage, xp]);

  const useSelectedItem = useCallback(() => {
    const item = inventory[selectedSlot];
    if (!item || item.kind !== "food" || gameOver) return;

    setEatingSprite(item.sprite);
    window.setTimeout(() => setEatingSprite(null), 620);
    setHealth((value) => clamp(value + (item.heal ?? 0), 0, maxHealth));
    setInventory((current) => current.filter((_, index) => index !== selectedSlot));
    setSelectedSlot((slot) => clamp(slot, 0, Math.max(0, inventory.length - 2)));
    showMessage(`${item.name}\uc744(\ub97c) \uba39\uc5c8\ub2e4. \uccb4\ub825 ${item.heal && item.heal > 0 ? "+" : ""}${item.heal}`);
  }, [gameOver, inventory, selectedSlot, showMessage]);

  const attack = useCallback(() => {
    if (gameOver) return;
    const weapon = currentWeapon;
    if (!weapon) {
      showMessage("\ubb34\uae30\ub97c \uc120\ud0dd\ud574\uc57c \ud55c\ub2e4.");
      return;
    }

    const now = Date.now();
    if (now < cooldownUntil) {
      showMessage("\uc544\uc9c1 \ud718\ub450\ub97c \uc218 \uc5c6\ub2e4.");
      return;
    }

    const target = aliveZombies
      .map((zombie) => {
        const range = distance(zombie, position);
        const bearing = (Math.atan2(zombie.x - position.x, position.y - zombie.y) * 180) / Math.PI;
        const aimError = angleDifference(angle, bearing);
        return { zombie, range, aimError };
      })
      .filter(({ range, aimError }) => {
        const rangeLimit = weapon.id === "gun" ? 46 : weapon.id === "knife" ? 14 : 18;
        const aimLimit = weapon.id === "gun" ? 11 : weapon.id === "knife" ? 18 : 24;
        return range <= rangeLimit && aimError <= aimLimit;
      })
      .sort((a, b) => a.aimError - b.aimError || a.range - b.range)[0]?.zombie;

    setCooldownUntil(now + (weapon.cooldown ?? 1) * 1000);

    if (!target) {
      showMessage(`${weapon.name}\uc744(\ub97c) \ud5c8\uacf5\uc5d0 \ud718\ub458\ub800\ub2e4.`);
      return;
    }

    setZombies((current) =>
      current.map((zombie) =>
        zombie.id === target.id
          ? { ...zombie, hp: Math.max(0, zombie.hp - (weapon.damage ?? 0)) }
          : zombie,
      ),
    );

    if (target.hp - (weapon.damage ?? 0) <= 0) {
      setXp((value) => value + (area === "city" ? 15 : 10));
      showMessage("\uc880\ube44\uac00 \uc4f0\ub7ec\uc84c\ub2e4. \uacbd\ud5d8\uce58\ub97c \uc5bb\uc5c8\ub2e4.");
    } else {
      showMessage(`${weapon.name} \uba85\uc911. \uc880\ube44\uac00 \ube44\ud2c0\uac70\ub9b0\ub2e4.`);
    }
  }, [aliveZombies, angle, area, cooldownUntil, currentWeapon, gameOver, position, showMessage]);

  const craftBat = useCallback((fromId: "bat1" | "bat2", result: Item) => {
    const indexes = inventory
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.id === fromId)
      .slice(0, 2)
      .map(({ index }) => index);

    if (indexes.length < 2) {
      showMessage("\uac19\uc740 \ub2e8\uacc4\uc758 \ubc29\ub9dd\uc774 2\uac1c\uac00 \ud544\uc694\ud558\ub2e4.");
      return;
    }

    setInventory((current) => {
      const next = current.filter((_, index) => !indexes.includes(index));
      return [...next, result].slice(0, 9);
    });
    setSelectedSlot(0);
    showMessage(`${result.name} \uc81c\uc791 \uc644\ub8cc.`);
  }, [inventory, showMessage]);

  const restart = useCallback(() => {
    setStarted(false);
    setHealth(maxHealth);
    setArea("countryside");
    setPosition({ x: 50, y: 84 });
    setAngle(0);
    setPitch(0);
    setViewMode("first");
    setInventory(initialInventory);
    setSelectedSlot(0);
    setWorldItems(initialWorldItems);
    setZombies(initialZombies);
    setXp(0);
    setOutside(false);
    setCraftingOpen(false);
    setCooldownUntil(0);
    setMessage(text.opening);
    setWalking(false);
    setEatingSprite(null);
    stopFootsteps();
  }, [stopFootsteps]);

  const beginGame = useCallback(() => {
    setStarted(true);
    stageRef.current?.requestPointerLock?.();
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    pickupAudio.current = new Audio("/sounds/pickup.mp3");
    footstepAudio.current = new Audio("/sounds/footsteps.mp3");
    if (pickupAudio.current) pickupAudio.current.volume = 0.7;
    return () => stopFootsteps();
  }, [stopFootsteps]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        attack();
        return;
      }

      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d"].includes(key)) keys.current.add(key);
      if (key >= "1" && key <= "9") setSelectedSlot(Number(key) - 1);
      if (key === "q") interact();
      if (key === "e") useSelectedItem();
      if (key === "v") setViewMode((mode) => (mode === "first" ? "third" : "first"));
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        return;
      }
      keys.current.delete(event.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [attack, interact, useSelectedItem]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (started && !gameOver) setHealth((value) => Math.max(0, value - 1));
    }, 60000);
    return () => window.clearInterval(timer);
  }, [gameOver, started]);

  useEffect(() => {
    if (!started || gameOver) {
      setWalking(false);
      stopFootsteps();
      return;
    }

    let animation = 0;
    let previous = performance.now();

    const step = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const speed = area === "city" ? 15 : 17;
      const forwardInput = (keys.current.has("w") ? 1 : 0) - (keys.current.has("s") ? 1 : 0);
      const strafeInput = (keys.current.has("d") ? 1 : 0) - (keys.current.has("a") ? 1 : 0);
      const radians = (angle * Math.PI) / 180;
      const forwardX = Math.sin(radians);
      const forwardY = -Math.cos(radians);
      const rightX = Math.cos(radians);
      const rightY = Math.sin(radians);
      const dx = forwardX * forwardInput + rightX * strafeInput;
      const dy = forwardY * forwardInput + rightY * strafeInput;
      const moving = Boolean(dx || dy);

      setWalking(moving);
      if (moving) {
        const length = Math.hypot(dx, dy);
        const nextX = (currentX: number) => clamp(currentX + (dx / length) * speed * delta, mapMin, mapMax);
        const nextY = (currentY: number) => clamp(currentY + (dy / length) * speed * delta, mapMin, mapMax);
        setStepPhase((value) => value + delta * 12);
        setPosition((current) => {
          const x = nextX(current.x);
          const y = nextY(current.y);
          return { x, y };
        });
      }

      setZombies((current) =>
        current.map((zombie) => {
          if (zombie.area !== area || zombie.hp <= 0) return zombie;
          const playerPosition = positionRef.current;
          const toPlayer = { x: playerPosition.x - zombie.x, y: playerPosition.y - zombie.y };
          const range = Math.hypot(toPlayer.x, toPlayer.y);
          if (range > 48 || range < 4) return zombie;
          const zombieSpeed = area === "city" ? 5.8 : 3.8;
          return {
            ...zombie,
            x: clamp(zombie.x + (toPlayer.x / range) * zombieSpeed * delta, mapMin, mapMax),
            y: clamp(zombie.y + (toPlayer.y / range) * zombieSpeed * delta, mapMin, mapMax),
          };
        }),
      );

      animation = requestAnimationFrame(step);
    };

    animation = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animation);
  }, [angle, area, gameOver, outside, position.x, position.y, started, stopFootsteps]);

  useEffect(() => {
    if (walking) {
      startFootsteps();
    } else {
      stopFootsteps();
    }
  }, [startFootsteps, stopFootsteps, walking]);

  useEffect(() => {
    if (gameOver) {
      showMessage("\uac8c\uc784 \uc624\ubc84. \ub9c8\uc9c0\ub9c9 \uc0ac\ub78c\uc774 \uc4f0\ub7ec\uc84c\ub2e4.");
      return;
    }

    const closeZombie = aliveZombies.some((zombie) => distance(zombie, position) < 5.5);
    const now = Date.now();
    if (closeZombie && now - lastDamageAt.current > 1000) {
      lastDamageAt.current = now;
      setHealth((value) => Math.max(0, value - (area === "city" ? 9 : 6)));
      showMessage("\uc880\ube44\uac00 \ub108\ubb34 \uac00\uae4c\uc774 \uc654\ub2e4.");
    }
  }, [aliveZombies, area, gameOver, position, showMessage]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!started || gameOver) return;
      if (document.pointerLockElement === stageRef.current || event.buttons === 1) {
        setAngle((value) => (value + event.movementX * 0.065) % 360);
        setPitch((value) => clamp(value - event.movementY * 0.06, -22, 22));
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [gameOver, started]);

  const healthColor = health > 55 ? "#66d47e" : health > 25 ? "#e3c45c" : "#ef6a5b";
  const cooldownLeft = Math.max(0, cooldownUntil - Date.now());
  const visibleObjects = interactables.filter((object) => object.area === area);
  const visibleItems = worldItems.filter((item) => item.area === area);

  return (
    <main className={`game-shell ${area} ${viewMode} ${outside ? "outside" : "inside"} ${walking ? "walking" : ""} ${eatingSprite !== null ? "eating" : ""}`} style={cameraVars}>
      <audio src="/sounds/pickup.mp3" preload="auto" />
      <audio src="/sounds/footsteps.mp3" preload="auto" loop />

      <button className="craft-button" onClick={() => setCraftingOpen(true)} type="button">
        {text.crafting}
      </button>

      <section
        ref={stageRef}
        className="stage"
        onClick={started ? attack : beginGame}
        onDoubleClick={beginGame}
        aria-label="The Last Person game stage"
      >
        <div className="skyline" />
        <div className="weather-layer" />
        <div className="fog" />
        <div className="world" style={{ transform: worldRotation }}>
          <div className="road vertical" />
          <div className="road horizontal" />
          {area === "countryside" && <div className="house" style={{ left: "41%", top: "73%" }} />}
          {area === "city" && (
            <>
              <div className="building tall" style={{ left: "16%", top: "16%" }} />
              <div className="building" style={{ left: "68%", top: "18%" }} />
              <div className="building wide" style={{ left: "58%", top: "67%" }} />
            </>
          )}
          {visibleObjects.map((object) => (
            <div key={object.id} className={`object ${object.type}`} style={{ left: `${object.x}%`, top: `${object.y}%` }} title={object.name} />
          ))}
          {visibleItems.map((item) => (
            <div
              key={`${item.id}-${item.x}-${item.y}`}
              className="loot"
              style={{ left: `${item.x}%`, top: `${item.y}%`, ...spriteStyle(item.sprite) }}
              title={item.name}
            />
          ))}
          {aliveZombies.map((zombie) => (
            <div key={zombie.id} className="zombie" style={{ left: `${zombie.x}%`, top: `${zombie.y}%` }}>
              <span style={{ transform: `scaleX(${zombie.hp / (area === "city" ? 45 : 35)})` }} />
            </div>
          ))}
          <div
            className="player"
            style={{ left: `${position.x}%`, top: `${position.y}%`, transform: `rotate(${angle}deg)` }}
          >
            <span className="player-shadow" />
            <span className="player-head" />
            <span className="player-body" />
            <span className="player-leg left" />
            <span className="player-leg right" />
            <span className="player-weapon" style={currentWeapon ? spriteStyle(currentWeapon.sprite) : undefined} />
          </div>
        </div>

        {viewMode === "first" && (
          <div className={`first-person-view weapon-${currentWeapon?.id ?? "none"}`} aria-hidden="true">
            <span className="first-person-arm">
              <span className="first-person-hand" />
              <span className="first-person-weapon" style={currentWeapon ? spriteStyle(currentWeapon.sprite) : undefined} />
            </span>
            {eatingSprite !== null && <span className="first-person-food" style={spriteStyle(eatingSprite)} />}
          </div>
        )}
        <div className="vignette" />
        <div className="crosshair" />
        <div className="prompt">{prompt}</div>

        {!started && (
          <div className="opening">
            <div className="speech-bubble">
              <p>{text.opening}</p>
            </div>
            <button type="button" onClick={beginGame}>{text.start}</button>
          </div>
        )}

        {gameOver && (
          <div className="opening game-over">
            <div className="speech-bubble">
              <p>{text.gameOver}</p>
            </div>
            <button type="button" onClick={restart}>{text.restart}</button>
          </div>
        )}
      </section>

      <aside className="health-panel">
        <span>{text.health}</span>
        <div className="health-bar">
          <b style={{ width: `${health}%`, background: healthColor }} />
        </div>
        <strong>{health}/{maxHealth}</strong>
      </aside>

      <aside className="status-panel">
        <span>{area === "countryside" ? text.countryside : text.city}</span>
        <strong>EXP {xp}</strong>
        <button type="button" onClick={() => setViewMode((mode) => (mode === "first" ? "third" : "first"))}>
          {viewMode === "first" ? text.first : text.third}
        </button>
      </aside>

      <section className="message-log" aria-live="polite">{message}</section>

      <section className="inventory" aria-label={text.inventory}>
        {Array.from({ length: 9 }).map((_, index) => {
          const item = inventory[index];
          return (
            <button
              key={index}
              className={index === selectedSlot ? "slot selected" : "slot"}
              onClick={() => setSelectedSlot(index)}
              onDoubleClick={useSelectedItem}
              type="button"
              aria-label={`${index + 1}\ubc88 \uc2ac\ub86f ${item?.name ?? text.empty}`}
            >
              <small>{index + 1}</small>
              <span className="slot-art" style={item ? spriteStyle(item.sprite) : undefined} />
              <b>{item?.name ?? ""}</b>
            </button>
          );
        })}
      </section>

      <section className="help-strip">
        <span>{text.q}</span>
        <span>{text.attack}</span>
        <span>{text.eat}</span>
        <span>{text.view}</span>
        <span>{currentWeapon ? `${currentWeapon.name} \ud53c\ud574 ${currentWeapon.damage}` : "\uc74c\uc2dd \uc120\ud0dd\ub428"}</span>
        {cooldownLeft > 0 && <span>\ucfe8\ud0c0\uc784 {(cooldownLeft / 1000).toFixed(1)}\ucd08</span>}
        {!outside && <span>{text.room}</span>}
      </section>

      {craftingOpen && (
        <section className="crafting" aria-label={text.crafting}>
          <div className="crafting-panel">
            <header>
              <span>{text.crafting}</span>
              <button type="button" onClick={() => setCraftingOpen(false)}>{text.close}</button>
            </header>
            <button type="button" onClick={() => craftBat("bat1", items.bat2)}>
              {"\ubc29\ub9dd\uc774 1\ub2e8\uacc4 + \ubc29\ub9dd\uc774 1\ub2e8\uacc4 \u2192 \ubc29\ub9dd\uc774 2\ub2e8\uacc4"}
            </button>
            <button type="button" onClick={() => craftBat("bat2", items.bat3)}>
              {"\ubc29\ub9dd\uc774 2\ub2e8\uacc4 + \ubc29\ub9dd\uc774 2\ub2e8\uacc4 \u2192 \ubc29\ub9dd\uc774 3\ub2e8\uacc4"}
            </button>
            <p>{"\ubc29\ub9dd\uc774\ub294 \uc5c5\uadf8\ub808\uc774\ub4dc\ub9c8\ub2e4 \ud53c\ud574\ub7c9\uc774 5 \uc99d\uac00\ud55c\ub2e4."}</p>
          </div>
        </section>
      )}
    </main>
  );
}
