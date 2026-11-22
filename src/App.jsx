import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import HomeScreen from './components/HomeScreen.jsx';
import QuizScreen from './components/QuizScreen.jsx';
import Footer from './components/Footer.jsx';
import { QUESTIONS } from './data/questions.js';
import { validateAnswers } from './utils/matchingAlgorithm.js';
import { clearProgress, loadProgress, saveProgress } from './utils/storage.js';
import { usePrefersReducedMotion } from './utils/theme.js';

// Recharts is only needed on the results screen, so it is loaded on demand.
const ResultsScreen = lazy(() => import('./components/ResultsScreen.jsx'));

const CALCULATING_MS = 1400;

function Loader({ label }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <div className="loader__ball" aria-hidden="true" />
      <p className="loader__label">{label}</p>
    </div>
  );
}

export default function App() {
  const [restored] = useState(() => loadProgress());
  const [screen, setScreen] = useState(restored?.screen ?? 'home');
  const [currentIndex, setCurrentIndex] = useState(restored?.currentIndex ?? 0);
  const [answers, setAnswers] = useState(restored?.answers ?? {});
  const [notice, setNotice] = useState(restored ? 'Welcome back! We restored your quiz progress.' : '');
  const [quizError, setQuizError] = useState('');
  const reducedMotion = usePrefersReducedMotion();
  const mainRef = useRef(null);

  // Persist progress (ids only) for refresh recovery; clear it on the home screen.
  useEffect(() => {
    if (screen === 'home') clearProgress();
    else saveProgress({ screen: screen === 'calculating' ? 'results' : screen, currentIndex, answers });
  }, [screen, currentIndex, answers]);

  // Move focus to the main region on screen changes, for keyboard and screen-reader users.
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!notice) return undefined;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (screen !== 'calculating') return undefined;
    const t = setTimeout(() => setScreen('results'), reducedMotion ? 300 : CALCULATING_MS);
    return () => clearTimeout(t);
  }, [screen, reducedMotion]);

  const startQuiz = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setQuizError('');
    setNotice('');
    setScreen('quiz');
  }, []);

  const selectAnswer = useCallback((questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setQuizError('');
  }, []);

  const goNext = useCallback(() => {
    const question = QUESTIONS[currentIndex];
    if (!answers[question.id]) {
      setQuizError('Please choose an answer to continue.');
      return;
    }
    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return;
    }
    const { valid, missing, invalid } = validateAnswers(answers);
    if (!valid) {
      const firstProblem = QUESTIONS.findIndex((q) => missing.includes(q.id) || invalid.includes(q.id));
      setCurrentIndex(Math.max(0, firstProblem));
      setQuizError('Looks like a question was skipped. Please answer it to see your match.');
      return;
    }
    setScreen('calculating');
  }, [answers, currentIndex]);

  const goBack = useCallback(() => {
    setQuizError('');
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else setScreen('home');
  }, [currentIndex]);

  const retake = useCallback(() => {
    clearProgress();
    startQuiz();
  }, [startQuiz]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <span className="brand" aria-label="PokéMatch">
          <span className="brand__ball" aria-hidden="true" />
          PokéMatch
        </span>
        {screen === 'quiz' && (
          <button type="button" className="btn btn--ghost btn--small" onClick={retake}>
            <RotateCcw size={16} aria-hidden="true" /> Start over
          </button>
        )}
      </header>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}

      <main id="main" ref={mainRef} tabIndex={-1} className="main">
        {screen === 'home' && <HomeScreen onStart={startQuiz} />}
        {screen === 'quiz' && (
          <QuizScreen
            questions={QUESTIONS}
            currentIndex={currentIndex}
            answers={answers}
            error={quizError}
            onSelect={selectAnswer}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {screen === 'calculating' && <Loader label="Analyzing your personality…" />}
        {screen === 'results' && (
          <Suspense fallback={<Loader label="Preparing your results…" />}>
            <ResultsScreen answers={answers} onRetake={retake} />
          </Suspense>
        )}
      </main>

      <Footer />
    </div>
  );
}
