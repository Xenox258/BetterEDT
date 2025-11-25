import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProfilesContext } from '@/contexts/ProfilesContext';
import { useProfiles } from '@/hooks/use-profiles';
import type { UserProfile } from '@/hooks/use-profiles';

import { Moon, Sun } from 'lucide-react';

export function Welcome() {
  const [dept, setDept] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('edt-theme');
    return saved ? saved === 'dark' : true;
  });
  const context = useContext(ProfilesContext);

  if (!context) {
    throw new Error("useProfiles must be used within a ProfilesProvider");
  }

  const { createProfile, setActiveProfile } = context;

  useEffect(() => {
    localStorage.setItem('edt-theme', dark ? 'dark' : 'light');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  const handleStart = () => {
    if (dept && year) {
      // Create a new profile for this selection
      const profileName = `${dept} ${year}`;
      const newProfileData: Omit<UserProfile, 'id' | 'createdAt'> = {
        name: profileName,
        dept,
        year,
        groupFilter: 'ALL',
        theme: dark ? 'dark' : 'light',
      };
      
      // Sauvegarder immédiatement les valeurs dans localStorage
      // pour que Timetable.tsx les récupère lors de son initialisation
      localStorage.setItem('edt-last-dept', dept);
      localStorage.setItem('edt-last-year', year);
      localStorage.setItem('edt-last-group', 'ALL');
      
      const newProfile = createProfile(newProfileData);
      setActiveProfile(newProfile.id);
      // Navigation is now handled by App.tsx based on activeProfile state
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button onClick={() => setDark(!dark)} variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Bienvenue dans BetterEDT</CardTitle>
          <CardDescription>Veuillez sélectionner votre département et votre année pour commencer.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="dept-select" className="text-sm font-medium">Département</label>
              <Select onValueChange={setDept} value={dept}>
                <SelectTrigger id="dept-select">
                  <SelectValue placeholder="Sélectionnez un département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">🖥️ INFO</SelectItem>
                  <SelectItem value="CS">📚 CS</SelectItem>
                  <SelectItem value="GIM">⚙️ GIM</SelectItem>
                  <SelectItem value="RT">📡 RT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="year-select" className="text-sm font-medium">Année</label>
              <Select onValueChange={setYear} value={year}>
                <SelectTrigger id="year-select">
                  <SelectValue placeholder="Sélectionnez une année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUT1">🎓 BUT1</SelectItem>
                  <SelectItem value="BUT2">🎓 BUT2</SelectItem>
                  <SelectItem value="BUT3">🎓 BUT3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleStart} disabled={!dept || !year} className="w-full">
              Voir l'emploi du temps
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}