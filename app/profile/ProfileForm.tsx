"use client";

import { useState } from "react";

type ProfileFormProps = {
  initialName: string;
  initialPhone: string;
};

export default function ProfileForm({
  initialName,
  initialPhone,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage("");
    setProfileError("");
    setProfileSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileError(data.error || "Could not update profile.");
        return;
      }

      setName(data.profile.name);
      setPhone(data.profile.phone || "");
      setProfileMessage("Profile updated.");
    } catch {
      setProfileError("Could not update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch("/api/profile/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || "Could not change password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password changed.");
    } catch {
      setPasswordError("Could not change password.");
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="profile-form-grid">
      <form className="profile-panel" onSubmit={saveProfile}>
        <h2>Account Details</h2>

        <label className="profile-field">
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
          />
        </label>

        <label className="profile-field">
          <span>Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            maxLength={50}
            placeholder="Optional"
          />
        </label>

        {profileError ? (
          <p className="profile-message error">{profileError}</p>
        ) : null}

        {profileMessage ? (
          <p className="profile-message success">{profileMessage}</p>
        ) : null}

        <button type="submit" disabled={profileSaving}>
          {profileSaving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      <form className="profile-panel" onSubmit={changePassword}>
        <h2>Change Password</h2>

        <label className="profile-field">
          <span>Current password</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="profile-field">
          <span>New password</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <label className="profile-field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        {passwordError ? (
          <p className="profile-message error">{passwordError}</p>
        ) : null}

        {passwordMessage ? (
          <p className="profile-message success">{passwordMessage}</p>
        ) : null}

        <button type="submit" disabled={passwordSaving}>
          {passwordSaving ? "Changing..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
