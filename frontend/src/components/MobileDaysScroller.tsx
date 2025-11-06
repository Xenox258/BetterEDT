import React, { type CSSProperties } from "react";
import type { CoursAPI } from "@/types/timetable";
import { MobileDayPanel } from "./MobileDayPanel";

interface MobileDaysScrollerProps {
  days: string[];
  coursesByDay: { [key: number]: CoursAPI[] };
  displayTimes: number[];
  dayStartHour: number;
  dayEndHour: number;
  pxPerMinute: number;
  contentHeight: number;
  timeColumnWidth: number;
  startDayIndex: number;
  setStartDayIndex: (index: number) => void;
  isTodayColumn: (dayIndex: number) => boolean;
  getDateForColumn: (dayIndex: number) => Date;
  nowMinutes: number;
  daysToShow: number;
}

const MobileDaysScrollerImpl: React.FC<MobileDaysScrollerProps> = ({
  days,
  coursesByDay,
  displayTimes,
  dayStartHour,
  dayEndHour,
  pxPerMinute,
  contentHeight,
  timeColumnWidth,
  startDayIndex,
  setStartDayIndex,
  isTodayColumn,
  getDateForColumn,
  nowMinutes,
  daysToShow,
}) => {
  const daysScrollRef = React.useRef<HTMLDivElement | null>(null);
  const panelWidthRef = React.useRef<number>(0);
  const isProgrammaticScroll = React.useRef(false);
  const nextIndexChangeIsUserRef = React.useRef(false);
  const [snapDisabled, setSnapDisabled] = React.useState(false);
  const isUserScrolling = React.useRef(false);
  const touchStartRef = React.useRef(false);

  const isMobile = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Compute mobile panel scale factor
  const mobileBaseWidth = 360;
  const mobileScale = React.useMemo(() => {
    const w = panelWidthRef.current || Math.max(1, window.innerWidth - timeColumnWidth);
    return Math.max(0.7, Math.min(1.15, w / mobileBaseWidth));
  }, [timeColumnWidth]);

  // Resize listener to recalc panel width without forcing a scroll position
  React.useEffect(() => {
    const onResize = () => {
      const w = Math.max(1, window.innerWidth - timeColumnWidth);
      panelWidthRef.current = w;
      // Do not force scroll here; letting CSS snap and the next scrollend stabilize prevents rollbacks
    };
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, [startDayIndex, timeColumnWidth]);

  // Snap to selected day when startDayIndex changes (synchronous, before paint)
  React.useLayoutEffect(() => {
    const container = daysScrollRef.current;
    if (!container) return;

    const full = window.innerWidth;
    const panelWidth = Math.max(1, full - timeColumnWidth);
    panelWidthRef.current = panelWidth;

    const targetScroll = startDayIndex * panelWidth;
    // If the change came from user scroll, don't re-trigger smooth scroll
    if (nextIndexChangeIsUserRef.current) {
      nextIndexChangeIsUserRef.current = false;
      return;
    }
    // Temporarily disable snap so the browser doesn't fight the programmatic position
    isProgrammaticScroll.current = true;
    setSnapDisabled(true);
    // Synchronous scroll to prevent visible rollback
    container.scrollLeft = targetScroll;
    // Re-enable quickly after one frame
    const id = window.setTimeout(() => {
      isProgrammaticScroll.current = false;
      setSnapDisabled(false);
    }, 16);
    return () => window.clearTimeout(id);
  }, [startDayIndex, timeColumnWidth]);

  // Sync startDayIndex when user scrolls/swipes (robust user detection + debounce)
  React.useEffect(() => {
    const container = daysScrollRef.current;
    if (!container) return;

    let timeout: number | undefined;
    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      // mark user scroll start
      if (!isUserScrolling.current) {
        isUserScrolling.current = true;
        setSnapDisabled(true);
      }
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(() => {
        const left = container.scrollLeft;
        const w = panelWidthRef.current || Math.max(1, window.innerWidth - timeColumnWidth);
        const idx = Math.round(left / w);
        const maxIdx = Math.max(0, days.length - 1);
        const clamped = Math.max(0, Math.min(maxIdx, idx));
        if (clamped !== startDayIndex) {
          // Mark that this change came from user interaction to avoid re-smoothing
          nextIndexChangeIsUserRef.current = true;
          setStartDayIndex(clamped);
        }
        // end of user scroll after debounce
        isUserScrolling.current = false;
        // small delay to let snapping settle before re-enabling
        window.setTimeout(() => setSnapDisabled(false), 100);
      }, 250);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [startDayIndex, timeColumnWidth, setStartDayIndex, days.length]);

  // Temporarily disable snap during touch interaction (mobile)
  React.useEffect(() => {
    const container = daysScrollRef.current;
    if (!container) return;

    const onTouchStart = () => {
      touchStartRef.current = true;
      setSnapDisabled(true);
    };

    const onTouchEnd = () => {
      touchStartRef.current = false;
      window.setTimeout(() => setSnapDisabled(false), 100);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const panelWidth = Math.max(1, window.innerWidth - timeColumnWidth);

  const scrollSnapType: CSSProperties["scrollSnapType"] =
    snapDisabled || (isMobile && isUserScrolling.current) ? "none" : "x mandatory";

  return (
    <div
      ref={daysScrollRef}
      className="flex overflow-x-auto touch-pan-x scroll-smooth snap-x snap-mandatory"
      style={{
        scrollSnapType,
        gridColumn: `2 / span ${daysToShow}`,
        gridRow: `1 / span 2`,
      }}
    >
      {days.map((day, dayIdx) => (
        <MobileDayPanel
          key={`panel-${dayIdx}`}
          day={day}
          dayIndex={dayIdx}
          courses={coursesByDay[dayIdx + 1] || []}
          displayTimes={displayTimes}
          dayStartHour={dayStartHour}
          dayEndHour={dayEndHour}
          pxPerMinute={pxPerMinute}
          contentHeight={contentHeight}
          panelWidth={panelWidth}
          timeColumnWidth={timeColumnWidth}
          mobileScale={mobileScale}
          isTodayColumn={isTodayColumn}
          getDateForColumn={getDateForColumn}
          nowMinutes={nowMinutes}
        />
      ))}
    </div>
  );
};

export const MobileDaysScroller = React.memo(MobileDaysScrollerImpl);
