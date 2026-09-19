import React from "react";

export function Table({ columns = [], rows = [], empty = "Nada por aqui ainda" }) {
  return (
    <div className="hg-table-wrap">
      <table className="hg-table">
        <thead><tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((r, i) => (
            <tr key={i}>{r.map((cel, j) => <td key={j}>{cel}</td>)}</tr>
          )) : (
            <tr><td className="hg-table-empty" colSpan={columns.length}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
