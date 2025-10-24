import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";
import { AlertCircle } from "lucide-react";

export default function ContestantScreen() {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [contestantAnswer, setContestantAnswer] = useState(null);
  const [locked, setLocked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lifelines, setLifelines] = useState({});
  const [activeLifeline, setActiveLifeline] = useState(null);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [doubleGuessUsed, setDoubleGuessUsed] = useState(false);
  const [firstGuess, setFirstGuess] = useState(null);
  const [hostActive, setHostActive] = useState(false);
  const [gameExists, setGameExists] = useState(true);
  const [optionsRevealed, setOptionsRevealed] = useState(false);

  useEffect(() => {
    const gameRef = ref(db, "game");
    const unsubscribeGame = onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGameExists(true);
        const gameData = snapshot.val();
        if (gameData.host && gameData.host.active) {
          const timeDiff = Date.now() - (gameData.host.timestamp || 0);
          setHostActive(timeDiff < 15000);
        } else {
          setHostActive(false);
        }
      } else {
        setGameExists(false);
        setHostActive(false);
      }
    });

    const unsubscribeStarted = onValue(ref(db, "game/gameStarted"), snap => {
      if (snap.exists()) setGameStarted(snap.val() || false);
    });

    const unsubscribeIndex = onValue(ref(db, "game/currentQuestionIndex"), snap => {
      if (snap.exists()) setCurrentIndex(snap.val() || 0);
    });

    const unsubscribeQuestions = onValue(ref(db, "game/questions"), snap => {
      if (snap.exists()) setQuestions(snap.val() || []);
    });

    const unsubscribeAnswer = onValue(ref(db, "game/contestantAnswer"), snap => {
      if (snap.exists()) setContestantAnswer(snap.val());
      else setContestantAnswer(null);
    });

    const unsubscribeLocked = onValue(ref(db, "game/locked"), snap => {
      if (snap.exists()) setLocked(snap.val());
    });

    const unsubscribeShow = onValue(ref(db, "game/showAnswer"), snap => {
      if (snap.exists()) setShowAnswer(snap.val());
    });

    const unsubscribeLifeline = onValue(ref(db, "game/lifelines"), snap => {
      if (snap.exists()) setLifelines(snap.val() || {});
    });

    const unsubscribeActiveLifeline = onValue(ref(db, "game/activeLifeline"), snap => {
      if (snap.exists()) setActiveLifeline(snap.val());
      else setActiveLifeline(null);
    });

    const unsubscribeEliminated = onValue(ref(db, "game/eliminatedOptions"), snap => {
      if (snap.exists()) setEliminatedOptions(snap.val() || []);
      else setEliminatedOptions([]);
    });

    const unsubscribeDoubleGuess = onValue(ref(db, "game/doubleGuessUsed"), snap => {
      if (snap.exists()) setDoubleGuessUsed(snap.val() || false);
    });

    const unsubscribeFirstGuess = onValue(ref(db, "game/firstGuess"), snap => {
      if (snap.exists()) setFirstGuess(snap.val());
      else setFirstGuess(null);
    });

    const unsubscribeOptionsRevealed = onValue(ref(db, "game/optionsRevealed"), snap => {
      if (snap.exists()) setOptionsRevealed(snap.val() || false);
      else setOptionsRevealed(false);
    });

    return () => {
      unsubscribeGame();
      unsubscribeStarted();
      unsubscribeIndex();
      unsubscribeQuestions();
      unsubscribeAnswer();
      unsubscribeLocked();
      unsubscribeShow();
      unsubscribeLifeline();
      unsubscribeActiveLifeline();
      unsubscribeEliminated();
      unsubscribeDoubleGuess();
      unsubscribeFirstGuess();
      unsubscribeOptionsRevealed();
    };
  }, []);

  const optionLabels = ["A", "B", "C", "D"];
  const currentQuestion = questions[currentIndex] || {};

  if (!gameExists || !hostActive) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-purple-950 to-red-950 opacity-70"></div>
        <div className="text-center relative z-10 max-w-2xl">
          <div className="mb-8">
            <AlertCircle className="w-24 h-24 text-red-500 mx-auto animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-red-400 mb-4">Game Session Ended</h1>
          <p className="text-xl text-white/80 mb-8">
            {!gameExists ? "The host has ended the game session." : "The host has disconnected from the game."}
          </p>
          <p className="text-lg text-white/60">Please wait for the host to start a new game session.</p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 opacity-70"></div>
        <div className="text-center relative z-10">
          <div className="mb-8">
            <div className="w-40 h-40 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold text-purple-900">👷‍♂️</span>
              </div>
            </div>
          </div>
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 mb-4" style={{fontFamily: 'serif', textShadow: '0 0 40px rgba(251, 191, 36, 0.5)'}}>
            Kaun Banega Civil Engineer
            Kaun Banega civil Engineer
          </h1>
          <p className="text-2xl text-white/80 mb-4">Contestant Panel</p>
          <p className="text-xl text-yellow-300 animate-pulse">Waiting for host to start the game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex relative">
  <div className="w-72 min-h-screen bg-gradient-to-b from-purple-950/90 via-blue-950/90 to-purple-950/90 border-r-4 border-orange-500/30 p-4 flex flex-col">
  <div className="flex-1 flex flex-col justify-between overflow-y-auto">
    {questions.slice().reverse().map((q, revIdx) => {
      const idx = questions.length - 1 - revIdx;
      const isPast = idx < currentIndex;
      const isCurrent = idx === currentIndex;

      return (
        <div
          key={idx}
          className={`
            relative px-4 py-3 rounded-lg border transition-all
            ${isCurrent ? 'bg-gradient-to-r from-orange-500 to-orange-400 border-orange-300 shadow-lg shadow-orange-500/50' : ''}
            ${isPast ? 'bg-purple-900/40 border-purple-500/30 text-green-300' : ''}
            ${!isCurrent && !isPast ? 'bg-gray-900/40 border-gray-700/30 text-gray-500' : ''}
          `}
        >
          <div className="flex items-center justify-center">
            <span className={`font-bold text-lg ${isCurrent ? 'text-white' : ''}`}>
              Question {idx + 1}
            </span>
            {q.checkpoint && (
              <span className={`ml-2 text-xs font-bold ${isCurrent ? 'text-white' : 'text-yellow-500'}`}>
                ★
              </span>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>



      <div className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-purple-950 to-blue-950 opacity-80"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
          backgroundSize: '100px 100px'
        }}></div>

        <div className="relative z-10 flex-1 flex flex-col justify-between p-8 max-w-6xl mx-auto w-full">
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3 rounded-full shadow-lg">
              <p className="text-white font-bold text-xl">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-xl p-8 border-2 border-blue-500/30 shadow-2xl">
              <p className="text-2xl text-white text-center font-medium leading-relaxed">
                {currentQuestion?.question}
              </p>
            </div>
          </div>

          {optionsRevealed ? (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {currentQuestion?.options?.map((opt, i) => {
                const isSelected = contestantAnswer === i;
                const isCorrect = showAnswer && i === currentQuestion?.correctOption;
                const isWrong = showAnswer && isSelected && !isCorrect;
                const isEliminated = eliminatedOptions.includes(i);
                const isFirstGuess = doubleGuessUsed && firstGuess === i;
                const isFirstGuessWrong = doubleGuessUsed && showAnswer && firstGuess === i && firstGuess !== currentQuestion?.correctOption;
                
                return (
                  <div
                    key={i}
                    className={`
                      relative rounded-lg p-4 transition-all border-2
                      ${isEliminated ? 'opacity-30' : ''}
                      ${isSelected && !showAnswer ? 'bg-gradient-to-r from-orange-500 to-orange-400 border-orange-300 shadow-lg shadow-orange-500/50' : ''}
                      ${!isSelected && !showAnswer && !isEliminated && !isFirstGuess ? 'bg-gradient-to-r from-blue-800 to-blue-700 border-blue-600' : ''}
                      ${isCorrect ? 'bg-gradient-to-r from-green-600 to-green-500 border-green-400 shadow-lg shadow-green-500/50 animate-pulse' : ''}
                      ${isWrong ? 'bg-gradient-to-r from-red-600 to-red-500 border-red-400' : ''}
                      ${isFirstGuess && !showAnswer ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 border-yellow-400' : ''}
                      ${isFirstGuessWrong ? 'bg-gradient-to-r from-orange-700 to-orange-600 border-orange-500' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2
                        ${isSelected && !showAnswer ? 'bg-white text-orange-500 border-white' : ''}
                        ${isCorrect ? 'bg-white text-green-600 border-white' : ''}
                        ${isWrong ? 'bg-white text-red-600 border-white' : ''}
                        ${isFirstGuess && !showAnswer ? 'bg-white text-yellow-600 border-white' : ''}
                        ${isFirstGuessWrong ? 'bg-white text-orange-600 border-white' : ''}
                        ${!isSelected && !showAnswer && !isCorrect && !isEliminated && !isFirstGuess ? 'bg-transparent text-white border-white/50' : ''}
                      `}>
                        {optionLabels[i]}
                      </div>
                      <span className="text-white font-medium text-lg">{opt}</span>
                    </div>
                    {isEliminated && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-1 bg-red-600"></div>
                      </div>
                    )}
                    {isFirstGuess && !showAnswer && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-purple-900 rounded-full px-2 py-1 text-xs font-bold">
                        1st
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-8 flex items-center justify-center">
              <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-12 border-2 border-blue-500/30">
                <p className="text-2xl text-white/60 text-center">Waiting for options to be revealed...</p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
              lifelines.fiftyFifty 
                ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg' 
                : 'bg-gray-800/50 border-gray-700 opacity-40'
            }`}>
              <span className="text-2xl font-bold text-white">50:50</span>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
              lifelines.phoneFriend 
                ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg' 
                : 'bg-gray-800/50 border-gray-700 opacity-40'
            }`}>
              <span className="text-3xl">📞</span>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
              lifelines.audiencePoll 
                ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg' 
                : 'bg-gray-800/50 border-gray-700 opacity-40'
            }`}>
              <span className="text-3xl">👥</span>
            </div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
              lifelines.doubleGuess 
                ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg' 
                : 'bg-gray-800/50 border-gray-700 opacity-40'
            }`}>
              <span className="text-2xl font-bold text-white">2X</span>
            </div>
          </div>

          {locked && !showAnswer && (
            <div className="mt-6 text-center">
              <div className="bg-orange-500 text-white rounded-lg p-4 inline-block shadow-lg animate-pulse">
                <p className="text-xl font-bold">Answer Locked!</p>
              </div>
            </div>
          )}

          {activeLifeline && (
            <div className="mt-6 text-center">
              <div className="bg-yellow-500 text-purple-900 rounded-lg p-4 inline-block shadow-lg">
                <p className="text-xl font-bold">
                  {activeLifeline === "fiftyFifty" && "50:50 Active"}
                  {activeLifeline === "phoneFriend" && "Phone a Friend"}
                  {activeLifeline === "audiencePoll" && "Audience Poll"}
                  {activeLifeline === "doubleGuess" && "Double Guess Active"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}