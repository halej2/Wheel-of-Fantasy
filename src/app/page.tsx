"use client"

import Image from "next/image"
import Wheel from "../components/Wheel"
import PlayerPicker from "../components/PlayerPicker"
import teams from "../data/teams.json"
import players from "../data/players.json"
import { useState } from "react"

// Define NFLTeam type (can be moved to a types file if preferred)
type NFLTeam = 
  | "Arizona Cardinals"
  | "Atlanta Falcons"
  | "Baltimore Ravens"
  | "Buffalo Bills"
  | "Carolina Panthers"
  | "Chicago Bears"
  | "Cincinnati Bengals"
  | "Cleveland Browns"
  | "Dallas Cowboys"
  | "Denver Broncos"
  | "Detroit Lions"
  | "Green Bay Packers"
  | "Houston Texans"
  | "Indianapolis Colts"
  | "Jacksonville Jaguars"
  | "Kansas City Chiefs"
  | "Las Vegas Raiders"
  | "Los Angeles Chargers"
  | "Los Angeles Rams"
  | "Miami Dolphins"
  | "Minnesota Vikings"
  | "New England Patriots"
  | "New Orleans Saints"
  | "New York Giants"
  | "New York Jets"
  | "Philadelphia Eagles"
  | "Pittsburgh Steelers"
  | "San Francisco 49ers"
  | "Seattle Seahawks"
  | "Tampa Bay Buccaneers"
  | "Tennessee Titans"
  | "Washington Commanders";

export default function Home() {
  const [selectedTeam, setSelectedTeam] = useState<NFLTeam | null>(null);
  const [pickedPlayers, setPickedPlayers] = useState<string[]>([]);

  const handlePickPlayer = (player: string) => {
    setPickedPlayers([...pickedPlayers, player]);
    setSelectedTeam(null); // Reset to show "Choose a Team" button
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Original Next.js Starter Content */}
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>

        {/* --- Fantasy Draft UI --- */}
        <div className="w-full flex flex-col items-center gap-8 mt-8">
          <h1 className="text-3xl font-bold">Fantasy Wheel Draft!</h1>

          <Wheel teams={teams as NFLTeam[]} onSelectTeam={setSelectedTeam} selectedTeam={selectedTeam} />
          {selectedTeam && (
            <PlayerPicker
              team={selectedTeam}
              players={players}
              onPickPlayer={handlePickPlayer}
            />
          )}

          <div className="mt-6 w-full max-w-md">
            <h2 className="text-xl font-bold">Picked Players:</h2>
            <ul className="list-disc list-inside">
              {pickedPlayers.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </main>

      {/* Footer stays unchanged */}
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

