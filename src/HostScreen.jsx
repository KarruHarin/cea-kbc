import React, { useEffect, useState, useRef } from "react";
import { ref, set, onValue, onDisconnect } from "firebase/database";
import { db } from "./firebase";
import questionsData from "./questions.json";
import { Volume2, VolumeX, Lock, Eye, ChevronRight, Play } from "lucide-react";

export default function HostScreen() {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
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
    const gameRef = ref(db, "game");

    set(gameRef, {
      host: { active: true, timestamp: Date.now() },
      gameStarted: false,
      currentQuestionIndex: 0,
      contestantAnswer: null,
      locked: false,
      showAnswer: false,
      lifelines: { fiftyFifty: true, phoneFriend: true, audiencePoll: true },
      questions: questionsData,
      timerRunning: false,
      timeLeft: questionsData[0]?.timeLimit || 30,
      activeLifeline: null,
      lifelineTimeLeft: 0,
      eliminatedOptions: []
    });

    onDisconnect(gameRef).remove();

    const gameStartedRef = ref(db, "game/gameStarted");
    onValue(gameStartedRef, snap => setGameStarted(snap.val() || false));

    const indexRef = ref(db, "game/currentQuestionIndex");
    onValue(indexRef, snap => setCurrentIndex(snap.val() || 0));

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

  useEffect(() => {
    let timer;
    if (timerRunning && timeLeft > 0 && !activeLifeline) {
      timer = setInterval(() => {
        const newTime = timeLeft - 1;
        set(ref(db, "game/timeLeft"), newTime);
        if (newTime <= 0) {
          set(ref(db, "game/timerRunning"), false);
          alert("Time Over! Game Ends");
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timeLeft, activeLifeline]);

  useEffect(() => {
    let timer;
    if (activeLifeline && lifelineTimeLeft > 0) {
      timer = setInterval(() => {
        const newTime = lifelineTimeLeft - 1;
        set(ref(db, "game/lifelineTimeLeft"), newTime);
        if (newTime <= 0) {
          set(ref(db, "game/activeLifeline"), null);
          set(ref(db, "game/timerRunning"), true);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeLifeline, lifelineTimeLeft]);

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
        console.log('playing it')
        clockAudioRef.current?.play();
        lifelineAudioRef.current?.pause();
      } else {
        console.log('muting it')
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
    if (!muted && showAnswer && contestantAnswer !== null && contestantAnswer !== questionsData[currentIndex]?.correctOption) {
      wrongAnswerAudioRef.current?.play();
    }
  }, [showAnswer, muted]);

  const startGame = () => {
    set(ref(db, "game/gameStarted"), true);
    set(ref(db, "game/timerRunning"), true);
    set(ref(db, "game/timeLeft"), questionsData[0]?.timeLimit || 30);
  };

  const selectAnswer = (i) => {
    if (!locked && timerRunning) {
      set(ref(db, "game/contestantAnswer"), i);
    }
  };

  const lockAnswer = () => {
    if (contestantAnswer !== null) {
      set(ref(db, "game/locked"), true);
      set(ref(db, "game/timerRunning"), false);
    }
  };

  const revealAnswer = () => {
    set(ref(db, "game/showAnswer"), true);
  };

  const nextQuestion = () => {
    const newIndex = currentIndex + 1;
    if (newIndex >= questionsData.length) {
      alert("All questions completed!");
      return;
    }
    set(ref(db, "game/currentQuestionIndex"), newIndex);
    set(ref(db, "game/locked"), false);
    set(ref(db, "game/showAnswer"), false);
    set(ref(db, "game/contestantAnswer"), null);
    set(ref(db, "game/timerRunning"), true);
    set(ref(db, "game/timeLeft"), questionsData[newIndex]?.timeLimit || 30);
    set(ref(db, "game/eliminatedOptions"), []);
  };

  const useLifeline = (type) => {
    if (lifelines[type] && !locked) {
      set(ref(db, `game/lifelines/${type}`), false);
      set(ref(db, "game/timerRunning"), false);
      set(ref(db, "game/activeLifeline"), type);
      
      const durations = { fiftyFifty: 10, phoneFriend: 60, audiencePoll: 90 };
      set(ref(db, "game/lifelineTimeLeft"), durations[type]);

      if (type === "fiftyFifty") {
        const correctOption = questionsData[currentIndex]?.correctOption;
        const wrongOptions = [0, 1, 2, 3].filter(i => i !== correctOption);
        const toEliminate = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
        set(ref(db, "game/eliminatedOptions"), toEliminate);
      }
    }
  };

  const skipLifelineTime = () => {
    set(ref(db, "game/activeLifeline"), null);
    set(ref(db, "game/lifelineTimeLeft"), 0);
    set(ref(db, "game/timerRunning"), true);
  };

  const currentQ = questionsData[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <audio ref={backgroundAudioRef} src="/meme-intro-combined.mp3" loop />
        <audio ref={clockAudioRef} src="/kbc-clock.mp3" loop />
        <audio ref={lifelineAudioRef} src="/kbc-lifeline.mp3" loop />
        <audio ref={lockAudioRef} src="/kbc-optionLock.mp3" />
        <audio ref={wrongAnswerAudioRef} src="/kbc-wronganswer.mp3" />
        
        <div className="absolute inset-0 bg-linear-to-br from-blue-950 via-purple-950 to-blue-950 opacity-70"></div>
        
        <button
          onClick={() => setMuted(!muted)}
          className="absolute top-6 right-6 z-50 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
        >
          {muted ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
        </button>

        <div className="text-center relative z-10">
          <div className="mb-8">
            <img src="/logo_kbce.png" className=' m-auto ' alt="" />
          </div>
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-300 via-yellow-400 to-yellow-300 mb-4" >
            Kaun Banega Civil Engineer
          </h1>
          <p className="text-2xl text-white/80 mb-12">Host Control Panel</p>
          <button
            onClick={startGame}
            className="bg-linear-to-r bg-purple-500 text-white font-bold text-2xl py-5 px-16 rounded-xl shadow-2xl transform hover:scale-110 transition-all flex items-center gap-4 mx-auto"
          >
            <Play className="w-8 h-8" />
            Start Game
          </button>
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
      <div className="w-72 bg-linear-to-b from-purple-950/90 via-blue-950/90 to-purple-950/90 border-r-4 border-orange-500/30 p-4 overflow-y-auto">
        <div className="space-y-1">
          {questionsData.map((q, idx) => {
            const isPast = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            
            return (
              <div
                key={idx}
                className={`
                  relative px-4 py-3 rounded-md border transition-all
                  ${isCurrent ? 'bg-linear-to-r from-orange-500 to-orange-400 border-orange-300 shadow-lg shadow-orange-500/50' : ''}
                  ${isPast ? 'bg-purple-900/40 border-purple-500/30 text-green-300' : ''}
                  ${!isCurrent && !isPast ? 'bg-gray-900/40 border-gray-700/30 text-gray-500' : ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <span>
                  Question
                    </span>
                    <span className={`font-bold ${isCurrent ? 'text-white' : ''}`}>
                      {idx+1}
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
        <div className="absolute inset-0 bg-linear-to-b from-blue-950 via-purple-950 to-blue-950 opacity-80"></div>
        <div className="absolute inset-0" style={{
          backgroundColor: '#361F58',
          backgroundSize: '100px 100px'
        }}></div>

        <div className="relative z-10 flex-1 flex flex-col justify-between p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">Host Control Panel</h1>
            <div className="text-white text-lg">
              Question <span className="font-bold text-orange-400">{currentIndex + 1}</span> of {questionsData.length}
            </div>
          </div>

          {/* Timer */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-2xl">
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
          <div className="mb-6">
            <div className="bg-linear-to-r bg-purple-950 rounded-xl p-8 border-2 border-[#E3C321] shadow-2xl">
              <p className="text-2xl text-white text-center font-medium leading-relaxed">
                {currentQ?.question}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {currentQ?.options?.map((opt, i) => {
              const isSelected = contestantAnswer === i;
              const isCorrect = showAnswer && i === currentQ?.correctOption;
              const isWrong = showAnswer && isSelected && !isCorrect;
              const isEliminated = eliminatedOptions.includes(i);
              
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  disabled={locked || isEliminated}
                  className={`
                    relative rounded-md p-4 transition-all border-2 text-left border-[#AAA350]
                    ${isEliminated ? 'opacity-30 cursor-not-allowed' : ''}
                    ${isSelected && !showAnswer ? 'bg-linear-to-r from-amber-500 to-amber-400 border-orange-300 shadow-lg shadow-orange-500/50' : ''}
                    ${!isSelected && !showAnswer && !isEliminated ? 'bg-linear-to-r from-blue-800 to-blue-700 border-blue-600 hover:border-blue-400' : ''}
                    ${isCorrect ? 'bg-linear-to-r from-green-600 to-green-500 border-green-400 shadow-lg shadow-green-500/50 animate-pulse' : ''}
                    ${isWrong ? 'bg-linear-to-r from-red-600 to-red-500 border-red-400' : ''}
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
                </button>
              );
            })}
          </div>

          {/* Lifelines */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => useLifeline("fiftyFifty")}
              disabled={!lifelines.fiftyFifty || locked}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                lifelines.fiftyFifty && !locked
                  ? 'bg-linear-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
                  : 'bg-gray-800/50 border-gray-700 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-xl font-bold text-white">50:50</span>
            </button>
            <button
              onClick={() => useLifeline("phoneFriend")}
              disabled={!lifelines.phoneFriend || locked}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                lifelines.phoneFriend && !locked
                  ? 'bg-linear-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
                  : 'bg-gray-800/50 border-gray-700 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl">📞</span>
            </button>
            <button
              onClick={() => useLifeline("audiencePoll")}
              disabled={!lifelines.audiencePoll || locked}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                lifelines.audiencePoll && !locked
                  ? 'bg-linear-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
                  : 'bg-gray-800/50 border-gray-700 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl">👥</span>
            </button>
               <button
              onClick={() => useLifeline("doubleDip")}
              disabled={!lifelines.audiencePoll || locked}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                lifelines.audiencePoll && !locked
                  ? 'bg-linear-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
                  : 'bg-gray-800/50 border-gray-700 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl">x2</span>
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={lockAnswer}
              disabled={locked || contestantAnswer === null}
              className={`flex items-center gap-2 py-3 px-8 rounded-full font-bold text-lg transition-all ${
                locked || contestantAnswer === null
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white shadow-lg hover:scale-105'
              }`}
            >
              <Lock className="w-5 h-5" />
              Lock Answer
            </button>
            <button
              onClick={revealAnswer}
              disabled={!locked || showAnswer}
              className={`flex items-center gap-2 py-3 px-8 rounded-full font-bold text-lg transition-all ${
                !locked || showAnswer
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:scale-105'
              }`}
            >
              <Eye className="w-5 h-5" />
              Reveal
            </button>
            <button
              onClick={nextQuestion}
              disabled={!showAnswer}
              className={`flex items-center gap-2 py-3 px-8 rounded-full font-bold text-lg transition-all ${
                !showAnswer
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg hover:scale-105'
              }`}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Skip Lifeline */}
          {activeLifeline && (
            <div className="text-center">
              <button
                onClick={skipLifelineTime}
                className="bg-yellow-500 hover:bg-yellow-400 text-purple-900 py-2 px-6 rounded-full font-bold shadow-lg transition-all"
              >
                Skip Lifeline Time
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}