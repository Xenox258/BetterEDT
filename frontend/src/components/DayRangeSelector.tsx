import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DayRangeSelectorProps {
  days: string[];
  startDayIndex: number;
  daysToShow: number;
  onStartDayChange: (index: number) => void;
  getDateForColumn: (dayIndex: number) => Date;
  isTodayColumn: (dayIndex: number) => boolean;
}

export const DayRangeSelector: React.FC<DayRangeSelectorProps> = ({
  days,
  startDayIndex,
  daysToShow,
  onStartDayChange,
  getDateForColumn,
  isTodayColumn,
}) => {
  const handlePrevious = () => {
    if (startDayIndex > 0) {
      onStartDayChange(startDayIndex - 1);
    }
  };

  const handleNext = () => {
    if (startDayIndex < 5 - daysToShow) {
      onStartDayChange(startDayIndex + 1);
    }
  };

  const selectedDate = getDateForColumn(startDayIndex);
  const monthYear = selectedDate.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Calculer le range de jours affichés
  const dayRange = `${days[startDayIndex].slice(0, 3)}-${days[startDayIndex + daysToShow - 1].slice(0, 3)}`;

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <button
          onClick={handlePrevious}
          disabled={startDayIndex === 0}
          className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Jours précédents"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold mb-0 capitalize">{monthYear}</h2>
          <p className="text-sm text-muted-foreground">{dayRange}</p>
        </div>

        <button
          onClick={handleNext}
          disabled={startDayIndex >= 5 - daysToShow}
          className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Jours suivants"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Pills - affiche les jours du range */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide justify-center">
        {Array.from({ length: daysToShow }, (_, i) => {
          const dayIndex = startDayIndex + i;
          const day = days[dayIndex];
          const date = getDateForColumn(dayIndex);
          const isToday = isTodayColumn(dayIndex);

          return (
            <div
              key={`day-pill-${dayIndex}`}
              className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl transition-all ${
                isToday
                  ? 'bg-primary/10 text-primary'
                  : 'bg-secondary/50'
              }`}
            >
              <span 
                className={`mb-1 text-xs ${
                  isToday ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {day.slice(0, 3)}
              </span>
              <span 
                className={`text-lg ${
                  isToday ? 'font-semibold' : 'font-medium'
                }`}
              >
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
