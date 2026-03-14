"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  managerId: string | null;
  manager: { id: string; name: string | null; email: string } | null;
};

type ManagerOption = { id: string; email: string; name: string | null; role: string };

const ROLES = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "MANAGER", label: "Manager" },
  { value: "HR", label: "HR" },
];

export function AdminUserForm({
  user,
  managerOptions,
}: {
  user: User;
  managerOptions: ManagerOption[];
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [role, setRole] = useState(user.role);
  const [managerId, setManagerId] = useState(user.managerId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          role,
          managerId: managerId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save");
        return;
      }
      router.push("/admin/users");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="govuk-!-margin-top-6">
      {error && (
        <div
          className="govuk-error-message govuk-!-margin-bottom-4"
          role="alert"
        >
          {error}
        </div>
      )}
      <div className="govuk-form-group govuk-!-margin-bottom-4">
        <label className="govuk-label" htmlFor="admin-user-email">
          Email
        </label>
        <input
          id="admin-user-email"
          type="text"
          className="govuk-input govuk-input--width-30"
          value={user.email}
          readOnly
          disabled
          aria-describedby="admin-user-email-hint"
        />
        <span id="admin-user-email-hint" className="govuk-hint">
          Email is set at sign-in and cannot be changed here.
        </span>
      </div>
      <div className="govuk-form-group govuk-!-margin-bottom-4">
        <label className="govuk-label" htmlFor="admin-user-name">
          Display name
        </label>
        <input
          id="admin-user-name"
          type="text"
          className="govuk-input govuk-input--width-30"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="govuk-form-group govuk-!-margin-bottom-4">
        <label className="govuk-label" htmlFor="admin-user-role">
          Role
        </label>
        <select
          id="admin-user-role"
          className="govuk-select govuk-input--width-10"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="govuk-form-group govuk-!-margin-bottom-6">
        <label className="govuk-label" htmlFor="admin-user-manager">
          Manager
        </label>
        <select
          id="admin-user-manager"
          className="govuk-select govuk-input--width-30"
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
        >
          <option value="">No manager</option>
          {managerOptions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name || u.email} {u.role !== "EMPLOYEE" ? `(${u.role})` : ""}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={saving} className="govuk-button">
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
