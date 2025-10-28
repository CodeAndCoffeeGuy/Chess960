'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Trophy, Users, Clock, Zap } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description: string | null;
  status: 'UPCOMING' | 'LIVE' | 'FINISHED';
  tc: string;
  startsAt: string;
  duration: number;
  endsAt: string | null;
  maxPlayers: number | null;
  minRating: number | null;
  maxRating: number | null;
  playerCount: number;
  createdBy: string;
}

interface TournamentCalendarViewProps {
  tournaments: Tournament[];
  onJoinTournament?: (tournamentId: string) => void;
  currentUserId?: string;
  onCreateAtTime?: (startTime: Date) => void;
}

interface TournamentWithBounds extends Tournament {
  bounds: {
    start: Date;
    end: Date;
  };
}

type Lane = TournamentWithBounds[];

export function TournamentCalendarView({ tournaments, onCreateAtTime }: TournamentCalendarViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle mouse down for drag scrolling
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse move for drag scrolling
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (Math.abs(walk) > 5) {
      setHasDragged(true);
    }
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // Handle click on empty slot to create tournament
  const handleSlotClick = (slotDate: Date) => {
    if (hasDragged) return; // Don't trigger if user was dragging
    if (onCreateAtTime) {
      onCreateAtTime(slotDate);
    }
  };

  // Enrich tournaments with bounds
  const enrichedTournaments: TournamentWithBounds[] = tournaments.map(t => ({
    ...t,
    bounds: {
      start: new Date(t.startsAt),
      end: new Date(new Date(t.startsAt).getTime() + t.duration * 60 * 1000),
    },
  }));

  // Generate 12 hours ahead with 15-minute intervals
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();

  // Calculate total 15-minute slots (12 hours = 48 slots)
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const date = new Date(currentTime);
    date.setHours(currentHour, 0, 0, 0);
    date.setMinutes(i * 15);

    const hours = date.getHours();
    const minutes = date.getMinutes();

    return {
      date,
      displayTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      isHourMark: minutes === 0,
    };
  });

  // Check if two tournaments overlap
  const doTournamentsOverlap = (t1: TournamentWithBounds, t2: TournamentWithBounds): boolean => {
    return t1.bounds.start < t2.bounds.end && t2.bounds.start < t1.bounds.end;
  };

  // Fit tournament into lanes (avoid overlaps)
  const fitLane = (lane: TournamentWithBounds[], tournament: TournamentWithBounds): boolean => {
    return !lane.some(t => doTournamentsOverlap(t, tournament));
  };

  // Get tournaments for a specific 15-minute slot
  const getTournamentsForSlot = (slotDate: Date): TournamentWithBounds[] => {
    const slotEnd = new Date(slotDate);
    slotEnd.setMinutes(slotEnd.getMinutes() + 15);

    return enrichedTournaments.filter(t =>
      t.bounds.start < slotEnd && t.bounds.end > slotDate
    );
  };

  // Calculate current time position for the orange indicator line
  const getCurrentTimePosition = () => {
    const now = new Date();
    const startTime = timeSlots[0].date.getTime();
    const currentTimeMs = now.getTime();
    const diffMs = currentTimeMs - startTime;
    const diffMinutes = diffMs / (1000 * 60);
    const slotWidth = 120; // Width of each 15-min slot
    return (diffMinutes / 15) * slotWidth;
  };

  // Create lanes for tournaments
  const makeLanes = (slotTournaments: TournamentWithBounds[]): Lane[] => {
    const lanes: Lane[] = [];
    slotTournaments.forEach(t => {
      const lane = lanes.find(l => fitLane(l, t));
      if (lane) {
        lane.push(t);
      } else {
        lanes.push([t]);
      }
    });
    return lanes;
  };

  const formatTimeControl = (tc: string) => {
    // tc is already in the format "2+0" or "1.5+3"
    return tc;
  };

  const currentTimePos = getCurrentTimePosition();

  return (
    <div className="bg-[#1f1d1a] light:bg-white rounded-2xl overflow-hidden border border-[#474239] light:border-[#d4caba]">
      {/* Horizontal scrollable container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto overflow-y-visible relative cursor-grab active:cursor-grabbing select-none scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div className="inline-flex min-w-full relative">
          {/* Time slots */}
          {timeSlots.map((slot, index) => {
            const slotTournaments = getTournamentsForSlot(slot.date);
            const lanes = makeLanes(slotTournaments);
            const maxLanes = Math.max(lanes.length, 1);

            // Check if this is the current time slot
            const isCurrentSlot = slot.date.getHours() === currentHour && 
              Math.floor(slot.date.getMinutes() / 15) * 15 === Math.floor(currentMinute / 15) * 15;

            return (
              <div
                key={index}
                className={`w-[120px] ${slot.isHourMark ? 'border-r-2 border-[#474239] light:border-[#d4caba]' : 'border-r border-[#35322e] light:border-[#e5e1da]'} flex-shrink-0 ${
                  isCurrentSlot ? 'bg-orange-400/20 border-orange-400/50' : ''
                }`}
              >
                {/* Time header */}
                <div className="h-10 bg-[#2a2723] light:bg-[#f5f1ea] border-b border-[#474239] light:border-[#d4caba] flex items-center justify-center">
                  <span className={`${slot.isHourMark ? 'text-sm font-bold' : 'text-xs font-medium'} text-white light:text-black`}>
                    {slot.displayTime}
                  </span>
                </div>

                {/* Lanes for this slot */}
                <div className="relative" style={{ minHeight: `${maxLanes * 50}px` }}>
                  {lanes.length === 0 ? (
                    <div
                      className="h-12 hover:bg-orange-500/10 cursor-pointer transition-colors group"
                      onClick={() => handleSlotClick(slot.date)}
                    >
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-orange-400">+ Create</span>
                      </div>
                    </div>
                  ) : (
                    lanes.map((lane, laneIndex) => (
                      <div
                        key={laneIndex}
                        className="relative h-12 border-b border-[#35322e]/30 light:border-[#d4caba]/30"
                      >
                        {lane.map(tournament => {
                          return (
                            <Link
                              key={tournament.id}
                              href={`/tournaments/${tournament.id}`}
                              className="block m-1 p-1 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded transition-colors group"
                            >
                              <div className="flex items-center gap-0.5 mb-0.5">
                                <Trophy className="h-2 w-2 text-orange-400 flex-shrink-0" />
                                <span className="text-[10px] font-semibold text-white truncate group-hover:text-orange-300">
                                  {tournament.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[8px] text-[#c1b9ad] light:text-[#5a5449]">
                                <div className="flex items-center gap-0.5">
                                  <Clock className="h-1.5 w-1.5" />
                                  <span>
                                    {tournament.bounds.start.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Zap className="h-1.5 w-1.5" />
                                  <span>{formatTimeControl(tournament.tc)}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <Users className="h-1.5 w-1.5" />
                                  <span>{tournament.playerCount}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* Current time indicator - orange vertical line */}
          {currentTimePos >= 0 && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-10 pointer-events-none"
              style={{ left: `${currentTimePos}px` }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
