'use client';

import React, { useState } from "react";

type NFLTeam =
  | "Arizona Cardinals" | "Atlanta Falcons" | "Baltimore Ravens" | "Buffalo Bills"
  | "Carolina Panthers" | "Chicago Bears" | "Cincinnati Bengals" | "Cleveland Browns"
  | "Dallas Cowboys" | "Denver Broncos" | "Detroit Lions" | "Green Bay Packers"
  | "Houston Texans" | "Indianapolis Colts" | "Jacksonville Jaguars" | "Kansas City Chiefs"
  | "Las Vegas Raiders" | "Los Angeles Chargers" | "Los Angeles Rams" | "Miami Dolphins"
  | "Minnesota Vikings" | "New England Patriots" | "New Orleans Saints" | "New York Giants"
  | "New York Jets" | "Philadelphia Eagles" | "Pittsburgh Steelers" | "San Francisco 49ers"
  | "Seattle Seahawks" | "Tampa Bay Buccaneers" | "Tennessee Titans" | "Washington Commanders";

const teamColors: Record<NFLTeam, string> = {
  "Arizona Cardinals": "#97233F", "Atlanta Falcons": "#A6192E", "Baltimore Ravens": "#241773",
  "Buffalo Bills": "#00338D", "Carolina Panthers": "#0076B6", "Chicago Bears": "#0B162A",
  "Cincinnati Bengals": "#000000", "Cleveland Browns": "#311D00", "Dallas Cowboys": "#003594",
  "Denver Broncos": "#002244", "Detroit Lions": "#0076B6", "Green Bay Packers": "#203731",
  "Houston Texans": "#03202F", "Indianapolis Colts": "#002C5F", "Jacksonville Jaguars": "#101820",
  "Kansas City Chiefs": "#E31837", "Las Vegas Raiders": "#A5ACAF", "Los Angeles Chargers": "#003087",
  "Los Angeles Rams": "#002244", "Miami Dolphins": "#008E97", "Minnesota Vikings": "#4F2A1D",
  "New England Patriots": "#0C2340", "New Orleans Saints": "#9F8958", "New York Giants": "#0B2265",
  "New York Jets": "#125C77", "Philadelphia Eagles": "#004C54", "Pittsburgh Steelers": "#FFB612",
  "San Francisco 49ers": "#AA0000", "Seattle Seahawks": "#002244", "Tampa Bay Buccaneers": "#D11A2A",
  "Tennessee Titans": "#0C2340", "Washington Commanders": "#773141"
};

interface WheelProps {
  teams: NFLTeam[];
  onSelectTeam: (team: NFLTeam) => void;
  selectedTeam: NFLTeam | null;
}

export default function Wheel({ teams, onSelectTeam, selectedTeam }: WheelProps) {
  const [spinning, setSpinning] = useState(false);

  const byeWeekTeams: NFLTeam[] = [
    "Cincinnati Bengals", "Dallas Cowboys", "Tennessee Titans",
    "Kansas City Chiefs"
  ];

  const chooseTeam = () => {
    if (spinning) return;
    setSpinning(true);

    const activeTeams = teams.filter(team => !byeWeekTeams.includes(team));
    if (activeTeams.length === 0) {
      alert("No teams available this week!");
      setSpinning(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * activeTeams.length);
    const chosenTeam = activeTeams[randomIndex];

    setTimeout(() => {
      setSpinning(false);
      onSelectTeam(chosenTeam);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {selectedTeam === null ? (
        <button
          onClick={chooseTeam}
          disabled={spinning}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-500 mt-4 hover:bg-blue-700 transition-colors"
        >
          Choose a Team
        </button>
      ) : (
        <>
          {/* ✅ FIXED: Perfect font size + no overflow */}
          <div className="relative w-80 h-80">
            <div className="absolute w-80 h-80 rounded-full border-4 border-gray-700 flex items-center justify-center overflow-hidden">
              <div
                className="absolute w-full h-full"
                style={{ backgroundColor: teamColors[selectedTeam] }}
              />
              <div
                className="absolute text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white text-center px-4 leading-tight"
                style={{ 
                  left: "50%", 
                  top: "50%", 
                  transform: "translate(-50%, -50%)",
                  width: "90%",
                  maxWidth: "240px",
                  lineHeight: "1.2"
                }}
              >
                {selectedTeam}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-300 text-center max-w-xs">
            <p className="font-semibold mb-1">Bye Week Teams:</p>
            <p>{byeWeekTeams.join(", ")}</p>
          </div>
        </>
      )}
    </div>
  );
}






