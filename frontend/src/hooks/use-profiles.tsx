import { useState, useEffect, useMemo } from "react";

export interface UserProfile {
  id: string;
  name: string;
  dept: string;
  year: string;
  groupFilter: string;
  theme: "dark" | "light";
  createdAt: string;
}

const STORAGE_KEY = "edt-user-profiles";
const ACTIVE_PROFILE_KEY = "edt-active-profile";

export function useProfiles() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  // Charger les profils depuis localStorage au démarrage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfiles(parsed);
      } catch (e) {
        console.error("Failed to parse profiles:", e);
      }
    }
    
    if (activeId) {
      setActiveProfileId(activeId);
    }
  }, []);

  // Sauvegarder les profils dans localStorage quand ils changent
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles]);

  // Sauvegarder le profil actif dans localStorage quand il change
  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }, [activeProfileId]);

  const createProfile = (profile: Omit<UserProfile, "id" | "createdAt">) => {
    const newProfile: UserProfile = {
      ...profile,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    
    return newProfile;
  };

  const updateProfile = (id: string, updates: Partial<UserProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProfile = (id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    
    if (activeProfileId === id) {
      setActiveProfileId(null);
    }
  };

  const setActiveProfile = (id: string | null) => {
    setActiveProfileId(id);
  };

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) || null,
    [profiles, activeProfileId]
  );

  return {
    profiles,
    activeProfile,
    activeProfileId,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  };
}
