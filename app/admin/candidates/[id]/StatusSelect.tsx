"use client";

import { useState } from "react";

export function StatusSelect({ defaultValue, options }: { defaultValue: string; options: { value: string; label: string }[] }) {
  const [v, setV] = useState(defaultValue);
  return (
    <>
      <select name="status" value={v} onChange={(e) => setV(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <input type="hidden" name="statusChanged" value={v !== defaultValue ? "1" : "0"} />
    </>
  );
}
