import React, { useState } from "react";
import { ref, set, get, child } from "firebase/database";
import { db } from "./firebase";

export default function Lobby({ setRole }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const joinAsHost = () => setShowPassword(true);

  const confirmHost = async () => {
    if (password === "123456") {
      await set(ref(db, "game/host"), { active: true });
      setRole("host"); // **This now navigates to HostScreen**
    } else {
      alert("Wrong password!");
    }
  };

  const joinAsContestant = async () => {
    const snapshot = await get(child(ref(db), "game/host"));
    if (snapshot.exists() && snapshot.val().active) {
      setRole("contestant"); // **This now navigates to ContestantScreen**
    } else {
      alert("No host available. Please wait!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col items-center justify-center text-white p-4">
      <div className="bg-blue-800 p-10 rounded-3xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-yellow-400 mb-6">KBC Game Lobby</h1>

        {!showPassword ? (
          <div className="flex flex-col space-y-4">
            <button
              onClick={joinAsHost}
              className="bg-red-600 hover:bg-red-500 py-3 px-6 rounded-xl font-bold text-white transition duration-200"
            >
              Host
            </button>
            <button
              onClick={joinAsContestant}
              className="bg-yellow-400 hover:bg-yellow-300 py-3 px-6 rounded-xl font-bold text-black transition duration-200"
            >
              Contestant
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <input
              type="password"
              placeholder="Enter host password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-3 rounded-xl text-black font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              onClick={confirmHost}
              className="bg-green-500 hover:bg-green-400 py-3 px-6 rounded-xl font-bold text-white transition duration-200"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
