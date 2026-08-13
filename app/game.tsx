"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { englishText, text } from "./game-text";
import SettingsPanel, { type GameSettings } from "./settings-panel";
import ThreeScene from "./three-scene";
import WorldMenu, { type WorldDifficulty } from "./world-menu";

type Area = "countryside" | "city";
type ViewMode = "first" | "third";
type ItemKind = "food" | "weapon" | "battery";

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
const indoorMinX = 34;
const indoorMaxX = 66;
const indoorMinY = 66;
const indoorMaxY = 94;
const interactRange = 18;
const saveKey = "the-last-person-world";

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
  battery: { id: "battery", name: "\ubc30\ud130\ub9ac", kind: "battery", icon: "T", sprite: 1 },
};

const initialInventory: Item[] = [items.bat1];

const initialWorldItems: WorldItem[] = [
  { ...items.battery, x: 42, y: 78, area: "countryside" },
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

function movementKey(event: KeyboardEvent) {
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) return key;
  const byCode: Record<string, string> = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d" };
  return byCode[event.code];
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    language: "ko",
    graphicsMode: "normal",
    sfxVolume: 70,
    footstepsVolume: 42,
    mouseSensitivity: 65,
  });
  const [worldName, setWorldName] = useState("The Last Person");
  const [savedWorldName, setSavedWorldName] = useState("");
  const [worldDifficulty, setWorldDifficulty] = useState<WorldDifficulty>("easy");
  const [message, setMessage] = useState(text.opening);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [walking, setWalking] = useState(false);
  const [stepPhase, setStepPhase] = useState(0);
  const [jumpOffset, setJumpOffset] = useState(0);
  const [eatingSprite, setEatingSprite] = useState<number | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [flashlightBattery, setFlashlightBattery] = useState(50);
  const keys = useRef<Set<string>>(new Set());
  const stageRef = useRef<HTMLDivElement>(null);
  const pickupAudio = useRef<HTMLAudioElement | null>(null);
  const footstepAudio = useRef<HTMLAudioElement | null>(null);
  const lastDamageAt = useRef(0);
  const positionRef = useRef(position);
  const angleRef = useRef(angle);
  const walkingRef = useRef(false);
  const jumpOffsetRef = useRef(0);
  const jumpVelocity = useRef(0);
  const jumpRequested = useRef(false);
  const zombieSpawnElapsed = useRef(0);
  const itemSpawnElapsed = useRef(0);

  const currentWeapon = inventory[selectedSlot]?.kind === "weapon" ? inventory[selectedSlot] : undefined;
  const ui = settings.language === "ko" ? text : englishText;
  const difficulty = worldDifficulty === "hard"
    ? { speed: 1.18, spawnDelay: 0.78, limit: 1.3, damage: 1.4 }
    : { speed: 0.82, spawnDelay: 1.28, limit: 0.8, damage: 0.72 };
  const aliveZombies = useMemo(() => zombies.filter((zombie) => zombie.area === area && zombie.hp > 0), [area, zombies]);

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
      : ui.promptDefault;

  const gameOver = health <= 0;
  const cameraVars = {
    "--camera-bob": walking && started && !gameOver ? `${Math.sin(stepPhase) * 7}px` : "0px",
    "--camera-sway": walking && started && !gameOver ? `${Math.cos(stepPhase * 0.5) * 5}px` : "0px",
  } as CSSProperties;

  const playPickup = useCallback(() => {
    const audio = pickupAudio.current;
    if (!audio) return;
    audio.volume = settings.sfxVolume / 100;
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, [settings.sfxVolume]);

  const startFootsteps = useCallback(() => {
    const audio = footstepAudio.current;
    if (!audio || !started || gameOver) return;
    audio.volume = settings.footstepsVolume / 100;
    audio.loop = true;
    void audio.play().catch(() => undefined);
  }, [gameOver, settings.footstepsVolume, started]);

  const stopFootsteps = useCallback(() => {
    const audio = footstepAudio.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const resetMovementInput = useCallback(() => {
    keys.current.clear();
    jumpRequested.current = false;
    if (walkingRef.current) {
      walkingRef.current = false;
      setWalking(false);
    }
    stopFootsteps();
  }, [stopFootsteps]);

  const showMessage = useCallback((value: string) => {
    setMessage(value);
  }, []);

  const interact = useCallback(() => {
    if (gameOver) return;

    if (nearestItem) {
      if (nearestItem.kind === "battery") {
        setFlashlightBattery((value) => clamp(value + 35, 0, 100));
        setWorldItems((current) => current.filter((item) => item !== nearestItem));
        playPickup();
        showMessage("\ubc30\ud130\ub9ac\ub97c \ucc3e\uc558\ub2e4. \uc190\uc804\ub4f1 \uc804\ub825 +35%");
        return;
      }
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
        const rangeLimit = weapon.id === "gun" ? 52 : weapon.id === "knife" ? 18 : 24;
        const aimLimit = weapon.id === "gun" ? 18 : weapon.id === "knife" ? 32 : 42;
        return range <= rangeLimit && (aimError <= aimLimit || range <= 8);
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
      showMessage(`${weapon.name} 명중. 좀비 체력 ${Math.max(0, target.hp - (weapon.damage ?? 0))}`);
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
    walkingRef.current = false;
    keys.current.clear();
    jumpRequested.current = false;
    jumpVelocity.current = 0;
    jumpOffsetRef.current = 0;
    zombieSpawnElapsed.current = 0;
    itemSpawnElapsed.current = 0;
    setJumpOffset(0);
    setEatingSprite(null);
    setFlashlightOn(true);
    setFlashlightBattery(50);
    stopFootsteps();
  }, [stopFootsteps]);

  const beginGame = useCallback(() => {
    const cleanName = worldName.trim() || "The Last Person";
    setWorldName(cleanName);
    setSavedWorldName(cleanName);
    window.localStorage.setItem(saveKey, JSON.stringify({ name: cleanName, difficulty: worldDifficulty }));
    showMessage(ui.worldSaved);
    setStarted(true);
    stageRef.current?.requestPointerLock?.();
  }, [showMessage, ui.worldSaved, worldDifficulty, worldName]);

  useEffect(() => {
    const saved = window.localStorage.getItem(saveKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as { name?: string; difficulty?: WorldDifficulty };
      if (parsed.name) {
        setWorldName(parsed.name);
        setSavedWorldName(parsed.name);
      }
      if (parsed.difficulty === "easy" || parsed.difficulty === "hard") setWorldDifficulty(parsed.difficulty);
    } catch {
      window.localStorage.removeItem(saveKey);
    }
  }, []);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  useEffect(() => {
    pickupAudio.current = new Audio("/sounds/pickup.mp3");
    footstepAudio.current = new Audio("/sounds/footsteps.mp3");
    return () => stopFootsteps();
  }, [stopFootsteps]);

  useEffect(() => {
    if (pickupAudio.current) pickupAudio.current.volume = settings.sfxVolume / 100;
    if (footstepAudio.current) footstepAudio.current.volume = settings.footstepsVolume / 100;
  }, [settings.footstepsVolume, settings.sfxVolume]);

  useEffect(() => {
    if (settingsOpen || craftingOpen) {
      resetMovementInput();
      document.exitPointerLock?.();
    }
  }, [craftingOpen, resetMovementInput, settingsOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resetMovementInput();
        setSettingsOpen((open) => !open);
        return;
      }
      if (settingsOpen) return;
      if (event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        if (!event.repeat && started && !gameOver && !craftingOpen) jumpRequested.current = true;
        return;
      }

      const key = event.key.toLowerCase();
      const move = movementKey(event);
      if (move) {
        if (craftingOpen) return;
        keys.current.add(move);
        return;
      }
      if (event.repeat && ["q", "e", "f", "v"].includes(key)) return;
      if (key >= "1" && key <= "9") setSelectedSlot(Number(key) - 1);
      if (key === "q") interact();
      if (key === "e") useSelectedItem();
      if (key === "f") setFlashlightOn((enabled) => (flashlightBattery > 0 ? !enabled : false));
      if (key === "v") setViewMode((mode) => (mode === "first" ? "third" : "first"));
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        event.stopPropagation();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        jumpRequested.current = false;
        return;
      }
      const move = movementKey(event);
      if (move) keys.current.delete(move);
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
    };
  }, [craftingOpen, flashlightBattery, gameOver, interact, resetMovementInput, settingsOpen, started, useSelectedItem]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) resetMovementInput();
    };
    const onPointerLockChange = () => {
      if (document.pointerLockElement !== stageRef.current) resetMovementInput();
    };
    window.addEventListener("blur", resetMovementInput);
    document.addEventListener("visibilitychange", onVisibilityChange);
    document.addEventListener("pointerlockchange", onPointerLockChange);
    return () => {
      window.removeEventListener("blur", resetMovementInput);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
    };
  }, [resetMovementInput]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (started && !gameOver) setHealth((value) => Math.max(0, value - 1));
    }, 60000);
    return () => window.clearInterval(timer);
  }, [gameOver, started]);

  useEffect(() => {
    if (!started || gameOver || !flashlightOn) return;
    const timer = window.setInterval(() => {
      setFlashlightBattery((value) => {
        const next = Math.max(0, value - 1);
        if (next === 0) setFlashlightOn(false);
        return next;
      });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [flashlightOn, gameOver, started]);

  useEffect(() => {
    if (!started || gameOver) {
      keys.current.clear();
      jumpRequested.current = false;
      if (walkingRef.current) {
        walkingRef.current = false;
        setWalking(false);
      }
      stopFootsteps();
      return;
    }

    let animation = 0;
    let previous = performance.now();
    let zombieElapsed = 0;

    const step = (now: number) => {
      const delta = Math.min(0.05, (now - previous) / 1000);
      previous = now;
      const speed = area === "city" ? 15 : 17;
      const forwardInput = (keys.current.has("w") ? 1 : 0) - (keys.current.has("s") ? 1 : 0);
      const strafeInput = (keys.current.has("d") ? 1 : 0) - (keys.current.has("a") ? 1 : 0);
      const radians = (angleRef.current * Math.PI) / 180;
      const forwardX = Math.sin(radians);
      const forwardY = -Math.cos(radians);
      const rightX = Math.cos(radians);
      const rightY = Math.sin(radians);
      const dx = forwardX * forwardInput + rightX * strafeInput;
      const dy = forwardY * forwardInput + rightY * strafeInput;
      const moving = Boolean(dx || dy);

      if (walkingRef.current !== moving) {
        walkingRef.current = moving;
        setWalking(moving);
      }
      if (moving) {
        const length = Math.hypot(dx, dy);
        const nextX = (currentX: number) => {
          const proposed = currentX + (dx / length) * speed * delta;
          return outside ? proposed : clamp(proposed, indoorMinX, indoorMaxX);
        };
        const nextY = (currentY: number) => {
          const proposed = currentY + (dy / length) * speed * delta;
          return outside ? proposed : clamp(proposed, indoorMinY, indoorMaxY);
        };
        setPosition((current) => {
          const x = nextX(current.x);
          const y = nextY(current.y);
          return { x, y };
        });
      }

      if (jumpRequested.current && jumpOffsetRef.current <= 0.001) {
        jumpVelocity.current = 8.4;
        jumpRequested.current = false;
      }
      if (jumpVelocity.current !== 0 || jumpOffsetRef.current > 0) {
        const nextVelocity = jumpVelocity.current - 22 * delta;
        const nextOffset = Math.max(0, jumpOffsetRef.current + nextVelocity * delta);
        jumpVelocity.current = nextOffset <= 0 ? 0 : nextVelocity;
        if (Math.abs(nextOffset - jumpOffsetRef.current) > 0.004 || nextOffset === 0) {
          jumpOffsetRef.current = nextOffset;
          setJumpOffset(Number(nextOffset.toFixed(3)));
        }
      }

      zombieElapsed += delta;
      if (zombieElapsed >= 0.18) {
        const zombieDelta = zombieElapsed;
        zombieElapsed = 0;
        setZombies((current) =>
          current
            .filter((zombie) => {
              if (!outside || zombie.area !== area || zombie.id.length <= 2) return true;
              return distance(zombie, positionRef.current) < 210;
            })
            .map((zombie) => {
            if (zombie.area !== area || zombie.hp <= 0) return zombie;
            const playerPosition = positionRef.current;
            const toPlayer = { x: playerPosition.x - zombie.x, y: playerPosition.y - zombie.y };
            const range = Math.hypot(toPlayer.x, toPlayer.y);
            if (range > (outside ? 96 : 48) || range < 4) return zombie;
            const zombieSpeed = (area === "city" ? 4.6 : 3.0) * difficulty.speed;
            const nextX = zombie.x + (toPlayer.x / range) * zombieSpeed * zombieDelta;
            const nextY = zombie.y + (toPlayer.y / range) * zombieSpeed * zombieDelta;
            return {
              ...zombie,
              x: outside ? nextX : clamp(nextX, mapMin, mapMax),
              y: outside ? nextY : clamp(nextY, mapMin, mapMax),
            };
          }),
        );
      }

      if (outside) {
        zombieSpawnElapsed.current += delta;
        if (zombieSpawnElapsed.current >= 3.8 * difficulty.spawnDelay) {
          zombieSpawnElapsed.current = 0;
          setZombies((current) => {
            const playerPosition = positionRef.current;
            const activeCount = current.filter(
              (zombie) => zombie.area === area && zombie.hp > 0 && distance(zombie, playerPosition) < 150,
            ).length;
            const limit = Math.round((area === "city" ? 8 : 5) * difficulty.limit);
            if (activeCount >= limit) return current;
            const seed = Math.sin((playerPosition.x + current.length * 17.13) * 12.9898 + playerPosition.y * 78.233);
            const angleToSpawn = seed * Math.PI * 2;
            const range = area === "city" ? 78 : 92;
            const zombie: Zombie = {
              id: `wild-${area}-${Date.now().toString(36)}-${current.length}`,
              x: playerPosition.x + Math.cos(angleToSpawn) * range,
              y: playerPosition.y + Math.sin(angleToSpawn) * range,
              hp: area === "city" ? 45 : 35,
              area,
            };
            return [...current, zombie];
          });
        }

        itemSpawnElapsed.current += delta;
        if (itemSpawnElapsed.current >= 4.5) {
          itemSpawnElapsed.current = 0;
          setWorldItems((current) => {
            const playerPosition = positionRef.current;
            const nearbyFood = current.filter(
              (item) => item.area === area && item.kind === "food" && distance(item, playerPosition) < 170,
            ).length;
            const foodLimit = area === "city" ? 12 : 9;
            const trimmed = current.filter((item) => {
              if (!item.id.startsWith("forage-")) return true;
              return item.area !== area || distance(item, playerPosition) < 230;
            });
            if (nearbyFood >= foodLimit) return trimmed;

            const seed = Math.sin((playerPosition.x + current.length * 31.7) * 18.371 + playerPosition.y * 44.029);
            const angleToSpawn = seed * Math.PI * 2;
            const range = 42 + Math.abs(seed) * 38;
            const foodPool = area === "city"
              ? [items.juice, items.bread, items.cookedMeat, items.rawMeat]
              : [items.apple, items.grapes, items.bread, items.juice];
            const food = foodPool[Math.abs(Math.floor(seed * 1000)) % foodPool.length];
            const worldItem: WorldItem = {
              ...food,
              id: `forage-${food.id}-${Date.now().toString(36)}-${current.length}`,
              x: playerPosition.x + Math.cos(angleToSpawn) * range,
              y: playerPosition.y + Math.sin(angleToSpawn) * range,
              area,
            };
            return [...trimmed, worldItem];
          });
        }
      }

      animation = requestAnimationFrame(step);
    };

    animation = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animation);
  }, [area, difficulty.limit, difficulty.spawnDelay, difficulty.speed, gameOver, outside, started, stopFootsteps]);

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

    const closeZombie = aliveZombies.some((zombie) => distance(zombie, position) < 5);
    const now = Date.now();
    if (closeZombie && now - lastDamageAt.current > 1400) {
      lastDamageAt.current = now;
      setHealth((value) => Math.max(0, value - Math.round((area === "city" ? 6 : 4) * difficulty.damage)));
      showMessage("\uc880\ube44\uac00 \ub108\ubb34 \uac00\uae4c\uc774 \uc654\ub2e4.");
    }
  }, [aliveZombies, area, difficulty.damage, gameOver, position, showMessage]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!started || gameOver || settingsOpen || craftingOpen) return;
      if (document.pointerLockElement === stageRef.current || event.buttons === 1) {
        const sensitivity = settings.mouseSensitivity / 65;
        setAngle((value) => (value + event.movementX * 0.065 * sensitivity) % 360);
        setPitch((value) => clamp(value - event.movementY * 0.055 * sensitivity, -72, 72));
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [craftingOpen, gameOver, settings.mouseSensitivity, settingsOpen, started]);

  const cooldownLeft = Math.max(0, cooldownUntil - Date.now());
  const visibleObjects = useMemo(
    () => interactables.filter((object) => object.area === area && (outside || object.type === "door")),
    [area, outside],
  );
  const visibleItems = useMemo(
    () => worldItems.filter((item) => item.area === area && (outside || item.kind === "battery")),
    [area, outside, worldItems],
  );

  return (
    <main className={`game-shell ${area} ${viewMode} ${outside ? "outside" : "inside"} ${walking ? "walking" : ""} ${eatingSprite !== null ? "eating" : ""} ${settingsOpen ? "settings-open" : ""}`} style={cameraVars}>
      <audio src="/sounds/pickup.mp3" preload="auto" />
      <audio src="/sounds/footsteps.mp3" preload="auto" loop />

      <button className="craft-button" onClick={() => setCraftingOpen(true)} type="button">
        {ui.crafting}
      </button>
      <button className="settings-button" onClick={() => setSettingsOpen(true)} type="button">
        {ui.settings}
      </button>

      <section
        ref={stageRef}
        className="stage"
        onClick={started ? attack : undefined}
        aria-label="The Last Person game stage"
      >
        <div className="weather-layer" />
        <div className="fog" />
        <ThreeScene
          area={area}
          position={position}
          angle={angle}
          pitch={pitch}
          viewMode={viewMode}
          outside={outside}
          walking={walking}
          jumpOffset={jumpOffset}
          items={visibleItems}
          zombies={aliveZombies}
          objects={visibleObjects}
          currentWeapon={currentWeapon}
          flashlightOn={flashlightOn && flashlightBattery > 0}
          graphicsMode={settings.graphicsMode}
        />
        <div className="vignette" />
        <div className="crosshair" />
        <div className="prompt">{prompt}</div>

        {!started && (
          <WorldMenu
            text={ui}
            worldName={worldName}
            difficulty={worldDifficulty}
            savedWorldName={savedWorldName}
            onNameChange={setWorldName}
            onDifficultyChange={setWorldDifficulty}
            onStart={beginGame}
          />
        )}

        {gameOver && (
          <div className="opening game-over">
            <div className="speech-bubble">
              <p>{ui.gameOver}</p>
            </div>
            <button type="button" onClick={restart}>{ui.restart}</button>
          </div>
        )}
      </section>

      <aside className="health-panel">
        <span>{ui.health}</span>
        <div className="heart-bar" aria-label={`${health}/${maxHealth}`}>
          {Array.from({ length: 10 }).map((_, index) => {
            const heartValue = clamp(health - index * 10, 0, 10);
            return (
              <span
                key={index}
                className={heartValue >= 10 ? "heart full" : heartValue >= 5 ? "heart half" : "heart empty"}
              />
            );
          })}
        </div>
        <strong>{health}/{maxHealth}</strong>
      </aside>

      <aside className="status-panel">
        <span>{area === "countryside" ? ui.countryside : ui.city}</span>
        <strong>EXP {xp}</strong>
        <button type="button" onClick={() => setViewMode((mode) => (mode === "first" ? "third" : "first"))}>
          {viewMode === "first" ? ui.first : ui.third}
        </button>
      </aside>

      <aside className="flashlight-panel">
        <span>{ui.flashlightStatus}</span>
        <div className="battery-bar">
          <b style={{ width: `${flashlightBattery}%` }} />
        </div>
        <strong>{flashlightOn && flashlightBattery > 0 ? "ON" : "OFF"} {flashlightBattery}%</strong>
      </aside>

      <section className="message-log" aria-live="polite">{message}</section>

      <section className="inventory" aria-label={ui.inventory}>
        {Array.from({ length: 9 }).map((_, index) => {
          const item = inventory[index];
          return (
            <button
              key={index}
              className={index === selectedSlot ? "slot selected" : "slot"}
              onClick={() => setSelectedSlot(index)}
              onDoubleClick={useSelectedItem}
              type="button"
              aria-label={`${index + 1}\ubc88 \uc2ac\ub86f ${item?.name ?? ui.empty}`}
            >
              <small>{index + 1}</small>
              <span className="slot-art" style={item ? spriteStyle(item.sprite) : undefined} />
              <b>{item?.name ?? ""}</b>
            </button>
          );
        })}
      </section>

      <section className="help-strip">
        <span>{ui.q}</span>
        <span>{ui.attack}</span>
        <span>{ui.jump}</span>
        <span>{ui.eat}</span>
        <span>{ui.flashlight}</span>
        <span>{ui.view}</span>
        <span>{currentWeapon ? `${currentWeapon.name} ${ui.damage} ${currentWeapon.damage}` : ui.foodSelected}</span>
        {cooldownLeft > 0 && <span>\ucfe8\ud0c0\uc784 {(cooldownLeft / 1000).toFixed(1)}\ucd08</span>}
        {!outside && <span>{ui.room}</span>}
      </section>

      {craftingOpen && (
        <section className="crafting" aria-label={ui.crafting}>
          <div className="crafting-panel">
            <header>
              <span>{ui.crafting}</span>
              <button type="button" onClick={() => setCraftingOpen(false)}>{ui.close}</button>
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
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          text={ui.settingsText}
          onClose={() => setSettingsOpen(false)}
          onChange={(next) => setSettings(next)}
        />
      )}
    </main>
  );
}
