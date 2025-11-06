import { useState } from "react";
import { User, Plus, Trash2, Check } from "lucide-react";
import { UserProfile } from "@/hooks/use-profiles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileManagerProps {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  dept: string;
  year: string;
  groupFilter: string;
  theme: "dark" | "light";
  onCreateProfile: (profile: Omit<UserProfile, "id" | "createdAt">) => void;
  onSelectProfile: (id: string | null) => void;
  onDeleteProfile: (id: string) => void;
  onUpdateProfile: (id: string, updates: Partial<UserProfile>) => void;
  renderTrigger?: (onClick: () => void) => React.ReactNode;
}

export function ProfileManager({
  profiles,
  activeProfile,
  dept,
  year,
  groupFilter,
  theme,
  onCreateProfile,
  onSelectProfile,
  onDeleteProfile,
  onUpdateProfile,
  renderTrigger,
}: ProfileManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;

    onCreateProfile({
      name: newProfileName.trim(),
      dept,
      year,
      groupFilter,
      theme,
    });

    setNewProfileName("");
    setIsCreating(false);
    setIsOpen(false);
  };

  const handleUpdateCurrentProfile = () => {
    if (!activeProfile) return;

    onUpdateProfile(activeProfile.id, {
      dept,
      year,
      groupFilter,
      theme,
    });

    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTrigger ? (
          renderTrigger(() => setIsOpen(true))
        ) : (
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-base shadow-elegant">
            <User className="w-4 h-4" />
            <span className="font-medium">
              {activeProfile ? activeProfile.name : "Profils"}
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gérer les profils</DialogTitle>
          <DialogDescription>
            Créez et gérez vos profils pour sauvegarder vos préférences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Liste des profils existants */}
          <div className="space-y-2">
            <Label>Profils enregistrés</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucun profil enregistré
                </p>
              ) : (
                profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      activeProfile?.id === profile.id
                        ? "bg-primary/10 border-primary"
                        : "bg-card border-border hover:bg-muted"
                    }`}
                  >
                    <button
                      onClick={() => onSelectProfile(profile.id)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      {activeProfile?.id === profile.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                      <div>
                        <p className="font-medium">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {profile.dept} • {profile.year} • {profile.groupFilter}
                        </p>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteProfile(profile.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Créer un nouveau profil */}
          {isCreating ? (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <Label htmlFor="profile-name">Nom du profil</Label>
              <Input
                id="profile-name"
                placeholder="Ex: BUT2 INFO - Groupe 1"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateProfile();
                }}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Sauvegarde : {dept} • {year} • {groupFilter} • Thème {theme === 'dark' ? 'Sombre' : 'Clair'}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateProfile}
                  disabled={!newProfileName.trim()}
                  className="flex-1"
                >
                  Créer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setNewProfileName("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un nouveau profil
            </Button>
          )}

          {/* Mettre à jour le profil actif */}
          {activeProfile && !isCreating && (
            <div className="pt-4 border-t">
              <Button onClick={handleUpdateCurrentProfile} className="w-full">
                Mettre à jour "{activeProfile.name}" avec les préférences actuelles
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
