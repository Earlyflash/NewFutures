"use client";

import { useState, useEffect } from "react";

type User = { id: string; name: string | null; email: string; role: string };

export function ManagerForm({ currentManagerId }: { currentManagerId?: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [managerId, setManagerId] = useState(currentManagerId ?? "");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/users/list")
      .then((r) => r.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
        if (!managerId && currentManagerId) setManagerId(currentManagerId);
        setLoaded(true);
      });
  }, [currentManagerId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId: managerId || null }),
      });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) return <p className="govuk-body">Loading…</p>;

  return (
    <form onSubmit={submit} className="govuk-!-margin-top-6 govuk-!-padding-top-6" style={{ borderTop: "1px solid #b1b4b6" }}>
      <h2 className="govuk-heading-m govuk-!-margin-bottom-4">Your manager</h2>
      <div className="govuk-form-group">
        <label className="govuk-label" htmlFor="manager-id">
          Select your manager
        </label>
        <select
          id="manager-id"
          className="govuk-select govuk-input--width-30"
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
        >
          <option value="">No manager selected</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email} {u.role !== "EMPLOYEE" ? `(${u.role})` : ""}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={loading} className="govuk-button">
        {loading ? "Saving…" : "Save manager"}
      </button>
    </form>
  );
}
