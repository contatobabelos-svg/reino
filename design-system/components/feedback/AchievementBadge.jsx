import React from "react";
import { Icon } from "../core/Icon.jsx";
import { ProgressBar } from "../data/ProgressBar.jsx";

export function AchievementBadge({ icon = "trofeu", name, description, meta, unlocked, progress, action }) {
  return (
    <article className={["hg-badge", unlocked ? "is-on" : ""].filter(Boolean).join(" ")}>
      <span className="hg-empty-ico"><Icon name={icon} /></span>
      <strong>{name}</strong>
      {description ? <span>{description}</span> : null}
      {meta ? <span>{meta}</span> : null}
      {progress != null && !unlocked ? <div style={{ width: "100%" }}><ProgressBar value={progress} /></div> : null}
      {action}
    </article>
  );
}
