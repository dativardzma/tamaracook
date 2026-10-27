import { useState } from "react";
import "./LockerSurvey.css";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

const questions = [
  {
    id: "q1",
    title: "რა არის შენთვის ყველაზე მნიშვნელოვანი თვისება კოდიანი საკეტის მქონე კარადისთვის?",
    type: "text",
  },
  {
    id: "q2",
    title: "გამოგიყენებია ოდესმე მექანიკური კოდიანი საკეტი?",
    type: "radio",
    options: ["დიახ", "არა"],
  },
  {
    id: "q3",
    title: "რამდენად მნიშვნელოვანია, რომ კოდი ადვილად დასამახსოვრებელი იყოს?",
    type: "rating",
  },
  {
    id: "q4",
    title: "რის შენახვას ისურვებდი ასეთ კარადაში? შეგიძლია რამდენიმე პასუხი მონიშნო.",
    type: "checkbox",
    options: ["წიგნები", "სპორტული ნივთები", "ტანსაცმელი", "სასკოლო ნივთები", "სხვა"],
  },
  {
    id: "q5",
    title: "რომელი მასალის კარადას მიანიჭებდი უპირატესობას?",
    type: "radio",
    options: ["ლითონის", "ხის", "პლასტმასის", "მნიშვნელობა არ აქვს"],
  },
  {
    id: "q6",
    title: "სად გამოიყენებდი ასეთ კარადას ყველაზე ხშირად?",
    type: "radio",
    options: ["სკოლაში", "სპორტულ დარბაზში", "სახლში", "სხვა"],
  },
  {
    id: "q7",
    title: "რომელი ტიპის მექანიკურ კოდიან საკეტს აირჩევდი?",
    type: "radio",
    options: [
      "სამნიშნა მბრუნავი კოდი",
      "ოთხნიშნა მბრუნავი კოდი",
      "ღილაკებიანი მექანიკური საკეტი",
    ],
  },
  {
    id: "q8",
    title: "რამდენად ხშირად შეცვლიდი კოდს?",
    type: "radio",
    options: ["თვეში ერთხელ", "რამდენიმე თვეში ერთხელ", "მხოლოდ საჭიროებისას", "არასდროს"],
  },
  {
    id: "q9",
    title: "რამდენად მარტივი უნდა იყოს კოდის შეცვლა?",
    type: "radio",
    options: ["მარტივად", "საშუალოდ", "რთულად"],
  },
  {
    id: "q10",
    title: "ურჩევდი თუ არა კოდიან კარადას შენს თანაკლასელს?",
    type: "radio",
    options: ["დიახ", "არა", "არ ვიცი"],
  },
];

function SurveyQuestion({ question, value, onChange }) {
  return (
    <section className="locker-survey-question">
      <h2 className="locker-survey-question-title">
        <span className="locker-survey-number">{String(Number(question.id.slice(1))).padStart(2, "0")}</span>
        {question.title}
      </h2>

      {question.type === "text" && (
        <textarea
          required
          maxLength={2000}
          rows={3}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="შენი პასუხი..."
        />
      )}

      {question.type === "rating" && (
        <div className="locker-survey-rating" role="radiogroup" aria-label="შეფასება 1-დან 5-მდე">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className={value === rating ? "selected" : ""}>
              <input
                type="radio"
                name={question.id}
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
                required={rating === 1}
              />
              <span>{rating}</span>
            </label>
          ))}
          <div className="locker-survey-rating-labels">
            <span>უმნიშვნელოა</span>
            <span>ძალიან მნიშვნელოვანია</span>
          </div>
        </div>
      )}

      {(question.type === "radio" || question.type === "checkbox") && (
        <div
          className="locker-survey-options"
          role={question.type === "radio" ? "radiogroup" : "group"}
          aria-label={question.title}
        >
          {question.options.map((option) => {
            const checked = question.type === "checkbox"
              ? (value || []).includes(option)
              : value === option;
            return (
              <label className="locker-survey-option" key={option}>
                <input
                  type={question.type}
                  name={question.id}
                  value={option}
                  checked={checked}
                  required={question.type === "radio" && question.options[0] === option}
                  onChange={() => {
                    if (question.type === "radio") {
                      onChange(option);
                      return;
                    }
                    const selected = value || [];
                    onChange(
                      checked
                        ? selected.filter((item) => item !== option)
                        : [...selected, option]
                    );
                  }}
                />
                <span>{option}</span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function LockerSurvey() {
  const [answers, setAnswers] = useState({});
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateAnswer = (id, value) => {
    setAnswers((current) => ({ ...current, [id]: value }));
  };

  const submitSurvey = async (event) => {
    event.preventDefault();
    setError("");

    if (!Array.isArray(answers.q4) || answers.q4.length === 0) {
      setError("მეოთხე კითხვაზე მინიმუმ ერთი პასუხი მონიშნე.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/locker-survey-responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, answers }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "პასუხის შენახვა ვერ მოხერხდა. სცადეთ ხელახლა."
        );
      }
      setSubmitted(true);
    } catch (submitError) {
      setError(submitError.message || "პასუხის გაგზავნა ვერ მოხერხდა. სცადე ხელახლა.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="locker-survey-page">
      <div className="locker-survey-wrap">
        <header className="locker-survey-header">
          <div className="locker-survey-eyebrow">სასკოლო გამოკითხვა · 10 კითხვა</div>
          <h1>კოდიანი საკეტები</h1>
          <p>
            გაგვიზიარე შენი აზრი მექანიკურ, არაელექტრონულ კოდიან საკეტებსა და კარადებზე.
            პასუხის გაგზავნამდე მიუთითე სახელი და გვარი.
          </p>
        </header>

        {submitted ? (
          <section className="locker-survey-success" role="status">
            <div className="locker-survey-success-icon">✓</div>
            <h2>გმადლობ, {firstName}!</h2>
            <p>შენი პასუხები მონაცემთა ბაზაში შეინახა.</p>
          </section>
        ) : (
          <form className="locker-survey-form" onSubmit={submitSurvey}>
            <div className="locker-survey-question-list">
              {questions.map((question) => (
                <SurveyQuestion
                  key={question.id}
                  question={question}
                  value={answers[question.id]}
                  onChange={(value) => updateAnswer(question.id, value)}
                />
              ))}
            </div>

            <section className="locker-survey-identity">
              <h2>შენი მონაცემები</h2>
              <p>სახელი და გვარი საჭიროა პასუხის შესანახად.</p>
              <div className="locker-survey-name-fields">
                <label>
                  სახელი
                  <input
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    maxLength={80}
                    required
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="მაგალითად, დავით"
                  />
                </label>
                <label>
                  გვარი
                  <input
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    maxLength={80}
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    placeholder="მაგალითად, სვანიძე"
                  />
                </label>
              </div>
            </section>

            {error && <div className="locker-survey-error" role="alert">{error}</div>}

            <button className="locker-survey-submit" type="submit" disabled={submitting}>
              {submitting ? "იგზავნება..." : "პასუხების გაგზავნა"}
            </button>
            <p className="locker-survey-privacy">პასუხები შეინახება სკოლის გამოკითხვის შედეგებისთვის.</p>
          </form>
        )}
      </div>
    </main>
  );
}
