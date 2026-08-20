"use client";

import type { Question, LessonContent, Flashcard } from "@/lib/data";
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { sampleTopics, diagnosticQuestions, lessonContents, practiceQuestions } from '@/lib/data';
import { generateLearningPath, generateFeedback, chatWithLessonTutor } from '@/app/actions';
import { soundManager } from '@/lib/audio';
import { triggerLessonCelebrationConfetti, triggerQuickSuccessConfetti } from '@/lib/confetti';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  BookOpen, 
  Brain, 
  Trophy, 
  Home as HomeIcon, 
  XCircle, 
  Sparkles, 
  PlayCircle,
  Layers,
  RotateCw,
  Lightbulb,
  Check,
  Send,
  Bot,
  User,
  Flame,
  Star,
  Zap,
  PartyPopper,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AppState = 
  | 'onboarding' 
  | 'diagnostic' 
  | 'generating' 
  | 'home' 
  | 'lesson_note' 
  | 'lesson_video' 
  | 'lesson_flashcards' 
  | 'practice' 
  | 'feedback'
  | 'celebration';

type StudentProfile = {
  grade: string;
  subjects: string[];
  learningPath: string[]; // array of topic IDs
  currentTopicIndex: number;
  completedTopics: string[];
  xp: number;
  streak: number;
};

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

