"use client";

type Language = "ko" | "en";

export type GameSettings = {
  language: Language;
  sfxVolume: number;
  footstepsVolume: number;
  mouseSensitivity: number;
};

type SettingsText = {
  title: string;
  close: string;
  language: string;
  korean: string;
  english: string;
  sfxVolume: string;
  footstepsVolume: string;
  mouseSensitivity: string;
};

type SettingsPanelProps = {
  settings: GameSettings;
  text: SettingsText;
  onClose: () => void;
  onChange: (settings: GameSettings) => void;
};

export default function SettingsPanel({ settings, text, onClose, onChange }: SettingsPanelProps) {
  const update = (next: Partial<GameSettings>) => onChange({ ...settings, ...next });

  return (
    <section className="settings-overlay" aria-label={text.title}>
      <div className="settings-panel" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>{text.title}</strong>
          <button type="button" onClick={onClose}>{text.close}</button>
        </header>

        <label className="setting-row">
          <span>{text.language}</span>
          <span className="segmented-control">
            <button
              className={settings.language === "ko" ? "active" : ""}
              type="button"
              onClick={() => update({ language: "ko" })}
            >
              {text.korean}
            </button>
            <button
              className={settings.language === "en" ? "active" : ""}
              type="button"
              onClick={() => update({ language: "en" })}
            >
              {text.english}
            </button>
          </span>
        </label>

        <label className="setting-row">
          <span>{text.sfxVolume}</span>
          <input
            max="100"
            min="0"
            type="range"
            value={settings.sfxVolume}
            onChange={(event) => update({ sfxVolume: Number(event.currentTarget.value) })}
          />
          <b>{settings.sfxVolume}%</b>
        </label>

        <label className="setting-row">
          <span>{text.footstepsVolume}</span>
          <input
            max="100"
            min="0"
            type="range"
            value={settings.footstepsVolume}
            onChange={(event) => update({ footstepsVolume: Number(event.currentTarget.value) })}
          />
          <b>{settings.footstepsVolume}%</b>
        </label>

        <label className="setting-row">
          <span>{text.mouseSensitivity}</span>
          <input
            max="120"
            min="20"
            type="range"
            value={settings.mouseSensitivity}
            onChange={(event) => update({ mouseSensitivity: Number(event.currentTarget.value) })}
          />
          <b>{settings.mouseSensitivity}%</b>
        </label>
      </div>
    </section>
  );
}
