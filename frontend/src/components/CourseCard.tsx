import React from 'react';
import type { CoursAPI } from '@/types/timetable';
import { formatTime, hexToRgba, DAY_START_HOUR, HOUR_HEIGHT } from '@/lib/timetable-utils';

interface CourseCardProps {
  course: CoursAPI;
  column: number;
  totalColumns: number;
  isMobile: boolean;
  daysToShow: number;
  groupFilter: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  column,
  totalColumns,
  isMobile,
  daysToShow,
  groupFilter,
}) => {
  const pxPerMinute = HOUR_HEIGHT / 60;
  const start = course.start_time;
  const end = course.end_time;
  const top = (start - DAY_START_HOUR * 60) * pxPerMinute;
  
  const actualDuration = end - start;
  const visualDuration = Math.max(25, actualDuration - 5);
  const height = visualDuration * pxPerMinute;
  
  // Sur mobile, limiter la hauteur pour un affichage plus harmonieux
  const mobileHeight = isMobile ? Math.min(height, 110) : height;

  const displayName = course.module_abbrev || course.module_name || "Cours";
  const isCompactMode = groupFilter === "ALL" && totalColumns > 1;
  
  // Calcul de la position et largeur en fonction des colonnes
  let leftStyle, widthStyle;
  if (totalColumns > 1) {
    const gap = 4;
    const columnWidth = 100 / totalColumns;
    const leftPercent = (column * columnWidth);
    const widthPercent = columnWidth;
    
    const leftMargin = column === 0 ? 8 : gap;
    const rightMargin = column === totalColumns - 1 ? 8 : gap;
    
    leftStyle = `calc(${leftPercent}% + ${leftMargin}px)`;
    widthStyle = `calc(${widthPercent}% - ${leftMargin + rightMargin}px)`;
  } else {
    leftStyle = '8px';
    widthStyle = 'calc(100% - 16px)';
  }
  
  const mobileCardBackground = `linear-gradient(135deg, ${hexToRgba(course.display_color_bg, 1)} 0%, ${hexToRgba(course.display_color_bg, 0.85)} 95%)`;
  const mobileShadow = `0 6px 14px ${hexToRgba(course.display_color_bg, 0.35)}`;
  const mobileBorderColor = hexToRgba(course.display_color_bg, 0.45);

  // Style spécial pour les DS
  const isExam = course.is_graded || course.course_type === 'DS';
  
  // Style Figma: border-left coloré + fond semi-transparent
  const desktopStyle = {
    backgroundColor: hexToRgba(course.display_color_bg, 0.15),
    borderLeftColor: course.display_color_bg,
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid' as const,
    color: 'var(--foreground)',
  };

  return (
    <div
      className={`absolute rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md group overflow-hidden flex flex-col ${
        !isMobile && daysToShow === 1 ? 'items-center text-center' : ''
      } ${isCompactMode ? 'justify-center' : ''} ${isExam ? 'ring-2 ring-amber-400/60' : ''} border-l-4`}
      style={{
        top,
        height: mobileHeight,
        minHeight: isMobile ? '85px' : undefined,
        maxHeight: isMobile ? '110px' : undefined,
        left: leftStyle,
        width: widthStyle,
        ...desktopStyle,
        padding: isMobile ? (isCompactMode ? '6px 8px' : '8px 10px') : (isCompactMode ? '6px' : '8px'),
        backdropFilter: 'blur(2px)',
      }}
      title={`${isExam ? '📝 DEVOIR SURVEILLÉ - ' : ''}${course.module_name} (${displayName})\nGroupes: ${course.groups.join(', ')}\nProf: ${course.tutor_username}\nSalle: ${course.room_name}\nHoraire: ${formatTime(start)} - ${formatTime(end)}`}
    >
      {isMobile ? (
        <>
          {/* Badge DS si examen */}
          {isExam && (
            <div className="w-full mb-1">
              <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded font-bold shadow-sm">
                📝 DS
              </span>
            </div>
          )}
          
          {/* Titre du cours */}
          <div className="w-full text-left text-[13px] font-bold leading-tight mb-1 truncate">
            {displayName}
          </div>
          
          {/* Horaires */}
          <div className="w-full flex items-center justify-between text-muted-foreground text-[10px] font-medium mb-1">
            <span>{formatTime(start)}</span>
            <span>•</span>
            <span>{formatTime(end)}</span>
          </div>
          
          {/* Professeur et salle */}
          <div className="w-full text-left text-muted-foreground text-[10px] space-y-0.5">
            {!isCompactMode && (
              <>
                <div className="truncate">👤 {course.tutor_username}</div>
                <div className="truncate">� {course.room_name}</div>
              </>
            )}
            {isCompactMode && (
              <div className="truncate">📍 {course.room_name}</div>
            )}
          </div>
        </>
      ) : isCompactMode ? (
        <>
          <div className={`font-bold ${isMobile ? 'text-[10px]' : 'text-xs'} leading-tight truncate w-full text-center mb-0.5 flex flex-col items-center gap-0.5`}>
            {isExam && <span className="text-[9px] px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md font-bold shadow-sm whitespace-nowrap">📝 DS</span>}
            <span>{displayName}</span>
          </div>
          {course.groups.length > 0 && (
            <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} leading-tight truncate w-full text-center opacity-90 mb-0.5`}>
              {course.groups.join(',')}
            </div>
          )}
          <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} leading-tight truncate w-full text-center opacity-80`}>
            {course.room_name}
          </div>
        </>
      ) : (
        <>
          {/* Badge DS si examen */}
          {isExam && (
            <div className={`mb-1 ${daysToShow === 1 ? 'w-full' : ''}`}>
              <span className="text-[10px] px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md font-bold shadow-md whitespace-nowrap">
                📝 DS
              </span>
            </div>
          )}
          
          {/* Titre du cours */}
          <div className={`font-bold ${isMobile ? 'text-xs' : 'text-sm'} leading-tight truncate mb-1 ${
            daysToShow === 1 || isMobile ? 'w-full' : ''
          }`}>
            {displayName}
          </div>
          
          {/* Horaires */}
          {height >= (isMobile ? 50 : 60) && (
            <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground leading-tight mb-1 truncate ${
              daysToShow === 1 || isMobile ? 'w-full' : ''
            }`}>
              {formatTime(start)} - {formatTime(end)}
            </div>
          )}
          
          {/* Professeur et salle */}
          {height >= (isMobile ? 50 : 65) && (
            <>
              <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground leading-tight mb-0.5 truncate ${
                daysToShow === 1 || isMobile ? 'w-full' : ''
              }`}>
                👤 {course.tutor_username}
              </div>
              <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-muted-foreground leading-tight truncate ${
                daysToShow === 1 || isMobile ? 'w-full' : ''
              }`}>
                📍 {course.room_name}
              </div>
            </>
          )}
          
          {/* Groupes */}
          {height >= (isMobile ? 85 : 100) && course.groups.length > 0 && (
            <div className={`${isMobile ? 'text-[9px]' : 'text-[11px]'} text-muted-foreground/70 leading-tight mt-auto truncate ${
              daysToShow === 1 || isMobile ? 'w-full' : ''
            }`}>
              👥 {course.groups.join(', ')}
            </div>
          )}
        </>
      )}
    </div>
  );
};
