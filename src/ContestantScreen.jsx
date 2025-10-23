import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";

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

  useEffect(() => {
    const gameStartedRef = ref(db, "game/gameStarted");
    onValue(gameStartedRef, snap => setGameStarted(snap.val() || false));

    const indexRef = ref(db, "game/currentQuestionIndex");
    onValue(indexRef, snap => setCurrentIndex(snap.val() || 0));

    const questionsRef = ref(db, "game/questions");
    onValue(questionsRef, snap => setQuestions(snap.val() || []));

    const answerRef = ref(db, "game/contestantAnswer");
    onValue(answerRef, snap => setContestantAnswer(snap.val()));

    const lockedRef = ref(db, "game/locked");
    onValue(lockedRef, snap => setLocked(snap.val()));

    const showRef = ref(db, "game/showAnswer");
    onValue(showRef, snap => setShowAnswer(snap.val()));

    const lifelineRef = ref(db, "game/lifelines");
    onValue(lifelineRef, snap => setLifelines(snap.val() || {}));

    const activeLifelineRef = ref(db, "game/activeLifeline");
    onValue(activeLifelineRef, snap => setActiveLifeline(snap.val()));

    const eliminatedRef = ref(db, "game/eliminatedOptions");
    onValue(eliminatedRef, snap => setEliminatedOptions(snap.val() || []));

    const doubleGuessUsedRef = ref(db, "game/doubleGuessUsed");
    onValue(doubleGuessUsedRef, snap => setDoubleGuessUsed(snap.val() || false));

    const firstGuessRef = ref(db, "game/firstGuess");
    onValue(firstGuessRef, snap => setFirstGuess(snap.val()));
  }, []);

  const optionLabels = ["A", "B", "C", "D"];
  const currentQuestion = questions[currentIndex] || {};

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 opacity-70"></div>

        <div className="text-center relative z-10">
          <div className="mb-8">
            <div className="w-40 h-40 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold text-purple-900">₹</span>
              </div>
            </div>
          </div>
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 mb-4" style={{fontFamily: 'serif', textShadow: '0 0 40px rgba(251, 191, 36, 0.5)'}}>
            Kaun Banega Crorepati
          </h1>
          <p className="text-2xl text-white/80 mb-4">Contestant Panel</p>
          <p className="text-xl text-yellow-300 animate-pulse">Waiting for host to start the game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex relative">
      {/* Prize Ladder */}
      <div className="w-72 bg-gradient-to-b from-purple-950/90 via-blue-950/90 to-purple-950/90 border-r-4 border-orange-500/30 p-4 overflow-y-auto">
        <div className="space-y-1">
          {questions.map((q, idx) => {
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isCurrent ? 'text-white' : ''}`}>
                      {idx + 1}
                    </span>
                    <span className={`font-bold ${isCurrent ? 'text-white' : ''}`}>
                      ₹ {q.points?.toLocaleString()}
                    </span>
                  </div>
                  {q.checkpoint && (
                    <span className={`text-xs font-bold ${isCurrent ? 'text-white' : 'text-yellow-500'}`}>
                      ★
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950 via-purple-950 to-blue-950 opacity-80"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
          backgroundSize: '100px 100px'
        }}></div>

        <div className="relative z-10 flex-1 flex flex-col justify-between p-8 max-w-6xl mx-auto w-full">
          {/* Question Number Display */}
          <div className="text-center mb-6">
            <div className="inline-block bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3 rounded-full shadow-lg">
              <p className="text-white font-bold text-xl">
                Question {currentIndex + 1} of {questions.length}
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-xl p-8 border-2 border-blue-500/30 shadow-2xl">
              <p className="text-2xl text-white text-center font-medium leading-relaxed">
                {currentQuestion?.question}
              </p>
            </div>
          </div>

          {/* Options */}
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

          {/* Lifelines */}
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