// --- Micro-Lesson Step Header Navigation ---
function MicroLessonNav({
  currentStep,
  onClose,
  topicTitle,
  unitTitle,
}: {
  currentStep: 1 | 2 | 3 | 4 | 5;
  onClose: () => void;
  topicTitle: string;
  unitTitle?: string;
}) {
  const steps = [
    { num: 1, label: "Notes", icon: BookOpen },
    { num: 2, label: "Video", icon: PlayCircle },
    { num: 3, label: "Cards", icon: Layers },
    { num: 4, label: "Quiz", icon: Brain },
    { num: 5, label: "AI Debrief", icon: Sparkles },
  ];

  return (
    <div id="microlesson-header" className="w-full bg-white rounded-2xl border border-gray-200 px-4 sm:px-6 py-3.5 shadow-xs mb-6 sticky top-4 z-30">
      <div className="flex items-center justify-between mb-3">
        <button
          id="btn-close-lesson"
          onClick={() => {
            soundManager.playClick(450);
            onClose();
          }}
          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Exit Lesson"
        >
          <XCircle className="w-6 h-6" />
        </button>
        
        <div className="text-center px-2">
          <p className="text-[11px] font-bold text-primary uppercase tracking-wider">{unitTitle || "Sequences & Series"}</p>
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 truncate max-w-[200px] sm:max-w-[360px]">{topicTitle}</h3>
        </div>

        <span className="text-xs font-bold text-primary bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Step {currentStep}/5
        </span>
      </div>

      {/* 5-Step Progress Track */}
      <div className="grid grid-cols-5 gap-2 pt-1">
        {steps.map((s) => {
          const isDone = s.num < currentStep;
          const isActive = s.num === currentStep;
          const Icon = s.icon;
          return (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`h-2 w-full rounded-full transition-all duration-300 ${
                  isDone ? "bg-green-500" : isActive ? "bg-primary" : "bg-gray-200"
                }`}
              />
              <span
                className={`text-[10px] sm:text-xs mt-1.5 font-bold flex items-center gap-1 whitespace-nowrap truncate ${
                  isActive ? "text-primary font-extrabold" : isDone ? "text-green-600" : "text-gray-400"
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.num}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Interactive 3D Flip Flashcard Component ---
function InteractiveFlashcardDeck({
  flashcards,
  currentIndex,
  onIndexChange,
}: {
  flashcards: Flashcard[];
  currentIndex: number;
  onIndexChange: (idx: number) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const currentCard = flashcards[currentIndex] || flashcards[0];
  const totalCards = flashcards.length;

  const handleFlip = () => {
    soundManager.playFlip();
    setFlipped(!flipped);
  };

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      soundManager.playPop();
      setFlipped(false);
      onIndexChange(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      soundManager.playPop();
      setFlipped(false);
      onIndexChange(currentIndex - 1);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Card {currentIndex + 1} of {totalCards}
        </span>
        <button
          id="btn-flip-hint"
          onClick={handleFlip}
          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {flipped ? "Show Question" : "Reveal Answer"}
        </button>
      </div>

      <div
        id="flashcard-flip-container"
        className="relative w-full h-72 cursor-pointer perspective-1000 select-none"
        onClick={handleFlip}
      >
        <motion.div
          className="w-full h-full preserve-3d"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
        >
          {/* Front: Question */}
          <div
            className={`absolute inset-0 backface-hidden rounded-3xl border-2 border-gray-200 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-md transition-opacity ${
              flipped ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-blue-50 text-primary px-3 py-1 rounded-full">
                Question
              </span>
              <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Tap card to flip
              </span>
            </div>
            <div className="my-auto text-center py-4">
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug">
                {currentCard.front}
              </h3>
            </div>
            <div className="text-center text-xs font-bold text-primary">
              Tap anywhere to test your knowledge
            </div>
          </div>

          {/* Back: Answer */}
          <div
            className={`absolute inset-0 backface-hidden rotate-y-180 rounded-3xl border-2 border-primary bg-gradient-to-br from-primary to-[#005bb5] text-white p-6 sm:p-8 flex flex-col justify-between shadow-xl transition-opacity ${
              !flipped ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                Correct Answer
              </span>
              <span className="text-xs text-blue-100 font-medium flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> Tap to flip back
              </span>
            </div>
            <div className="my-auto text-center py-4">
              <p className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentCard.back}
              </p>
            </div>
            <div className="text-center text-xs font-bold text-blue-200">
              Concept Mastered
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between w-full mt-6 px-1">
        <Button
          id="btn-prev-card"
          variant="outline"
          disabled={currentIndex === 0}
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="w-auto px-5 py-2.5 text-sm font-bold disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Prev Card
        </Button>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {flashcards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                soundManager.playPop();
                setFlipped(false);
                onIndexChange(idx);
              }}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                idx === currentIndex ? "w-6 bg-primary" : "w-2.5 bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label={`Go to card ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          id="btn-next-card"
          variant="outline"
          disabled={currentIndex === totalCards - 1}
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="w-auto px-5 py-2.5 text-sm font-bold disabled:opacity-30"
        >
          Next Card <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default function HuluLearnApp() {
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [profile, setProfile] = useState<StudentProfile>({
    grade: '12',
    subjects: ['Mathematics'],
    learningPath: [],
    currentTopicIndex: 0,
    completedTopics: [],
    xp: 60,
    streak: 3,
  });

  // Diagnostic State
  const [diagStep, setDiagStep] = useState(0);
  const [diagScore, setDiagScore] = useState(0);
  const [diagAnswerStatus, setDiagAnswerStatus] = useState<{ selectedOpt: string; isCorrect: boolean } | null>(null);

  // Micro-Lesson State
  const [activeTopicId, setActiveTopicId] = useState<string>('math_12_1_1');
  const [flashcardIndex, setFlashcardIndex] = useState(0);

  // Practice / Quiz State
  const [currentPracticeQ, setCurrentPracticeQ] = useState<Question | null>(null);
  const [practiceSelectedOption, setPracticeSelectedOption] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackText, setFeedbackText] = useState<string>('');

  // Celebration state
  const [celebrationTopicId, setCelebrationTopicId] = useState<string>('math_12_1_1');
  const [celebrationXPAdded, setCelebrationXPAdded] = useState(25);

  // Debrief Agentic Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (appState === 'feedback') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatLoading, appState]);

  // --- Helper to get active topic data ---
  const currentTopicId = activeTopicId || profile.learningPath[profile.currentTopicIndex] || 'math_12_1_1';
  const allTopics = sampleTopics["Mathematics"];
  const currentTopic = allTopics.find(t => t.id === currentTopicId) || allTopics[0];
  const lessonContent: LessonContent = lessonContents[currentTopicId] || {
    topicId: currentTopicId,
    title: currentTopic?.title || "Lesson",
    notes: "Explore key definitions and core sequence formulas.",
    videoPlaceholder: "Lesson Video",
    flashcards: [
      { front: "What is a sequence?", back: "An ordered list of numbers governed by a specific rule." }
    ]
  };

  const startMicroLesson = (topicId: string) => {
    soundManager.playPop();
    setActiveTopicId(topicId);
    setFlashcardIndex(0);
    setPracticeSelectedOption(null);
    setQuizChecked(false);
    setFeedbackText('');
    setChatMessages([]);
    setChatInput('');
    setIsChatLoading(false);
    setAppState('lesson_note');
  };

  // Trigger celebration when finishing a micro-lesson
  const launchCelebration = (topicId: string) => {
    setCelebrationTopicId(topicId);
    setCelebrationXPAdded(isCorrect ? 25 : 15);
    
    // Play celebratory fanfare and burst confetti
    soundManager.playCelebrationFanfare();
    triggerLessonCelebrationConfetti();

    // Mark completed in profile & grant XP
    if (!profile.completedTopics.includes(topicId)) {
      setProfile(p => ({
        ...p,
        completedTopics: [...p.completedTopics, topicId],
        currentTopicIndex: Math.min(p.currentTopicIndex + 1, p.learningPath.length),
        xp: p.xp + 25,
        streak: p.streak + 1,
      }));
    } else {
      setProfile(p => ({
        ...p,
        xp: p.xp + 10,
      }));
    }

    setAppState('celebration');
  };

  // 1. Onboarding Screen
  const renderOnboarding = () => (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sm:p-10 text-center"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 mx-auto border border-primary/20">
          <GraduationCap className="w-8 h-8 text-primary" />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">HuluLearn</h1>
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 text-primary text-xs font-extrabold mb-5 border border-blue-100">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> Ethiopian Grade 9–12 Curriculum
        </div>
        
        <p className="text-sm text-gray-600 mb-8 leading-relaxed">
          Master high school topics through 5-step micro-lessons: Notes, Video, Flashcards, Practice Quiz, and interactive AI debrief.
        </p>
        
        <div className="mb-6 text-left">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">Select Your Grade</label>
          <select 
            id="select-grade"
            className="w-full p-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 focus:border-primary font-bold text-gray-800 outline-none cursor-pointer"
            value={profile.grade}
            onChange={(e) => {
              soundManager.playPop();
              setProfile({ ...profile, grade: e.target.value });
            }}
          >
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
        </div>
        
        <Button 
          id="btn-start-diagnostic" 
          onClick={() => {
            soundManager.playPop();
            setAppState('diagnostic');
          }}
          className="w-full font-extrabold py-4"
        >
          Start Diagnostic Check <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </motion.div>
    </div>
  );

  // 2. Diagnostic Assessment
  const renderDiagnostic = () => {
    const questions = diagnosticQuestions["Mathematics"];
    const q = questions[diagStep];

    const handleAnswer = (option: string) => {
      if (diagAnswerStatus) return; // prevent multiple taps
      const isAnsCorrect = option === q.correctAnswer;
      
      if (isAnsCorrect) {
        soundManager.playCorrect();
        triggerQuickSuccessConfetti(0.5, 0.4);
        setDiagScore(s => s + 1);
      } else {
        soundManager.playWrong();
      }

      setDiagAnswerStatus({ selectedOpt: option, isCorrect: isAnsCorrect });

      setTimeout(() => {
        setDiagAnswerStatus(null);
        if (diagStep < questions.length - 1) {
          setDiagStep(s => s + 1);
        } else {
          setAppState('generating');
          generatePath(diagScore + (isAnsCorrect ? 1 : 0));
        }
      }, 550);
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="w-full max-w-xl bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden mr-4">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((diagStep + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full shrink-0">
              Question {diagStep + 1} of {questions.length}
            </span>
          </div>
          
          <span className="text-xs font-extrabold text-primary uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full mb-2 inline-block">
            Grade 12 • Diagnostic
          </span>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Knowledge Assessment</h2>
          <p className="text-xs sm:text-sm text-gray-500 mb-6">Let&apos;s see what you already know in Sequences & Series to calibrate your path.</p>
          
          <Card className="mb-6 border-gray-200 shadow-xs bg-slate-50/60">
            <CardContent className="p-5 sm:p-6">
              <p className="text-base sm:text-lg font-bold text-gray-900 leading-snug">{q.text}</p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const isSelected = diagAnswerStatus?.selectedOpt === opt;
              const isAnswerRight = diagAnswerStatus?.isCorrect;
              
              let btnClasses = "justify-start text-left font-bold py-4 transition-all duration-200 ";
              if (isSelected) {
                if (isAnswerRight) {
                  btnClasses += "border-green-500 bg-green-50 text-green-800 shadow-[0_4px_0_#10B981] scale-[1.01] ";
                } else {
                  btnClasses += "border-rose-500 bg-rose-50 text-rose-800 shadow-[0_4px_0_#EF4444] animate-shake ";
                }
              } else {
                btnClasses += "hover:border-primary hover:bg-blue-50/50 ";
              }

              return (
                <Button 
                  key={i} 
                  id={`btn-diag-opt-${i}`}
                  variant="outline" 
                  className={btnClasses}
                  onClick={() => handleAnswer(opt)}
                >
                  <span className="flex items-center justify-between w-full">
                    <span>{opt}</span>
                    {isSelected && (
                      <span>
                        {isAnswerRight ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600 animate-bounce" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                      </span>
                    )}
                  </span>
                </Button>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  };

  const generatePath = async (finalScore: number) => {
    const path = await generateLearningPath(profile.grade, profile.subjects, finalScore);
    soundManager.playStreakChime();
    setProfile(p => ({ ...p, learningPath: path, currentTopicIndex: 0 }));
    setAppState('home');
  };

  // 3. Generating Loading Screen
  const renderGenerating = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
        <Sparkles className="w-14 h-14 text-primary animate-pulse mb-4 mx-auto" />
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Analyzing your skills...</h2>
        <p className="text-gray-500 text-sm">Building your personalized Grade 12 micro-learning path</p>
      </motion.div>
    </div>
  );

  // 4. Main Home Dashboard (Optimized for Desktop & Mobile)
  const renderHome = () => {
    const activePathTopicId = profile.learningPath[profile.currentTopicIndex] || 'math_12_1_1';
    const nextTopic = allTopics.find(t => t.id === activePathTopicId);
    const progressPercent = Math.round((profile.completedTopics.length / Math.max(profile.learningPath.length, 1)) * 100);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200/80 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base font-black text-gray-900 tracking-tight leading-none">HuluLearn</h1>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Ethiopian Curriculum • Grade {profile.grade}</p>
              </div>
            </div>

            {/* Top Stats */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-xs font-black text-amber-900">{profile.streak} Days</span>
              </div>

              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="text-xs font-black text-primary">{profile.xp} XP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col">
          {/* Unit Hero Banner */}
          <div className="bg-gradient-to-br from-primary via-[#0f75d6] to-[#005bb5] text-white p-6 sm:p-8 rounded-3xl shadow-md mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-100 text-xs font-extrabold mb-2 border border-white/20">
                  <BookOpen className="w-3.5 h-3.5" /> Unit 1 • Mathematics
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">Sequences & Series</h2>
                <p className="text-sm text-blue-100 font-medium">Ethiopian national Grade 12 curriculum competencies</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl md:min-w-[280px]">
                <div className="flex justify-between text-xs mb-2 font-bold">
                  <span>Unit Progress</span>
                  <span>{progressPercent}% Complete ({profile.completedTopics.length}/{profile.learningPath.length || 3})</span>
                </div>
                <div className="h-2.5 bg-black/25 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Active Micro-Lesson Card */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500">Up Next in Micro-Lessons</h3>
                <span className="text-xs font-bold text-primary bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  Interactive 5-Step
                </span>
              </div>

              {nextTopic && profile.completedTopics.length < profile.learningPath.length ? (
                <Card id="card-active-topic" className="border-2 border-primary/30 shadow-md overflow-hidden relative bg-white">
                  <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
                  <CardContent className="p-6 sm:p-7">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-primary bg-blue-50 px-3 py-1 rounded-md border border-blue-100">
                        {nextTopic.unit}
                      </span>
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        {nextTopic.estimatedMinutes} min micro-step
                      </span>
                    </div>

                    <h4 className="text-xl sm:text-2xl font-black mb-4 text-gray-900">{nextTopic.title}</h4>
                    
                    {/* 5-step micro pill preview */}
                    <div className="grid grid-cols-5 gap-1.5 mb-6 text-xs font-bold text-gray-600 bg-slate-50 p-3 rounded-2xl border border-gray-100 text-center">
                      <div className="flex flex-col items-center py-1">
                        <BookOpen className="w-4 h-4 text-primary mb-1"/>
                        <span className="text-[11px]">Notes</span>
                      </div>
                      <div className="flex flex-col items-center py-1">
                        <PlayCircle className="w-4 h-4 text-primary mb-1"/>
                        <span className="text-[11px]">Video</span>
                      </div>
                      <div className="flex flex-col items-center py-1">
                        <Layers className="w-4 h-4 text-primary mb-1"/>
                        <span className="text-[11px]">Cards</span>
                      </div>
                      <div className="flex flex-col items-center py-1">
                        <Brain className="w-4 h-4 text-primary mb-1"/>
                        <span className="text-[11px]">Quiz</span>
                      </div>
                      <div className="flex flex-col items-center py-1">
                        <Sparkles className="w-4 h-4 text-primary mb-1"/>
                        <span className="text-[11px]">Debrief</span>
                      </div>
                    </div>

                    <Button 
                      id="btn-start-microlesson"
                      onClick={() => startMicroLesson(nextTopic.id)} 
                      className="w-full text-base font-extrabold py-4 shadow-[0_4px_0_#0070cc]"
                    >
                      Start Micro-Lesson <ChevronRight className="ml-2 w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-green-200 bg-green-50/50 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Trophy className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-xl font-extrabold text-green-900 mb-1">Unit 1 Completed!</h4>
                    <p className="text-sm text-green-700 mb-5">You have mastered all micro-lessons in Sequences and Series.</p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          launchCelebration(profile.learningPath[0] || 'math_12_1_1');
                        }}
                        className="w-auto px-5 py-2.5 text-sm font-bold"
                      >
                        <PartyPopper className="w-4 h-4 mr-1.5" /> View Celebration
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          soundManager.playPop();
                          setAppState('diagnostic');
                        }}
                        className="w-auto px-5 py-2.5 text-sm font-bold"
                      >
                        Retake Diagnostic
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Curriculum Path Overview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500">Learning Path</h3>
                <span className="text-xs text-gray-500 font-semibold">{profile.completedTopics.length} / {profile.learningPath.length || 3} Done</span>
              </div>

              <div className="space-y-3">
                {profile.learningPath.map((tId, idx) => {
                  const t = allTopics.find(topic => topic.id === tId);
                  const isCompleted = profile.completedTopics.includes(tId);
                  const isCurrent = idx === profile.currentTopicIndex;
                  
                  return (
                    <div 
                      key={tId} 
                      id={`path-item-${tId}`}
                      onClick={() => startMicroLesson(tId)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between bg-white ${
                        isCurrent 
                          ? 'border-primary bg-blue-50/30 shadow-sm scale-[1.01]' 
                          : isCompleted 
                          ? 'border-green-200' 
                          : 'border-gray-200 opacity-80 hover:opacity-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm shadow-xs ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : isCurrent 
                            ? 'bg-primary text-white' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
                        </div>
                        <div>
                          <p className={`font-bold text-sm leading-snug ${isCurrent ? 'text-gray-900 font-extrabold' : 'text-gray-700'}`}>
                            {t?.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">5 micro-steps • {t?.estimatedMinutes} min</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-gray-300'}`} />
                    </div>
                  );
                })}
              </div>

              {/* Quick Retake Diagnostic Link */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playPop();
                    setAppState('diagnostic');
                  }}
                  className="w-full p-3 rounded-2xl border border-dashed border-gray-300 text-gray-500 hover:text-primary hover:border-primary text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                >
                  <Brain className="w-4 h-4" /> Retake Diagnostic Check
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  };

  // --- 5. MICRO-LESSON STEP 1: CONCEPT NOTE ---
  const renderLessonNote = () => {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-4 sm:px-6">
        <div className="max-w-3xl w-full flex-1 flex flex-col">
          <MicroLessonNav
            currentStep={1}
            onClose={() => setAppState('home')}
            topicTitle={lessonContent.title}
            unitTitle={currentTopic?.unit}
          />

          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex-1 flex flex-col mb-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 w-fit">
              <BookOpen className="w-3.5 h-3.5" /> Step 1: Concept Note
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-5 tracking-tight">{lessonContent.title}</h2>

            {/* Core Concept Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-blue-50/40 border border-blue-100 mb-6">
              <h4 className="text-xs font-extrabold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-4 h-4" /> Core Definition & Rule
              </h4>
              <p className="text-gray-900 text-base sm:text-lg leading-relaxed font-semibold">
                {lessonContent.notes}
              </p>
            </div>

            {/* Key Takeaways */}
            {lessonContent.keyPoints && lessonContent.keyPoints.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">Key Takeaways</h4>
                <div className="space-y-2.5">
                  {lessonContent.keyPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-gray-200">
                      <div className="w-5 h-5 rounded-full bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-snug">{pt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tutor Tip */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 p-4 rounded-2xl mb-8 flex items-start gap-3 mt-auto">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider mb-1">AI Tutor Tip</h4>
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  {lessonContent.tutorTip || "Keep note of the formulas before watching the video in Step 2!"}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2">
              <Button 
                id="btn-note-next"
                onClick={() => {
                  soundManager.playPop();
                  setAppState('lesson_video');
                }}
                className="w-full text-base font-bold flex items-center justify-center py-4"
              >
                Next: Watch Video Explanation <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 6. MICRO-LESSON STEP 2: VIDEO LESSON ---
  const renderLessonVideo = () => {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-4 sm:px-6">
        <div className="max-w-3xl w-full flex-1 flex flex-col">
          <MicroLessonNav
            currentStep={2}
            onClose={() => setAppState('home')}
            topicTitle={lessonContent.title}
            unitTitle={currentTopic?.unit}
          />

          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex-1 flex flex-col mb-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 w-fit">
              <PlayCircle className="w-3.5 h-3.5" /> Step 2: Video Explanation
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
              {lessonContent.videoTitle || `${lessonContent.title} Video`}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-6">Focused visual explanation aligned with Ethiopian Grade 12 curriculum.</p>

            {/* Responsive Video Player Container */}
            <div className="max-w-2xl mx-auto w-full mb-6">
              {lessonContent.youtubeId ? (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-lg border-2 border-gray-900">
                  <iframe 
                    id="youtube-embed"
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${lessonContent.youtubeId}`} 
                    title="Micro-Lesson Video" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-900 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-lg border-2 border-gray-800">
                  <p className="text-white font-bold relative z-10 flex items-center gap-2">
                    <PlayCircle className="w-6 h-6 text-primary" /> {lessonContent.videoPlaceholder}
                  </p>
                </div>
              )}
            </div>

            {/* Video Takeaway Card */}
            <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 mb-8">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4" /> What to Focus On
              </h4>
              <p className="text-sm font-medium text-gray-700 leading-relaxed">
                {lessonContent.videoSummary || "Notice how consecutive terms are generated using the general formula a_n."}
              </p>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2 mt-auto">
              <Button 
                id="btn-video-back"
                variant="outline" 
                onClick={() => {
                  soundManager.playPop();
                  setAppState('lesson_note');
                }}
                className="w-1/3 text-sm font-bold py-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Notes
              </Button>
              <Button 
                id="btn-video-next"
                onClick={() => {
                  soundManager.playPop();
                  setFlashcardIndex(0);
                  setAppState('lesson_flashcards');
                }}
                className="w-2/3 text-base font-bold flex items-center justify-center py-4"
              >
                Next: Review Flashcards <ChevronRight className="ml-1 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 7. MICRO-LESSON STEP 3: FLASHCARDS ---
  const renderLessonFlashcards = () => {
    const cards = lessonContent.flashcards || [
      { front: "What is a finite sequence?", back: "A sequence with a last term." }
    ];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-4 sm:px-6">
        <div className="max-w-3xl w-full flex-1 flex flex-col">
          <MicroLessonNav
            currentStep={3}
            onClose={() => setAppState('home')}
            topicTitle={lessonContent.title}
            unitTitle={currentTopic?.unit}
          />

          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex-1 flex flex-col mb-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 w-fit">
              <Layers className="w-3.5 h-3.5" /> Step 3: Flashcard Review
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">Active Recall Check</h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-6">Flip the cards to test your memory on key definitions and formulas.</p>

            <div className="my-auto py-2">
              <InteractiveFlashcardDeck
                flashcards={cards}
                currentIndex={flashcardIndex}
                onIndexChange={(idx) => setFlashcardIndex(idx)}
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-6 mt-auto">
              <Button 
                id="btn-flashcard-back"
                variant="outline" 
                onClick={() => {
                  soundManager.playPop();
                  setAppState('lesson_video');
                }}
                className="w-1/3 text-sm font-bold py-4"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Video
              </Button>
              <Button 
                id="btn-flashcard-next"
                onClick={() => {
                  soundManager.playPop();
                  const pq = practiceQuestions[currentTopicId] || practiceQuestions["math_12_1_1"];
                  setCurrentPracticeQ(pq[0]);
                  setPracticeSelectedOption(null);
                  setQuizChecked(false);
                  setAppState('practice');
                }}
                className="w-2/3 text-base font-bold flex items-center justify-center py-4"
              >
                Ready for Practice Quiz <ChevronRight className="ml-1 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 8. MICRO-LESSON STEP 4: PRACTICE QUIZ ---
  const renderPractice = () => {
    if (!currentPracticeQ) return null;

    const handleOptionSelect = (opt: string) => {
      if (quizChecked) return;
      soundManager.playPop();
      setPracticeSelectedOption(opt);
    };

    const handleCheckAnswer = async () => {
      if (!practiceSelectedOption || quizChecked) return;
      
      const correct = practiceSelectedOption === currentPracticeQ.correctAnswer;
      setIsCorrect(correct);
      setQuizChecked(true);

      if (correct) {
        soundManager.playCorrect();
        triggerQuickSuccessConfetti(0.5, 0.7);
      } else {
        soundManager.playWrong();
      }

      // Pre-warm feedback
      generateFeedback(
        currentTopicId, 
        correct, 
        practiceSelectedOption, 
        currentPracticeQ.correctAnswer
      ).then(fb => setFeedbackText(fb));
    };

    const handleProceedToDebrief = () => {
      soundManager.playPop();
      
      // Initialize the Debrief Chatbot with inquiry
      const initialGreeting = isCorrect
        ? `🎉 Outstanding job getting the quiz question right! Before you complete this micro-lesson on **${lessonContent.title}**, is there anything from the notes, formulas, or examples that you didn't fully understand or want me to clarify?`
        : `💡 Good attempt! You selected **${practiceSelectedOption}**, while the correct answer was **${currentPracticeQ.correctAnswer}**. Before you complete this micro-lesson on **${lessonContent.title}**, is there anything you didn't understand about how to solve this or why the answer was ${currentPracticeQ.correctAnswer}? Ask me anything!`;

      setChatMessages([
        {
          id: 'init_tutor_greeting',
          role: 'assistant',
          content: initialGreeting,
        }
      ]);

      setAppState('feedback');
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-4 sm:px-6">
        <div className="max-w-3xl w-full flex-1 flex flex-col">
          <MicroLessonNav
            currentStep={4}
            onClose={() => setAppState('home')}
            topicTitle={lessonContent.title}
            unitTitle={currentTopic?.unit}
          />

          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex-1 flex flex-col mb-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 w-fit">
              <Brain className="w-3.5 h-3.5" /> Step 4: Knowledge Check Quiz
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">Practice Question</h2>
            <p className="text-xs sm:text-sm font-semibold text-gray-500 mb-6">Select the correct answer based on the lesson notes and general formula.</p>
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-gray-200 mb-6">
              <p className="text-lg sm:text-xl font-extrabold text-gray-900 leading-snug">{currentPracticeQ.text}</p>
            </div>

            <div className="space-y-3 mb-6">
              {currentPracticeQ.options.map((opt, i) => {
                const isSelected = practiceSelectedOption === opt;
                const isOptionCorrect = opt === currentPracticeQ.correctAnswer;
                
                let styleVariant: "primary" | "outline" = isSelected ? "primary" : "outline";
                let customStyle = `justify-start text-left font-bold border-2 py-4 cursor-pointer transition-all duration-200 `;

                if (quizChecked) {
                  if (isOptionCorrect) {
                    customStyle += "border-green-500 bg-green-50 text-green-900 shadow-[0_4px_0_#10B981] ";
                  } else if (isSelected && !isCorrect) {
                    customStyle += "border-rose-500 bg-rose-50 text-rose-900 shadow-[0_4px_0_#EF4444] animate-shake ";
                  } else {
                    customStyle += "opacity-50 border-gray-200 ";
                  }
                } else if (isSelected) {
                  customStyle += "border-primary shadow-md scale-[1.01] ";
                } else {
                  customStyle += "border-gray-200 hover:border-gray-300 ";
                }

                return (
                  <Button 
                    key={i} 
                    id={`btn-quiz-opt-${i}`}
                    variant={styleVariant}
                    className={customStyle} 
                    onClick={() => handleOptionSelect(opt)}
                    disabled={quizChecked}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{opt}</span>
                      {quizChecked && isOptionCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-green-600 animate-bounce" />
                      )}
                      {quizChecked && isSelected && !isCorrect && (
                        <XCircle className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Check Answer / Feedback Container */}
            <div className="mt-auto pt-4">
              {!quizChecked ? (
                <Button 
                  id="btn-quiz-check"
                  disabled={!practiceSelectedOption} 
                  onClick={handleCheckAnswer}
                  className={`w-full text-base font-extrabold py-4 ${!practiceSelectedOption ? 'opacity-50' : ''}`}
                >
                  Check Answer
                </Button>
              ) : (
                <motion.div 
                  initial={{ y: 15, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }} 
                  className={`p-5 rounded-2xl border-2 space-y-4 ${
                    isCorrect ? "bg-green-50/80 border-green-300" : "bg-rose-50/80 border-rose-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      isCorrect ? "bg-green-500 text-white" : "bg-rose-500 text-white"
                    }`}>
                      {isCorrect ? <Check className="w-5 h-5 stroke-[3]" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-base font-black ${isCorrect ? "text-green-800" : "text-rose-800"}`}>
                          {isCorrect ? "Nicely Done! (+10 XP)" : "Correct Answer:"}
                        </h4>
                        {isCorrect && (
                          <span className="bg-green-200 text-green-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                            +10 XP 🎉
                          </span>
                        )}
                      </div>
                      {!isCorrect && (
                        <p className="text-sm font-extrabold text-rose-900 mt-0.5">
                          {currentPracticeQ.correctAnswer}
                        </p>
                      )}
                      {currentPracticeQ.explanation && (
                        <p className={`text-xs sm:text-sm mt-1 font-medium leading-relaxed ${isCorrect ? "text-green-700" : "text-rose-700"}`}>
                          {currentPracticeQ.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    id="btn-quiz-continue"
                    onClick={handleProceedToDebrief}
                    variant={isCorrect ? "primary" : "secondary"}
                    className={`w-full text-base font-extrabold py-4 shadow-md ${
                      isCorrect 
                        ? "bg-green-600 hover:bg-green-500 shadow-[0_4px_0_#047857]" 
                        : "bg-rose-600 hover:bg-rose-500 shadow-[0_4px_0_#9F1239]"
                    }`}
                  >
                    Continue to AI Debrief <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 9. STEP 5: AGENTIC AI DEBRIEF & LESSON COMPLETION ---
  const renderFeedback = () => {
    const handleCompleteLesson = () => {
      launchCelebration(currentTopicId);
    };

    const handleSendMessage = async (textToSend?: string) => {
      const messageText = (textToSend || chatInput).trim();
      if (!messageText || isChatLoading) return;

      soundManager.playMessageBubble(true);

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: messageText,
      };

      const updatedHistory = [...chatMessages, userMsg];
      setChatMessages(updatedHistory);
      setChatInput('');
      setIsChatLoading(true);

      try {
        const aiResponse = await chatWithLessonTutor({
          messages: updatedHistory.map(m => ({ role: m.role, content: m.content })),
          topicTitle: lessonContent.title,
          lessonNotes: lessonContent.notes,
          keyPoints: lessonContent.keyPoints,
          quizQuestion: currentPracticeQ?.text,
          studentAnswer: practiceSelectedOption || undefined,
          correctAnswer: currentPracticeQ?.correctAnswer,
          isCorrect: isCorrect,
          grade: profile.grade,
        });

        soundManager.playMessageBubble(false);
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: aiResponse,
          }
        ]);
      } catch (error) {
        console.error("AI Debrief Chat error:", error);
        soundManager.playMessageBubble(false);
        setChatMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            role: 'assistant',
            content: "You've got this! Key sequence formulas like $a_n$ help you find any term directly without listing them all. Whenever you feel confident, click Complete Lesson below!",
          }
        ]);
      } finally {
        setIsChatLoading(false);
      }
    };

    // Quick suggestion prompts for one-tap questioning
    const suggestionPrompts = [
      "I understood everything! Ready to complete.",
      `Can you explain why ${currentPracticeQ?.correctAnswer || 'the answer'} is correct?`,
      "Can you summarize the main formula in simple terms?",
      "Give me another quick example to test myself."
    ];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-4 px-4 sm:px-6">
        <div className="max-w-3xl w-full flex-1 flex flex-col">
          <MicroLessonNav
            currentStep={5}
            onClose={() => setAppState('home')}
            topicTitle={lessonContent.title}
            unitTitle={currentTopic?.unit}
          />

          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs flex-1 flex flex-col mb-6">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 text-primary px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Step 5: AI Debrief & Clarification
            </div>

            {/* Quiz Result Recap Card */}
            <div className={`p-4 rounded-2xl border-2 mb-4 transition-all ${
              isCorrect ? 'bg-green-50/70 border-green-200' : 'bg-amber-50/70 border-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <h3 className={`text-sm font-extrabold ${isCorrect ? 'text-green-900' : 'text-amber-900'}`}>
                    {isCorrect ? "Quiz Passed! (+10 XP)" : "Quiz Reviewed"}
                  </h3>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isCorrect ? 'bg-green-200/60 text-green-800' : 'bg-amber-200/60 text-amber-800'
                }`}>
                  {isCorrect ? 'Mastered' : 'Needs Review'}
                </span>
              </div>

              {currentPracticeQ?.explanation && (
                <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                  <span className="font-bold text-gray-900">Explanation: </span>
                  {currentPracticeQ.explanation}
                </p>
              )}
            </div>

            {/* Interactive Chatbot Window */}
            <Card className="flex-1 flex flex-col border border-gray-200 shadow-xs bg-white rounded-2xl overflow-hidden mb-5 min-h-[380px]">
              {/* Chatbot Header */}
              <div className="p-3.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1">
                      HuluLearn AI Tutor
                      <Sparkles className="w-3 h-3 text-primary" />
                    </h4>
                    <p className="text-[10px] font-semibold text-gray-500">Debrief & Clarification Checkpoint</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-primary bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  Grade {profile.grade}
                </span>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[320px] bg-slate-50/40">
                {chatMessages.map((msg) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                    >
                      {isAssistant && (
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed max-w-[85%] shadow-2xs whitespace-pre-line ${
                          isAssistant
                            ? 'bg-white border border-gray-200/90 text-gray-800 rounded-tl-sm'
                            : 'bg-primary text-white rounded-tr-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      {!isAssistant && (
                        <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isChatLoading && (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-gray-200 text-gray-400 text-xs rounded-tl-sm shadow-2xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-150"></span>
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce delay-300"></span>
                        <span className="text-[11px] font-semibold text-gray-500 ml-1.5">AI Tutor is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Chips */}
              <div className="p-2.5 bg-white border-t border-gray-100 overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  {suggestionPrompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      id={`btn-chat-chip-${idx}`}
                      type="button"
                      disabled={isChatLoading}
                      onClick={() => {
                        soundManager.playPop();
                        handleSendMessage(promptText);
                      }}
                      className="text-[11px] font-semibold bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-primary px-3 py-1.5 rounded-full transition-colors border border-gray-200 hover:border-primary/40 disabled:opacity-40 cursor-pointer"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-gray-100 flex items-center gap-2"
              >
                <input
                  id="input-chat-query"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything you didn't understand about this topic..."
                  disabled={isChatLoading}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all disabled:opacity-50"
                />
                <Button
                  id="btn-send-chat"
                  type="submit"
                  disabled={!chatInput.trim() || isChatLoading}
                  className="w-auto px-4 py-2.5 text-xs font-bold disabled:opacity-40 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Card>

            {/* Complete Action Button */}
            <div className="pt-1">
              <Button 
                id="btn-finish-lesson"
                onClick={handleCompleteLesson} 
                variant="primary"
                className="w-full text-base font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg py-4"
              >
                <PartyPopper className="w-5 h-5 stroke-[2.5]" />
                Complete Lesson & Celebrate
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 10. CELEBRATION MODAL & SCREEN ---
  const renderCelebration = () => {
    const celebTopic = allTopics.find(t => t.id === celebrationTopicId) || allTopics[0];

    const handleReplayCelebration = () => {
      soundManager.playCelebrationFanfare();
      triggerLessonCelebrationConfetti();
    };

    const handleContinueToPath = () => {
      soundManager.playPop();
      setAppState('home');
    };

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full max-w-lg bg-white rounded-3xl border-2 border-amber-300 shadow-xl p-6 sm:p-8 text-center flex flex-col items-center relative overflow-hidden"
        >
          {/* Top Bar */}
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-xs font-black uppercase tracking-wider text-primary bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Ethiopian Grade {profile.grade}
            </span>
            <button
              onClick={handleContinueToPath}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Hero Celebration Visual */}
          <div className="relative mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-tr from-amber-400 via-yellow-300 to-yellow-100 rounded-3xl flex items-center justify-center shadow-lg mx-auto border-4 border-white">
              <Trophy className="w-12 h-12 sm:w-14 sm:h-14 text-amber-700 stroke-[2.2] animate-bounce" />
            </div>

            <div className="absolute -top-2 -right-2 bg-primary text-white p-1.5 rounded-xl shadow-md border-2 border-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="absolute -bottom-2 -left-2 bg-green-500 text-white p-1.5 rounded-xl shadow-md border-2 border-white">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">
            Lesson Mastered!
          </h2>
          
          <p className="text-sm font-bold text-primary mb-6 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
            {celebTopic?.title || "Sequences & Series"}
          </p>

          {/* Reward Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 w-full mb-6">
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-gray-900">+{celebrationXPAdded} XP</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Experience Gained</p>
            </div>

            <div className="bg-orange-50/60 p-4 rounded-2xl border border-orange-200 flex flex-col items-center">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-1">
                <Flame className="w-5 h-5 fill-orange-500 text-orange-500" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-gray-900">{profile.streak} Days</p>
              <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Learning Streak 🔥</p>
            </div>
          </div>

          {/* Mastery Certificate Pill */}
          <div className="bg-slate-50 border border-gray-200 p-4 rounded-2xl w-full text-left flex items-start gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-black text-gray-900 uppercase tracking-wider">Ethiopian Curriculum Standard</h5>
              <p className="text-xs text-gray-600 font-medium leading-relaxed mt-0.5">
                Competency in {celebTopic?.unit || "Sequences and Series"} verified through 5-step micro-learning and AI debrief.
              </p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="w-full space-y-3">
            <Button
              id="btn-continue-next"
              onClick={handleContinueToPath}
              variant="primary"
              className="w-full text-base font-extrabold py-4 shadow-lg flex items-center justify-center gap-2"
            >
              Continue Learning Path <ChevronRight className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                id="btn-replay-confetti"
                onClick={handleReplayCelebration}
                variant="outline"
                className="w-1/2 text-xs font-bold py-3 flex items-center justify-center gap-1.5"
              >
                <PartyPopper className="w-4 h-4 text-amber-500" /> Celebrate Again
              </Button>
              <Button
                id="btn-review-debrief"
                onClick={() => {
                  soundManager.playPop();
                  setAppState('feedback');
                }}
                variant="outline"
                className="w-1/2 text-xs font-bold py-3 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-primary" /> Review Debrief
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20 text-gray-900">
      <AnimatePresence mode="wait">
        {appState === 'onboarding' && <motion.div key="onboarding" exit={{ opacity: 0 }}>{renderOnboarding()}</motion.div>}
        {appState === 'diagnostic' && <motion.div key="diagnostic" exit={{ opacity: 0 }}>{renderDiagnostic()}</motion.div>}
        {appState === 'generating' && <motion.div key="generating" exit={{ opacity: 0 }}>{renderGenerating()}</motion.div>}
        {appState === 'home' && <motion.div key="home" exit={{ opacity: 0 }}>{renderHome()}</motion.div>}
        {appState === 'lesson_note' && <motion.div key="lesson_note" exit={{ opacity: 0 }}>{renderLessonNote()}</motion.div>}
        {appState === 'lesson_video' && <motion.div key="lesson_video" exit={{ opacity: 0 }}>{renderLessonVideo()}</motion.div>}
        {appState === 'lesson_flashcards' && <motion.div key="lesson_flashcards" exit={{ opacity: 0 }}>{renderLessonFlashcards()}</motion.div>}
        {appState === 'practice' && <motion.div key="practice" exit={{ opacity: 0 }}>{renderPractice()}</motion.div>}
        {appState === 'feedback' && <motion.div key="feedback" exit={{ opacity: 0 }}>{renderFeedback()}</motion.div>}
        {appState === 'celebration' && <motion.div key="celebration" exit={{ opacity: 0 }}>{renderCelebration()}</motion.div>}
      </AnimatePresence>
    </main>
  );
}
