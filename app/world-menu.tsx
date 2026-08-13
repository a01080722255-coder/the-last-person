"use client";

export type WorldDifficulty = "easy" | "hard";

type WorldMenuText = {
  opening: string;
  worldName: string;
  difficulty: string;
  easy: string;
  hard: string;
  saveWorld: string;
  savedWorld: string;
};

type WorldMenuProps = {
  text: WorldMenuText;
  worldName: string;
  difficulty: WorldDifficulty;
  savedWorldName: string;
  onNameChange: (name: string) => void;
  onDifficultyChange: (difficulty: WorldDifficulty) => void;
  onStart: () => void;
};

export default function WorldMenu({
  text,
  worldName,
  difficulty,
  savedWorldName,
  onNameChange,
  onDifficultyChange,
  onStart,
}: WorldMenuProps) {
  return (
    <div className="opening">
      <div className="world-card">
        <div className="speech-bubble">
          <p>{text.opening}</p>
        </div>

        <label className="world-row">
          <span>{text.worldName}</span>
          <input value={worldName} maxLength={28} onChange={(event) => onNameChange(event.currentTarget.value)} />
        </label>

        <label className="world-row">
          <span>{text.difficulty}</span>
          <span className="segmented-control">
            <button className={difficulty === "easy" ? "active" : ""} type="button" onClick={() => onDifficultyChange("easy")}>
              {text.easy}
            </button>
            <button className={difficulty === "hard" ? "active" : ""} type="button" onClick={() => onDifficultyChange("hard")}>
              {text.hard}
            </button>
          </span>
        </label>

        {savedWorldName && <small>{text.savedWorld}: {savedWorldName}</small>}
        <button className="world-start-button" type="button" onClick={onStart}>{text.saveWorld}</button>
      </div>
    </div>
  );
}
