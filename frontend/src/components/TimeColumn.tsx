import React from "react";

interface TimeColumnProps {
  contentHeight: number;
  displayTimes: number[];
  dayStartHour: number;
  pxPerMinute: number;
  timeColumnExpanded: boolean;
  isMobile: boolean;
  nowMinutes: number;
  gridRow?: string;
}

const TimeColumnImpl: React.FC<TimeColumnProps> = ({
  contentHeight,
  displayTimes,
  dayStartHour,
  pxPerMinute,
  timeColumnExpanded,
  isMobile,
  nowMinutes,
  gridRow = '2',
}) => {
  // Générer les heures principales pour un affichage Figma-style
  // Inclure les horaires typiques de cours : 8h, 9h30, 11h, 12h30, 14h15, 15h45, 17h15
  const mainHours: number[] = [
    8 * 60,      // 8h
    9 * 60 + 30, // 9h30
    11 * 60,     // 11h
    12 * 60 + 30,// 12h30
    14 * 60 + 15,// 14h15
    15 * 60 + 45,// 15h45
    17 * 60 + 15 // 17h15
  ];

  const formatHour = (minutes: number): string => {
    const hour = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hour}h`;
    }
    return `${hour}h${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="relative bg-muted/10 border-r border-border"
      style={{ height: contentHeight, gridRow }}
    >
      {timeColumnExpanded ? (
        // Mode étendu : afficher les heures principales
        mainHours.map((t) => {
          const top = (t - dayStartHour * 60) * pxPerMinute;
          const offset = t === dayStartHour * 60 ? 4 : -4;
          
          return (
            <div
              key={`time-${t}`}
              className={`absolute ${isMobile ? 'right-1 text-[10px]' : 'right-3 text-xs'} font-medium text-muted-foreground text-right`}
              style={{ top: top + offset }}
            >
              {formatHour(t)}
            </div>
          );
        })
      ) : (
        // Mode réduit : juste des lignes
        displayTimes.map((t) => {
          const top = (t - dayStartHour * 60) * pxPerMinute;
          const offset = t === dayStartHour * 60 ? 4 : -4;
          return (
            <div
              key={`time-collapsed-${t}`}
              className="absolute left-1 right-1 h-[1px] bg-border/60"
              style={{ top: top + offset + 2 }}
            />
          );
        })
      )}
    </div>
  );
};

export const TimeColumn = React.memo(TimeColumnImpl);
