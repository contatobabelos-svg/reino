import React from "react";
import { Avatar } from "../core/Avatar.jsx";

export function ListRow({ title, subtitle, time, avatar, avatarGradient, right, as = "li", ...rest }) {
  const Tag = as;
  return (
    <Tag className="hg-row" {...rest}>
      {avatar === false ? null : <Avatar name={typeof avatar === "string" ? avatar : title} gradient={avatarGradient} />}
      <div>
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </div>
      {time ? <time>{time}</time> : right}
    </Tag>
  );
}
