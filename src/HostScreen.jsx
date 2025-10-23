import React, { useEffect, useState, useRef } from "react";
import { ref, set, onValue, onDisconnect } from "firebase/database";
import { db } from "./firebase";
import { Lock, Eye, ChevronRight, Play, Upload } from "lucide-react";

export default function HostScreen() {
  const [gameStarted, setGameStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [contestantAnswer, setContestantAnswer] = useState(null);
  const [locked, setLocked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lifelines, setLifelines] = useState({});
  const [activeLifeline, setActiveLifeline] = useState(null);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);
  const [questionsData, setQuestionsData] = useState([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [doubleGuessUsed, setDoubleGuessUsed] = useState(false);
  const [firstGuess, setFirstGuess] = useState(null);
  const [hostActive, setHostActive] = useState(false);
  const [isThisHost, setIsThisHost] = useState(false);
  const [hostId] = useState(() => 'host_' + Date.now() + '_' + Math.random());

  const fileInputRef = useRef(null);

  // Handle JSON file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== "application/json") {
      setUploadError("Please upload a valid JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        
        // Validate JSON structure
        if (!Array.isArray(json)) {
          setUploadError("JSON must be an array of questions");
          return;
        }

        const isValid = json.every(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 &&
          typeof q.correctOption === 'number' &&
          q.correctOption >= 0 &&
          q.correctOption <= 3 &&
          typeof q.points === 'number'
        );

        if (!isValid) {
          setUploadError("Invalid question format. Each question must have: question (string), options (array of 4 strings), correctOption (number 0-3), points (number), checkpoint (optional boolean)");
          return;
        }

        setQuestionsData(json);
        setQuestionsLoaded(true);
        setUploadError("");
      } catch (error) {
        setUploadError("Error parsing JSON file: " + error.message);
      }
    };

    reader.onerror = () => {
      setUploadError("Error reading file");
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    // Check if another host is already active
    const hostRef = ref(db, "game/host");
    
    const unsubscribe = onValue(hostRef, (snap) => {
      const hostData = snap.val();
      
      if (hostData) {
        // Check if this is the active host or if another host is active
        if (hostData.id === hostId) {
          setIsThisHost(true);
          setHostActive(true);
        } else {
          // Another host is active
          const timeSinceLastUpdate = Date.now() - (hostData.timestamp || 0);
          // Consider host inactive after 10 seconds of no updates
          if (timeSinceLastUpdate > 10000) {
            setHostActive(false);
            setIsThisHost(false);
          } else {
            setHostActive(true);
            setIsThisHost(false);
          }
        }
      } else {
        setHostActive(false);
        setIsThisHost(false);
      }
    });

    return () => unsubscribe();
  }, [hostId]);

  useEffect(() => {
    if (!questionsLoaded || questionsData.length === 0) return;

    // Only proceed if no other host is active
    if (hostActive && !isThisHost) {
      return;
    }

    const gameRef = ref(db, "game");
    const hostRef = ref(db, "game/host");

    // Set this instance as the active host
    set(hostRef, {
      id: hostId,
      active: true,
      timestamp: Date.now()
    });

    setIsThisHost(true);

    // Update timestamp every 5 seconds to show this host is still active
    const heartbeatInterval = setInterval(() => {
      set(ref(db, "game/host/timestamp"), Date.now());
    }, 5000);

    set(gameRef, {
      host: { id: hostId, active: true, timestamp: Date.now() },
      gameStarted: false,
      currentQuestionIndex: 0,
      contestantAnswer: null,
      locked: false,
      showAnswer: false,
      lifelines: { 
        fiftyFifty: true, 
        phoneFriend: true, 
        audiencePoll: true,
        doubleGuess: true 
      },
      questions: questionsData,
      activeLifeline: null,
      eliminatedOptions: [],
      doubleGuessUsed: false,
      firstGuess: null
    });

    // Remove host data when this component unmounts or connection is lost
    onDisconnect(hostRef).remove();

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

    const activeLifelineRef = ref(db, "game/activeLifeline");
    onValue(activeLifelineRef, snap => setActiveLifeline(snap.val()));

    const eliminatedRef = ref(db, "game/eliminatedOptions");
    onValue(eliminatedRef, snap => setEliminatedOptions(snap.val() || []));

    const doubleGuessUsedRef = ref(db, "game/doubleGuessUsed");
    onValue(doubleGuessUsedRef, snap => setDoubleGuessUsed(snap.val() || false));

    const firstGuessRef = ref(db, "game/firstGuess");
    onValue(firstGuessRef, snap => setFirstGuess(snap.val()));

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [questionsLoaded, questionsData, hostActive, isThisHost, hostId]);

  const startGame = () => {
    set(ref(db, "game/gameStarted"), true);
  };

  const selectAnswer = (i) => {
    if (!locked) {
      if (doubleGuessUsed && firstGuess !== null) {
        // Second guess
        set(ref(db, "game/contestantAnswer"), i);
      } else if (doubleGuessUsed && firstGuess === null) {
        // First guess in double guess mode
        set(ref(db, "game/firstGuess"), i);
      } else {
        // Normal answer selection
        set(ref(db, "game/contestantAnswer"), i);
      }
    }
  };

  const lockAnswer = () => {
    if (doubleGuessUsed && firstGuess !== null && contestantAnswer !== null) {
      // Both guesses made
      set(ref(db, "game/locked"), true);
      set(ref(db, "game/activeLifeline"), null);
    } else if (!doubleGuessUsed && contestantAnswer !== null) {
      // Normal lock
      set(ref(db, "game/locked"), true);
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
    set(ref(db, "game/eliminatedOptions"), []);
    set(ref(db, "game/doubleGuessUsed"), false);
    set(ref(db, "game/firstGuess"), null);
    set(ref(db, "game/activeLifeline"), null);
  };

  const useLifeline = (type) => {
    if (lifelines[type] && !locked) {
      set(ref(db, `game/lifelines/${type}`), false);
      set(ref(db, "game/activeLifeline"), type);

      if (type === "fiftyFifty") {
        const correctOption = questionsData[currentIndex]?.correctOption;
        const wrongOptions = [0, 1, 2, 3].filter(i => i !== correctOption);
        const toEliminate = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
        set(ref(db, "game/eliminatedOptions"), toEliminate);
      } else if (type === "doubleGuess") {
        set(ref(db, "game/doubleGuessUsed"), true);
      }
    }
  };

  const endLifeline = () => {
    set(ref(db, "game/activeLifeline"), null);
  };

  const currentQ = questionsData[currentIndex];
  const optionLabels = ["A", "B", "C", "D"];

  // Show blocked message if another host is active
  if (questionsLoaded && hostActive && !isThisHost) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-purple-950 to-red-950 opacity-70"></div>
        
        <div className="text-center relative z-10 max-w-2xl">
          <div className="mb-8">
            <div className="w-40 h-40 mx-auto bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center">
                <span className="text-5xl font-bold text-white">🚫</span>
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-red-300 mb-4" style={{fontFamily: 'serif', textShadow: '0 0 40px rgba(239, 68, 68, 0.5)'}}>
            Host Already Active
          </h1>
          <p className="text-2xl text-white/80 mb-4">Another host is currently controlling the game</p>
          <p className="text-lg text-red-300 mb-8">Only one host can be active at a time</p>
          <div className="bg-gradient-to-r from-red-900/80 to-purple-900/80 rounded-xl p-6 border-2 border-red-500/30 shadow-2xl">
            <p className="text-white/90 text-lg">
              Please wait for the current host to disconnect before joining as a host.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Upload screen - before questions are loaded
  if (!questionsLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-purple-950 to-blue-950 opacity-70"></div>
        
        <div className="text-center relative z-10 max-w-2xl">
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
          <p className="text-2xl text-white/80 mb-12">Host Control Panel</p>
          
          <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 rounded-xl p-8 border-2 border-blue-500/30 shadow-2xl mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Upload Questions JSON</h2>
            <p className="text-white/70 mb-6">Upload a JSON file with your questions to begin</p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-bold text-xl py-4 px-12 rounded-full shadow-2xl transform hover:scale-105 transition-all flex items-center gap-3 mx-auto"
            >
              <Upload className="w-6 h-6" />
              Choose JSON File
            </button>
            
            {uploadError && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                <p className="text-red-300">{uploadError}</p>
              </div>
            )}
            
            <div className="mt-6 text-left bg-black/30 rounded-lg p-4">
              <p className="text-white/60 text-sm mb-2">Expected JSON format:</p>
              <pre className="text-xs text-green-300 overflow-x-auto">
{`[
  {
    "question": "What is the capital of India?",
    "options": ["Mumbai", "Delhi", "Kolkata", "Chennai"],
    "correctOption": 1,
    "points": 5000,
    "checkpoint": false
  }
]`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pre-game start screen
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
          <p className="text-2xl text-white/80 mb-4">Host Control Panel</p>
          <p className="text-lg text-green-300 mb-12">{questionsData.length} questions loaded ✓</p>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-bold text-2xl py-5 px-16 rounded-full shadow-2xl transform hover:scale-110 transition-all flex items-center gap-4 mx-auto"
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
      {/* Prize Ladder */}
      <div className="w-72 bg-gradient-to-b from-purple-950/90 via-blue-950/90 to-purple-950/90 border-r-4 border-orange-500/30 p-4 overflow-y-auto">
        <div className="space-y-1">
          {questionsData.map((q, idx) => {
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
                      ₹ {q.points.toLocaleString()}
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
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-yellow-400 mb-2">Host Control Panel</h1>
            <div className="text-white text-lg">
              Question <span className="font-bold text-orange-400">{currentIndex + 1}</span> of {questionsData.length} • ₹ {currentQ?.points?.toLocaleString()}
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 rounded-xl p-8 border-2 border-blue-500/30 shadow-2xl">
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
              const isFirstGuess = doubleGuessUsed && firstGuess === i;
              const isFirstGuessWrong = doubleGuessUsed && showAnswer && firstGuess === i && firstGuess !== currentQ?.correctOption;
              
              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  disabled={locked || isEliminated}
                  className={`
                    relative rounded-lg p-4 transition-all border-2 text-left
                    ${isEliminated ? 'opacity-30 cursor-not-allowed' : ''}
                    ${isSelected && !showAnswer ? 'bg-gradient-to-r from-orange-500 to-orange-400 border-orange-300 shadow-lg shadow-orange-500/50' : ''}
                    ${!isSelected && !showAnswer && !isEliminated && !isFirstGuess ? 'bg-gradient-to-r from-blue-800 to-blue-700 border-blue-600 hover:border-blue-400' : ''}
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
                  ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
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
                  ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
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
                  ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
                  : 'bg-gray-800/50 border-gray-700 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl">👥</span>
            </button>
            <button
              onClick={() => useLifeline("doubleGuess")}
              disabled={!lifelines.doubleGuess || locked}
              className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${
                lifelines.doubleGuess && !locked
                  ? 'bg-gradient-to-br from-orange-500 to-orange-400 border-orange-300 shadow-lg hover:scale-110'
                  : 'bg-gray-800/50 border-gray-700 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl font-bold text-white">2X</span>
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-4 mb-4">
            <button
              onClick={lockAnswer}
              disabled={locked || (doubleGuessUsed ? (firstGuess === null || contestantAnswer === null) : contestantAnswer === null)}
              className={`flex items-center gap-2 py-3 px-8 rounded-full font-bold text-lg transition-all ${
                locked || (doubleGuessUsed ? (firstGuess === null || contestantAnswer === null) : contestantAnswer === null)
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white shadow-lg hover:scale-105'
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
                  : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg hover:scale-105'
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
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg hover:scale-105'
              }`}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Active Lifeline Status */}
          {activeLifeline && (
            <div className="text-center">
              <div className="bg-yellow-500 text-purple-900 rounded-lg p-4 inline-block shadow-lg mb-3">
                <p className="text-xl font-bold">
                  {activeLifeline === "fiftyFifty" && "50:50 Active"}
                  {activeLifeline === "phoneFriend" && "Phone a Friend"}
                  {activeLifeline === "audiencePoll" && "Audience Poll"}
                  {activeLifeline === "doubleGuess" && "Double Guess Active - Select 2 Answers"}
                </p>
              </div>
              {activeLifeline !== "fiftyFifty" && (
                <button
                  onClick={endLifeline}
                  className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-6 rounded-full font-bold shadow-lg transition-all"
                >
                  End Lifeline
                </button>
              )}
            </div>
          )}

          {/* Double Guess Status */}
          {doubleGuessUsed && !locked && (
            <div className="text-center mt-2">
              <div className="bg-blue-900/80 text-white rounded-lg p-3 inline-block">
                <p className="text-sm">
                  {firstGuess === null ? "Select first answer" : `First guess: ${optionLabels[firstGuess]} - Select second answer`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}