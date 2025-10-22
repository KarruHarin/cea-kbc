import React, { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "./firebase";
import { Volume2, VolumeX } from "lucide-react";

export default function ContestantScreen() {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [contestantAnswer, setContestantAnswer] = useState(null);
  const [locked, setLocked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lifelines, setLifelines] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [activeLifeline, setActiveLifeline] = useState(null);
  const [lifelineTimeLeft, setLifelineTimeLeft] = useState(0);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [muted, setMuted] = useState(false);

  const backgroundAudioRef = useRef(null);
  const clockAudioRef = useRef(null);
  const lifelineAudioRef = useRef(null);
  const lockAudioRef = useRef(null);
  const wrongAnswerAudioRef = useRef(null);

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

    const timerRunningRef = ref(db, "game/timerRunning");
    onValue(timerRunningRef, snap => setTimerRunning(snap.val() || false));

    const timeLeftRef = ref(db, "game/timeLeft");
    onValue(timeLeftRef, snap => setTimeLeft(snap.val() || 0));

    const activeLifelineRef = ref(db, "game/activeLifeline");
    onValue(activeLifelineRef, snap => setActiveLifeline(snap.val()));

    const lifelineTimeRef = ref(db, "game/lifelineTimeLeft");
    onValue(lifelineTimeRef, snap => setLifelineTimeLeft(snap.val() || 0));

    const eliminatedRef = ref(db, "game/eliminatedOptions");
    onValue(eliminatedRef, snap => setEliminatedOptions(snap.val() || []));
  }, []);

  // Audio effects
  useEffect(() => {
    if (!muted) {
      if (!gameStarted) {
        backgroundAudioRef.current?.play();
        clockAudioRef.current?.pause();
        lifelineAudioRef.current?.pause();
      } else {
        backgroundAudioRef.current?.pause();
      }
    }
  }, [gameStarted, muted]);

  useEffect(() => {
    if (!muted && gameStarted) {
      if (timerRunning && !activeLifeline) {
        clockAudioRef.current?.play();
        lifelineAudioRef.current?.pause();
      } else {
        clockAudioRef.current?.pause();
      }
    }
  }, [timerRunning, activeLifeline, muted, gameStarted]);

  useEffect(() => {
    if (!muted && activeLifeline) {
      lifelineAudioRef.current?.play();
      clockAudioRef.current?.pause();
    } else {
      lifelineAudioRef.current?.pause();
    }
  }, [activeLifeline, muted]);

  useEffect(() => {
    if (!muted && locked && contestantAnswer !== null) {
      lockAudioRef.current?.play();
    }
  }, [locked, muted]);

  useEffect(() => {
    if (!muted && showAnswer && contestantAnswer !== null && contestantAnswer !== questions[currentIndex]?.correctOption) {
      wrongAnswerAudioRef.current?.play();
    }
  }, [showAnswer, muted]);

  const optionLabels = ["A", "B", "C", "D"];
  const currentQuestion = questions[currentIndex] || {};

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <audio ref={backgroundAudioRef} src="/kbc-background.mp3" loop />
        <audio ref={clockAudioRef} src="/kbc-clock.mp3" loop />
        <audio ref={lifelineAudioRef} src="/kbc-lifeline.mp3" loop />
        <audio ref={lockAudioRef} src="/kbc-optionlock.mp3" />
        <audio ref={wrongAnswerAudioRef} src="/kbc-wronganswer.mp3" />
        
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 opacity-70"></div>
        
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-6 right-6 z-50 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
        >
          {muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
        </button>

        <div className="text-center relative z-10">
          <div className="mb-8">
            <div className="w-40 h-40 mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold text-purple-900">₹</span>
              </div>
            </div>
          </div>
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 mb-4" style={{fontFamily: 'serif', textShadow: '0 0 40px rgba(251, 191, 36, 0.5)'}}>
            Kaun Banega Civil Engineer
          </h1>
          <p className="text-2xl text-white/80 mb-4">Contestant Panel</p>
          <p className="text-xl text-yellow-300 animate-pulse">Waiting for host to start the game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex relative">
      <button
        onClick={() => setMuted(!muted)}
        className="absolute top-6 right-6 z-50 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
      >
        {muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
      </button>

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
          {/* Timer */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl">
                <div className="w-28 h-28 rounded-full bg-black/90 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                    {activeLifeline ? lifelineTimeLeft : timeLeft}
                  </span>
                </div>
              </div>
              {timeLeft <= 10 && !activeLifeline && (
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></div>
              )}
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
              
              return (
                <div
                  key={i}
                  className={`
                    relative rounded-lg p-4 transition-all border-2
                    ${isEliminated ? 'opacity-30' : ''}
                    ${isSelected && !showAnswer ? 'bg-gradient-to-r from-orange-500 to-orange-400 border-orange-300 shadow-lg shadow-orange-500/50' : ''}
                    ${!isSelected && !showAnswer && !isEliminated ? 'bg-gradient-to-r from-blue-800 to-blue-700 border-blue-600' : ''}
                    ${isCorrect ? 'bg-gradient-to-r from-green-600 to-green-500 border-green-400 shadow-lg shadow-green-500/50 animate-pulse' : ''}
                    ${isWrong ? 'bg-gradient-to-r from-red-600 to-red-500 border-red-400' : ''}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg border-2
                      ${isSelected && !showAnswer ? 'bg-white text-orange-500 border-white' : ''}
                      ${isCorrect ? 'bg-white text-green-600 border-white' : ''}
                      ${isWrong ? 'bg-white text-red-600 border-white' : ''}
                      ${!isSelected && !showAnswer && !isCorrect && !isEliminated ? 'bg-transparent text-white border-white/50' : ''}
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
              lifelines.audiencePoll 
                ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg' 
                : 'bg-gray-800/50 border-gray-700 opacity-40'
            }`}>
              <span className="text-3xl">x2</span>
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
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}