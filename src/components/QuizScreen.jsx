import { ArrowLeft, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import ProgressBar from './ProgressBar.jsx';
import QuestionCard from './QuestionCard.jsx';

export default function QuizScreen({ questions, currentIndex, answers, error, onSelect, onNext, onBack }) {
  const question = questions[currentIndex];
  if (!question) return null;
  const isLast = currentIndex === questions.length - 1;
  const hasAnswer = Boolean(answers[question.id]);
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  const handleSubmit = (event) => {
    event.preventDefault();
    onNext();
  };

  return (
    <section className="quiz" aria-label="Personality quiz">
      <ProgressBar current={currentIndex + 1} total={questions.length} answered={answeredCount} />

      <form onSubmit={handleSubmit} className="quiz__form">
        <div className="quiz__card-wrap" key={question.id}>
          <QuestionCard question={question} index={currentIndex} selected={answers[question.id]} onSelect={onSelect} />
        </div>

        <p className="quiz__error" role="alert">
          {error && (
            <>
              <AlertCircle size={18} aria-hidden="true" /> {error}
            </>
          )}
        </p>

        <div className="quiz__nav">
          <button type="button" className="btn btn--secondary" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden="true" />
            {currentIndex === 0 ? 'Home' : 'Back'}
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={!hasAnswer}
            aria-describedby={!hasAnswer ? 'next-hint' : undefined}
          >
            {isLast ? (
              <>
                <Sparkles size={18} aria-hidden="true" /> See My Match
              </>
            ) : (
              <>
                Next <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
        {!hasAnswer && (
          <p id="next-hint" className="quiz__hint">
            Pick an answer to continue.
          </p>
        )}
      </form>
    </section>
  );
}
