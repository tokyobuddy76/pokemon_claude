import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

/**
 * One question as a native radio group: Tab moves into the group, arrow
 * keys change the choice, and screen readers announce "x of 4".
 */
export default function QuestionCard({ question, index, selected, onSelect }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  return (
    <fieldset className="question-card">
      <legend className="question-card__title" ref={headingRef} tabIndex={-1}>
        <span className="question-card__emoji" aria-hidden="true">
          {question.emoji}
        </span>
        <span className="sr-only">Question {index + 1}: </span>
        {question.text}
      </legend>
      <div className="options">
        {question.options.map((option, i) => {
          const checked = selected === option.id;
          return (
            <label key={option.id} className={`option${checked ? ' is-selected' : ''}`} style={{ '--i': i }}>
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={checked}
                onChange={() => onSelect(question.id, option.id)}
                className="option__input"
              />
              <span className="option__letter" aria-hidden="true">
                {checked ? <Check size={18} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="option__text">{option.text}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
