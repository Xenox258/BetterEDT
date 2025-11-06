import React from "react";
import type { CoursAPI } from "@/types/timetable";
import { formatTime, sortGroups, coursesOverlap, hexToRgba } from "@/lib/timetable-utils";

interface MobileDayPanelProps {
  day: string;
  dayIndex: number;
  courses: CoursAPI[];
  displayTimes: number[];
  dayStartHour: number;
  dayEndHour: number;
  pxPerMinute: number;
  contentHeight: number;
  panelWidth: number;
  timeColumnWidth: number;
  mobileScale: number;
  isTodayColumn: (dayIndex: number) => boolean;
  getDateForColumn: (dayIndex: number) => Date;
  nowMinutes: number;
}

const MobileDayPanelImpl: React.FC<MobileDayPanelProps> = ({
  day,
  dayIndex,
  courses,
  displayTimes,
  dayStartHour,
  dayEndHour,
  pxPerMinute,
  contentHeight,
  panelWidth,
  mobileScale,
  isTodayColumn,
  getDateForColumn,
  nowMinutes,
}) => {
  const dayCourses = [...courses].sort((a, b) => a.start_time - b.start_time);
  
  // Calculate columns for overlapping courses
  const coursesWithColumns = dayCourses.map((course) => ({ 
    ...course, 
    column: 0, 
    totalColumns: 1, 
    sortedGroups: sortGroups([...course.groups]) 
  }));
  
  for (let i = 0; i < coursesWithColumns.length; i++) {
    const current = coursesWithColumns[i];
    const overlapping = coursesWithColumns.filter((c, idx) => idx !== i && coursesOverlap(current, c));
    if (overlapping.length > 0) {
      const allOverlapping = [current, ...overlapping].sort((a, b) => {
        const groupA = a.sortedGroups[0] || '';
        const groupB = b.sortedGroups[0] || '';
        return groupA.localeCompare(groupB);
      });
      allOverlapping.forEach((course, index) => { course.column = index; });
      const totalCols = allOverlapping.length;
      allOverlapping.forEach(c => { c.totalColumns = totalCols; });
    }
  }

  return (
    <div
      className={`snap-start shrink-0 border-l border-border ${isTodayColumn(dayIndex) ? 'bg-primary/5' : 'bg-background'}`}
      style={{ width: `${panelWidth}px`, height: contentHeight }}
    >
      {/* Day header */}
      <div className="flex flex-col items-center justify-center font-semibold bg-muted/30 border-b border-border sticky top-0 z-30 bg-background/95">
        <span className="uppercase tracking-wide text-xs font-medium">{day.slice(0, 3)}</span>
        <span className={`text-sm font-semibold ${isTodayColumn(dayIndex) ? 'bg-primary/10 text-primary rounded-full px-2 py-0.5' : ''}`}>
          {getDateForColumn(dayIndex).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Content area with grid lines and courses */}
      <div className="relative overflow-hidden px-2 pt-2" style={{ height: contentHeight }}>
        {/* Time grid lines */}
        {displayTimes.map((t) => {
          const top = (t - dayStartHour * 60) * pxPerMinute;
          return (
            <div key={`line-${dayIndex}-${t}`} className="absolute left-0 right-0 border-t border-border/40" style={{ top }} />
          );
        })}

        {/* Current time indicator */}
        {isTodayColumn(dayIndex) && nowMinutes >= dayStartHour * 60 && nowMinutes <= dayEndHour * 60 && (
          <div className="absolute left-0 right-0 pointer-events-none" style={{ top: (nowMinutes - dayStartHour * 60) * pxPerMinute }}>
            <div className="absolute left-0 right-0 h-[2px] bg-rose-500/80" />
            <div className="absolute -left-2 top-0 w-3 h-3 rounded-full bg-rose-500 border-[3px] border-background shadow-sm" />
          </div>
        )}

        {/* Course cards */}
        {coursesWithColumns.map((c) => {
          const start = c.start_time;
          const end = c.end_time;
          
          // Adjust for courses starting before dayStartHour
          const visibleStart = Math.max(start, dayStartHour * 60);
          const visibleEnd = Math.min(end, dayEndHour * 60);
          
          // Position: starts at 0 if course begins before grid
          const rawTop = (visibleStart - dayStartHour * 60) * pxPerMinute;
          const top = rawTop; // Container padding handles spacing
          
          // Height: based only on visible portion of course
          const visibleDuration = visibleEnd - visibleStart;
          const visualDuration = Math.max(25, visibleDuration - 5);
          const baseHeight = Math.min(110, visualDuration * pxPerMinute);
          const scaledHeight = Math.max(40, Math.round(baseHeight * mobileScale));
          const maxAvail = Math.max(40, contentHeight - top - 12);
          const height = Math.min(scaledHeight, maxAvail);
          
          // Symmetric horizontal margins for centering (narrower cards)
          // Increase side margins to visually reduce card width
          let leftStyle = '14px';
          let widthStyle = 'calc(100% - 28px)';
          if (c.totalColumns > 1) {
            const gap = 6; // keep a bit more space between overlapping columns
            const columnWidth = 100 / c.totalColumns;
            const leftPercent = (c.column * columnWidth);
            const widthPercent = columnWidth;
            const leftMargin = c.column === 0 ? 14 : gap;
            const rightMargin = c.column === c.totalColumns - 1 ? 14 : gap;
            leftStyle = `calc(${leftPercent}% + ${leftMargin}px)`;
            widthStyle = `calc(${widthPercent}% - ${leftMargin + rightMargin}px)`;
          }

          const paddingY = Math.max(6, Math.round(8 * mobileScale));
          const paddingX = Math.max(8, Math.round(10 * mobileScale));
          const timeFontSize = Math.max(9, Math.round(10 * mobileScale));
          const titleFontSize = Math.max(11, Math.round(13 * mobileScale));
          const metaFontSize = Math.max(9, Math.round(10 * mobileScale));

          // Style inspiré Figma: border-left coloré + fond semi-transparent
          const isExam = c.is_graded || c.course_type === 'DS';
          
          return (
            <div
              key={`${c.id}-${c.day}-${c.start_time}`}
              className={`absolute rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md group overflow-hidden flex flex-col border-l-4 ${
                isExam ? 'ring-2 ring-amber-400/60' : ''
              }`}
              style={{ 
                top, 
                height, 
                left: leftStyle, 
                width: widthStyle, 
                backgroundColor: hexToRgba(c.display_color_bg, 0.15),
                borderLeftColor: c.display_color_bg,
                color: 'var(--foreground)',
                padding: `${paddingY}px ${paddingX}px`,
                backdropFilter: 'blur(2px)',
              }}
              title={`${isExam ? '📝 DS - ' : ''}${c.module_name} - ${formatTime(start)} - ${formatTime(end)}\n👤 ${c.tutor_username}\n📍 ${c.room_name}`}
            >
              {/* Badge DS si examen */}
              {isExam && (
                <div className="w-full mb-1">
                  <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded font-bold shadow-sm">
                    📝 DS
                  </span>
                </div>
              )}
              
              {/* Titre du cours */}
              <div className="w-full text-left font-bold leading-tight truncate mb-1" style={{ fontSize: `${titleFontSize}px` }}>
                {c.module_abbrev || c.module_name}
              </div>
              
              {/* Horaires */}
              <div className="w-full flex items-center justify-between text-muted-foreground font-medium mb-1" style={{ fontSize: `${timeFontSize}px` }}>
                <span>{formatTime(start)}</span>
                <span>•</span>
                <span>{formatTime(end)}</span>
              </div>
              
              {/* Professeur et salle */}
              <div className="w-full text-left text-muted-foreground space-y-0.5" style={{ fontSize: `${metaFontSize}px` }}>
                <div className="truncate">👤 {c.tutor_username}</div>
                <div className="truncate">📍 {c.room_name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const MobileDayPanel = React.memo(MobileDayPanelImpl);
