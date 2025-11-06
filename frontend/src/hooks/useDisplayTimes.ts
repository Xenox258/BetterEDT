import { useMemo } from "react";
import type { CoursAPI } from "@/types/timetable";

export function useDisplayTimes(courses: CoursAPI[], dayStartHour: number, dayEndHour: number) {
  return useMemo(() => {
    // Horaires typiques de début de cours (en minutes depuis minuit)
    const typicalStartTimes = [
      8 * 60,      // 8:00
      9 * 60 + 30, // 9:30
      11 * 60,     // 11:00
      12 * 60 + 30,// 12:30 (pause déjeuner)
      14 * 60 + 15,// 14:15
      15 * 60 + 45,// 15:45
      17 * 60 + 15 // 17:15
    ];

    if (courses.length === 0) {
      // Si pas de cours, afficher les horaires typiques
      return typicalStartTimes.filter(t => t >= dayStartHour * 60 && t < dayEndHour * 60);
    }

    // Récupérer tous les débuts de cours réels
    const actualStartTimes = Array.from(new Set(courses.map(c => c.start_time)));
    
    // Combiner les horaires typiques et les débuts réels
    const times = new Set<number>([
      ...typicalStartTimes,
      ...actualStartTimes
    ]);

    return Array.from(times)
      .sort((a, b) => a - b)
      .filter(t => t >= dayStartHour * 60 && t < dayEndHour * 60);
  }, [courses, dayStartHour, dayEndHour]);
}
