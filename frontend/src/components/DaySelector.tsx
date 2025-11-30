import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DaySelectorProps {
  days: string[];
  selectedDayIndex: number;
  onDayChange: (index: number) => void;
  getDateForColumn: (dayIndex: number) => Date;
  isTodayColumn: (dayIndex: number) => boolean;
  week: number;
  onWeekChange: (week: number) => void;
  yearNumber: number;
  onYearChange: (year: number) => void;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  selectedDayIndex,
  onDayChange,
  getDateForColumn,
  isTodayColumn,
  week,
  onWeekChange,
  yearNumber,
  onYearChange,
}) => {
  const handlePrevious = () => {
    if (selectedDayIndex > 0) {
      // Jour précédent dans la même semaine
      onDayChange(selectedDayIndex - 1);
    } else {
      // Passer à la semaine précédente, vendredi
      if (week === 1) {
        onWeekChange(52);
        onYearChange(yearNumber - 1);
      } else {
        onWeekChange(week - 1);
      }
      onDayChange(4); // Vendredi
    }
  };

  const handleNext = () => {
    if (selectedDayIndex < days.length - 1) {
      // Jour suivant dans la même semaine
      onDayChange(selectedDayIndex + 1);
    } else {
      // Passer à la semaine suivante, lundi
      if (week >= 52) {
        onWeekChange(1);
        onYearChange(yearNumber + 1);
      } else {
        onWeekChange(week + 1);
      }
      onDayChange(0); // Lundi
    }
  };

  const selectedDate = getDateForColumn(selectedDayIndex);
  const monthYear = selectedDate.toLocaleDateString('fr-FR', { 
    month: 'long', 
    year: 'numeric' 
  });
  const dayName = days[selectedDayIndex];

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-3 px-2">
        <button
          onClick={handlePrevious}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Jour précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-lg font-semibold mb-0 capitalize">{monthYear}</h2>
          <p className="text-sm text-muted-foreground">{dayName}</p>
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Jour suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-hide justify-center">
        {days.map((day, index) => {
          const date = getDateForColumn(index);
          const isToday = isTodayColumn(index);
          const isSelected = selectedDayIndex === index;

          return (
            <button
              key={`day-pill-${index}`}
              onClick={() => onDayChange(index)}
              className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isToday
                  ? 'bg-primary/10 text-primary hover:bg-primary/20'
                  : 'bg-secondary/50 hover:bg-secondary'
              }`}
            >
              <span 
                className={`mb-1 text-xs ${
                  isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {day.slice(0, 3)}
              </span>
              <span 
                className={`text-lg ${
                  isSelected ? 'font-semibold' : 'font-medium'
                }`}
              >
                {date.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
