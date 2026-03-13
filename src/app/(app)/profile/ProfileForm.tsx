"use client";

import { useState } from "react";

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="govuk-!-margin-top-6 govuk-!-padding-top-6" style={{ borderTop: "1px solid #b1b4b6" }}>
      <div className="govuk-form-group">
        <label className="govuk-label" htmlFor="profile-name">
          Display name
        </label>
        <input
          id="profile-name"
          type="text"
          className="govuk-input govuk-input--width-30"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button type="submit" disabled={saving} className="govuk-button">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
