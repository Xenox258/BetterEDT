import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DaySelectorProps {
  days: string[];
  selectedDayIndex: number;
  onDayChange: (index: number) => void;
  getDateForColumn: (dayIndex: number) => Date;
  isTodayColumn: (dayIndex: number) => boolean;
}

export const DaySelector: React.FC<DaySelectorProps> = ({
  days,
  selectedDayIndex,
  onDayChange,
  getDateForColumn,
  isTodayColumn,
}) => {
  const handlePrevious = () => {
    if (selectedDayIndex > 0) {
      onDayChange(selectedDayIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedDayIndex < days.length - 1) {
      onDayChange(selectedDayIndex + 1);
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
          disabled={selectedDayIndex === 0}
          className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
          disabled={selectedDayIndex === days.length - 1}
          className="p-2 rounded-lg hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
