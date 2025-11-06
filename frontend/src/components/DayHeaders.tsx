import React from "react";

interface DayHeadersProps {
  days: string[];
  startDayIndex: number;
  daysToShow: number;
  isMobile: boolean;
  isTodayColumn: (dayIndex: number) => boolean;
  getDateForColumn: (dayIndex: number) => Date;
}

const DayHeadersImpl: React.FC<DayHeadersProps> = ({
  days,
  startDayIndex,
  daysToShow,
  isMobile,
  isTodayColumn,
  getDateForColumn,
}) => {
  return (
    <>
      {!(isMobile && daysToShow === 1) && days.slice(startDayIndex, startDayIndex + daysToShow).map((day, i) => {
        const absoluteIndex = startDayIndex + i;
        const dateForDay = getDateForColumn(absoluteIndex);
        const dayLabel = day.slice(0, 3); // Toujours abrégé comme dans Figma
        const dayNumber = dateForDay.getDate(); // Juste le numéro
        const today = isTodayColumn(absoluteIndex);

        return (
          <div
            key={`head-${day}`}
            className={`flex flex-col items-center justify-center border-l border-b border-border ${
              isMobile ? 'sticky top-0 z-30 bg-background/95 backdrop-blur-sm' : 'bg-muted/20'
            } py-2 px-1`}
          >
            <span className={`text-xs mb-0.5 ${
              today ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>
              {dayLabel}
            </span>
            <span className={`text-lg font-medium ${
              today ? 'text-primary font-semibold' : 'text-foreground'
            }`}>
              {dayNumber}
            </span>
          </div>
        );
      })}
    </>
  );
};

export const DayHeaders = React.memo(DayHeadersImpl);
