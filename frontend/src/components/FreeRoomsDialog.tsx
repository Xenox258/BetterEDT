import { useState, useEffect } from "react";
import { DoorOpen, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FreeRoomsData {
  rooms: string[];
  week: number;
  year: number;
  timeSlots: string[];
  schedule: {
    [day: string]: {
      [time: string]: string[];
    };
  };
}

interface FreeRoomsDialogProps {
  week: number;
  year: number;
  apiBase: string;
  renderTrigger?: (onClick: () => void) => React.ReactNode;
}

const dayNames: { [key: string]: string } = {
  mo: "Lundi",
  tu: "Mardi",
  we: "Mercredi",
  th: "Jeudi",
  fr: "Vendredi",
};

export function FreeRoomsDialog({ week, year, apiBase, renderTrigger }: FreeRoomsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FreeRoomsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("mo");

  useEffect(() => {
    if (isOpen) {
      fetchFreeRooms();
    }
  }, [isOpen, week, year]);

  const fetchFreeRooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiBase}/api/free-rooms?dept=INFO&week=${week}&year=${year}`
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des salles libres");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching free rooms:", err);
      setError("Impossible de charger les salles libres");
    } finally {
      setLoading(false);
    }
  };

  const renderRoomGrid = () => {
    if (!data || !data.schedule[selectedDay]) {
      return <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>;
    }

    const daySchedule = data.schedule[selectedDay];
    // Use timeSlots from API (course start times only)
    const timeSlots = data.timeSlots || Object.keys(daySchedule).sort();

    // Filtrer les salles "ext" (salles extérieures)
    const filterExtRooms = (rooms: string[]) => 
      rooms.filter(room => !room.toLowerCase().includes('ext'));

    const filteredAllRooms = filterExtRooms(data.rooms);

    return (
      <div className="space-y-2">
        {timeSlots.map((time) => {
          const freeRooms = filterExtRooms(daySchedule[time]);
          const occupiedCount = filteredAllRooms.length - freeRooms.length;

          return (
            <div
              key={time}
              className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">{time}</span>
                <span className="text-xs text-muted-foreground">
                  {freeRooms.length}/{filteredAllRooms.length} libres
                </span>
              </div>

              {freeRooms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {freeRooms.map((room) => (
                    <span
                      key={room}
                      className="px-2 py-1 text-xs font-medium rounded-md bg-green-500/20 text-green-700 dark:text-green-300 border border-green-500/30"
                    >
                      {room}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Toutes les salles sont occupées.
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTrigger ? (
          renderTrigger(() => setIsOpen(true))
        ) : (
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted transition-base shadow-elegant">
            <DoorOpen className="w-4 h-4" />
            <span className="font-medium">Salles libres</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Salles libres - Bâtiment B (INFO)</DialogTitle>
          <DialogDescription>
            Semaine {week} • {year} • Toutes les salles B---.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <X className="w-12 h-12 text-destructive mb-4" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchFreeRooms} variant="outline" className="mt-4">
              Réessayer
            </Button>
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Day selector */}
            <div className="flex gap-2 border-b pb-3">
              {Object.entries(dayNames).map(([key, name]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDay(key)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDay === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-muted/50">
              {/* Current availability */}
              <div className="text-center">
                {(() => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();
                  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                  const dayMap = ['', 'mo', 'tu', 'we', 'th', 'fr', '', ''];
                  const currentDay = dayMap[now.getDay()];
                  
                  if (currentDay === selectedDay && currentHour >= 8 && currentHour < 18) {
                    // Find the current or next time slot
                    const timeSlots = data.timeSlots || [];
                    const currentSlot = timeSlots.find((slot, idx) => {
                      const nextSlot = timeSlots[idx + 1];
                      return slot <= currentTime && (!nextSlot || currentTime < nextSlot);
                    });
                    
                    const freeNow = currentSlot ? (data.schedule[selectedDay][currentSlot]?.length || 0) : 0;
                    return (
                      <>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{freeNow}</p>
                        <p className="text-xs text-muted-foreground">Libres maintenant</p>
                      </>
                    );
                  }
                  return (
                    <>
                      <p className="text-2xl font-bold text-muted-foreground">—</p>
                      <p className="text-xs text-muted-foreground">Hors horaires</p>
                    </>
                  );
                })()}
              </div>

              {/* Best time slot */}
              <div className="text-center">
                {(() => {
                  if (!data.schedule[selectedDay]) return null;
                  const daySchedule = data.schedule[selectedDay];
                  // Exclude lunch time (12:35) from best slot calculation
                  const bestSlot = Object.entries(daySchedule)
                    .filter(([time]) => time !== '12:35')
                    .reduce((best, [time, rooms]) => {
                      const bestRooms = daySchedule[best]?.length || 0;
                      return rooms.length > bestRooms ? time : best;
                    }, Object.keys(daySchedule).find(t => t !== '12:35') || Object.keys(daySchedule)[0]);
                  
                  return (
                    <>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{bestSlot}</p>
                      <p className="text-xs text-muted-foreground">Meilleur créneau</p>
                    </>
                  );
                })()}
              </div>

              {/* Average occupancy */}
              <div className="text-center">
                {(() => {
                  if (!data.schedule[selectedDay]) return null;
                  const daySchedule = data.schedule[selectedDay];
                  const totalSlots = Object.keys(daySchedule).length;
                  const totalOccupied = Object.values(daySchedule).reduce((sum, rooms) => {
                    return sum + (data.rooms.length - rooms.length);
                  }, 0);
                  const avgOccupied = totalSlots > 0 ? Math.round((totalOccupied / (data.rooms.length * totalSlots)) * 100) : 0;
                  
                  return (
                    <>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{avgOccupied}%</p>
                      <p className="text-xs text-muted-foreground">Occupation moy.</p>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Room grid */}
            <ScrollArea className="h-[400px] pr-4">
              {renderRoomGrid()}
            </ScrollArea>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
