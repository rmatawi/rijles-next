import {
  Navbar,
  Page,
  Toolbar,
  NavRight,
  Button,
  NavTitle,
  NavLeft,
  CardFooter,
  Card,
} from "framework7-react";
import { useState, useEffect, useMemo } from "react";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import { examService } from "../services";
import NavHomeButton from "./NavHomeButton";

const questionContainer = {
  marginBottom: "1rem",
  padding: "0.75rem",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

// Get folder and total files based on environment variable
const selectedFolder = process.env.VITE_REACT_APP_TITLE?.toLowerCase() || "rayer";
const totalFilesCount = selectedFolder === "amelia" ? 10 : 25;

// Function to fetch all exams for the selected school from the database
const loadAllExamDataFromDB = async () => {
  const allData = { questions: [], signs: [], maquettes: [] };

  try {
    const { data, error } = await examService.getAllExamsBySchool(selectedFolder);

    if (error) {
      throw error;
    }

    if (data && Array.isArray(data)) {
      data.forEach((examRecord) => {
        if (examRecord.questions) allData.questions.push(...examRecord.questions);
        if (examRecord.signs) allData.signs.push(...examRecord.signs);
        if (examRecord.maquettes) allData.maquettes.push(...examRecord.maquettes);
      });
    }

    return allData;
  } catch (error) {
    console.error("Error loading all exam data from DB:", error);
    throw error;
  }
};

// Helper function to shuffle an array using Fisher-Yates algorithm
const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Component to render a single question with multiple choice answers
const QuestionComponent = ({
  question,
  answers,
  onSelectAnswer,
  selectedAnswer,
  isAnswered,
  isExamFinished,
  correctAnswerText,
}) => {
  // Use the answers provided by the parent (pre-shuffled when not answered, original when answered)
  const displayAnswers = answers;

  // Determine if the selected answer is correct
  const isCorrect = selectedAnswer && selectedAnswer === correctAnswerText;
  const isIncorrect =
    isAnswered && selectedAnswer && selectedAnswer !== correctAnswerText;

  return (
    <div style={questionContainer}>
      <h3>{question}</h3>
      <div className="answers-container">
        {displayAnswers.map((answer, index) => {
          const isSelected = selectedAnswer === answer.text;
          const isAnswerCorrect = answer.text === correctAnswerText;

          // Show answer if not answered yet OR if it's the selected answer
          const showAnswer = !isAnswered || isSelected;

          return showAnswer ? (
            <div
              key={index}
              className={`answer-option ${isSelected ? "selected" : ""}`}
              style={{
                padding: "0.5rem 0.75rem",
                margin: "0.25rem 0",
                border: isSelected
                  ? isCorrect
                    ? "2px solid var(--f7-theme-color, #28a745)"
                    : "2px solid var(--f7-danger-color, #dc3545)"
                  : isAnswerCorrect && isAnswered
                    ? "2px solid var(--f7-theme-color, #28a745)"
                    : "1px solid var(--f7-border-color, #ccc)",
                borderRadius: "4px",
                cursor: !isExamFinished ? "pointer" : "default",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => {
                if (!isAnswered && !isExamFinished) {
                  onSelectAnswer(answer);
                }
              }}
            >
              <span>{answer.text}</span>
              {isSelected && (
                <span
                  style={{
                    color: isCorrect
                      ? "var(--f7-theme-color, #28a745)"
                      : "var(--f7-danger-color, #dc3545)",
                    fontWeight: "bold",
                  }}
                >
                  {isCorrect ? "✓" : "✗"}
                </span>
              )}
              {!isSelected && isAnswered && isAnswerCorrect && (
                <span
                  style={{
                    color: "var(--f7-theme-color, #28a745)",
                    fontWeight: "bold",
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          ) : null;
        })}
      </div>
      {isIncorrect && (
        <div style={{ marginTop: "0.5rem", fontWeight: "normal" }}>
          <b>Correct antwoord: </b>
          <br />
          <i>{correctAnswerText}</i>
        </div>
      )}
    </div>
  );
};

// Component to render a sign question with multiple choice answers
const SignQuestionComponent = ({
  signQuestion,
  answers,
  onSelectAnswer,
  selectedAnswer,
  isAnswered,
  isExamFinished,
  correctAnswerText,
}) => {
  // Use the answers provided by the parent (pre-shuffled when not answered, original when answered)
  const displayAnswers = answers;

  // Determine if the selected answer is correct
  const isCorrect = selectedAnswer && selectedAnswer === correctAnswerText;
  const isIncorrect =
    isAnswered && selectedAnswer && selectedAnswer !== correctAnswerText;

  return (
    <div style={questionContainer}>
      <div
        style={{
          position: "relative",
          left: "50%",
          transform: "translate(-50%, 0)",
          textAlign: "center",
          marginBottom: "1rem",
          backgroundColor: "white",
          borderRadius: "10px",
          width: "180px",
        }}
      >
        <img
          src={signQuestion}
          alt="Verkeersbord"
          style={{ maxWidth: "100px", maxHeight: "100px" }}
        />
      </div>
      <div className="answers-container">
        {displayAnswers.map((answer, index) => {
          const isSelected = selectedAnswer === answer.text;
          const isAnswerCorrect = answer.text === correctAnswerText;

          // Show answer if not answered yet OR if it's the selected answer
          const showAnswer = !isAnswered || isSelected;

          return showAnswer ? (
            <div
              key={index}
              className={`answer-option ${isSelected ? "selected" : ""}`}
              style={{
                padding: "0.5rem 0.75rem",
                margin: "0.25rem 0",
                border: isSelected
                  ? isCorrect
                    ? "2px solid var(--f7-theme-color, #28a745)"
                    : "2px solid var(--f7-danger-color, #dc3545)"
                  : isAnswerCorrect && isAnswered
                    ? "2px solid var(--f7-theme-color, #28a745)"
                    : "1px solid var(--f7-border-color, #ccc)",
                borderRadius: "4px",
                cursor: !isExamFinished ? "pointer" : "default",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => {
                if (!isAnswered && !isExamFinished) {
                  onSelectAnswer(answer);
                }
              }}
            >
              <span>{answer.text}</span>
              {isSelected && (
                <span
                  style={{
                    color: isCorrect
                      ? "var(--f7-theme-color, #28a745)"
                      : "var(--f7-danger-color, #dc3545)",
                    fontWeight: "bold",
                  }}
                >
                  {isCorrect ? "✓" : "✗"}
                </span>
              )}
              {!isSelected && isAnswered && isAnswerCorrect && (
                <span
                  style={{
                    color: "var(--f7-theme-color, #28a745)",
                    fontWeight: "bold",
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          ) : null;
        })}
      </div>
      {isIncorrect && (
        <div style={{ marginTop: "0.5rem", fontWeight: "normal" }}>
          <b>Correct antwoord: </b>
          <br />
          <i>{correctAnswerText}</i>
        </div>
      )}
    </div>
  );
};

// Component to render a maquette question with multiple choice answers
const MaquettesComponent = ({
  maquetteQuestion,
  answers,
  onSelectAnswer,
  selectedAnswer,
  isAnswered,
  isExamFinished,
  correctAnswerText,
}) => {
  // Use the answers provided by the parent (pre-shuffled when not answered, original when answered)
  const displayAnswers = answers;

  // Determine if the selected answer is correct
  const isCorrect = selectedAnswer && selectedAnswer === correctAnswerText;
  const isIncorrect =
    isAnswered && selectedAnswer && selectedAnswer !== correctAnswerText;

  return (
    <div style={questionContainer}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "1rem",
          backgroundColor: "white",
          borderRadius: "10px",
        }}
      >
        <img
          src={maquetteQuestion}
          alt="Verkeersbord"
          style={{ maxHeight: "320px" }}
        />
      </div>
      <div className="answers-container">
        {displayAnswers.map((answer, index) => {
          const isSelected = selectedAnswer === answer.text;
          const isAnswerCorrect = answer.text === correctAnswerText;

          // Show answer if not answered yet OR if it's the selected answer
          const showAnswer = !isAnswered || isSelected;

          return showAnswer ? (
            <div
              key={index}
              className={`answer-option ${isSelected ? "selected" : ""}`}
              style={{
                padding: "0.5rem 0.75rem",
                margin: "0.25rem 0",
                border: isSelected
                  ? isCorrect
                    ? "2px solid var(--f7-theme-color, #28a745)"
                    : "2px solid var(--f7-danger-color, #dc3545)"
                  : isAnswerCorrect && isAnswered
                    ? "2px solid var(--f7-theme-color, #28a745)"
                    : "1px solid var(--f7-border-color, #ccc)",
                borderRadius: "4px",
                cursor: !isExamFinished ? "pointer" : "default",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onClick={() => {
                if (!isAnswered && !isExamFinished) {
                  onSelectAnswer(answer);
                }
              }}
            >
              <span>{answer.text}</span>
              {isSelected && (
                <span
                  style={{
                    color: isCorrect
                      ? "var(--f7-theme-color, #28a745)"
                      : "var(--f7-danger-color, #dc3545)",
                    fontWeight: "bold",
                  }}
                >
                  {isCorrect ? "✓" : "✗"}
                </span>
              )}
              {!isSelected && isAnswered && isAnswerCorrect && (
                <span
                  style={{
                    color: "var(--f7-theme-color, #28a745)",
                    fontWeight: "bold",
                  }}
                >
                  ✓
                </span>
              )}
            </div>
          ) : null;
        })}
      </div>
      {isIncorrect && (
        <div style={{ marginTop: "0.5rem", fontWeight: "normal" }}>
          <b>Correct antwoord: </b>
          <br />
          <i>{correctAnswerText}</i>
        </div>
      )}
    </div>
  );
};

const MockExams = () => {
  // State for tracking selected answers
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const { canManageCurrentSchool } = useAdminStatus();
  // State to track which questions have had answers selected (to hide other options)
  const [answeredQuestions, setAnsweredQuestions] = useState({});
  // State to store shuffled answers per question to prevent re-shuffling on every render
  const [shuffledAnswers, setShuffledAnswers] = useState({});
  // State for exam timer
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isExamActive, setIsExamActive] = useState(false);

  // State to hold the loaded exam data
  const [loadedExamData, setLoadedExamData] = useState({
    questions: [],
    signs: [],
    maquettes: [],
  });
  // State to hold the randomized exam data used during the exam
  const [randomizedExamData, setRandomizedExamData] = useState({
    questions: [],
    signs: [],
    maquettes: [],
  });
  // State to track current question index for single question display
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Helper function to randomly select items from an array
  const getRandomItems = (array, maxCount) => {
    if (array.length <= maxCount) {
      return [...array]; // Return all if array is smaller than max count
    }

    const shuffled = [...array].sort(() => 0.5 - Math.random());
    const result = shuffled.slice(0, maxCount);
    return result;
  };

  // Function to generate new randomized exam data
  const generateNewRandomizedData = () => {
    if (loadedExamData.questions.length > 0) {
      const randomizedData = {
        questions: getRandomItems(loadedExamData.questions, 10),
        signs: getRandomItems(loadedExamData.signs, 10),
        maquettes: getRandomItems(loadedExamData.maquettes, 5),
      };
      return randomizedData;
    }
    return { questions: [], signs: [], maquettes: [] };
  };

  // Effect hook to load all exam data when component mounts
  useEffect(() => {
    loadAllExamDataFromDB()
      .then((allData) => {
        // For initial load, we'll store all the data
        setLoadedExamData(allData);

        // Also immediately select randomized data to have it ready
        const randomizedData = generateNewRandomizedData();
        setRandomizedExamData(randomizedData);
      })
      .catch((error) => {
        console.error("Failed to load exam data on mount:", error);
      });
  }, []); // Empty dependency array means this runs once when component mounts

  // Effect hook for countdown timer
  useEffect(() => {
    let timer;
    if (isExamActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Exam time is up - stop the exam
      setIsExamActive(false);
    }

    return () => clearInterval(timer);
  }, [isExamActive, timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate scores per section
  const scores = useMemo(() => {
    let questionScore = 0;
    let signScore = 0;
    let maquetteScore = 0;

    // Calculate question score - use randomized data when exam is active
    const questionsToUse = isExamActive
      ? randomizedExamData.questions
      : loadedExamData.questions;
    questionsToUse.forEach((question, index) => {
      const userAnswer = selectedAnswers[`question-${index}`];
      // Find the correct answer from the original question data (score: 1 indicates correct answer)
      const correctAnswer = question.a.find((answer) => answer.score === 1);
      if (
        userAnswer &&
        correctAnswer &&
        userAnswer.text === correctAnswer.text
      ) {
        questionScore++;
      }
    });

    // Calculate sign score - use randomized data when exam is active
    const signsToUse = isExamActive
      ? randomizedExamData.signs
      : loadedExamData.signs;
    signsToUse.forEach((sign, index) => {
      const userAnswer = selectedAnswers[`sign-${index}`];
      // Find the correct answer from the original sign data (score: 1 indicates correct answer)
      const correctAnswer = sign.a.find((answer) => answer.score === 1);
      if (
        userAnswer &&
        correctAnswer &&
        userAnswer.text === correctAnswer.text
      ) {
        signScore++;
      }
    });

    // Calculate maquette score - use randomized data when exam is active
    const maquettesToUse = isExamActive
      ? randomizedExamData.maquettes
      : loadedExamData.maquettes;
    maquettesToUse.forEach((maquette, index) => {
      const userAnswer = selectedAnswers[`maquette-${index}`];
      // Find the correct answer from the original maquette data (score: 1 indicates correct answer)
      const correctAnswer = maquette.a.find((answer) => answer.score === 1);
      if (
        userAnswer &&
        correctAnswer &&
        userAnswer.text === correctAnswer.text
      ) {
        maquetteScore++;
      }
    });

    const totalScore = questionScore + signScore + maquetteScore;

    return {
      questionScore,
      signScore,
      maquetteScore,
      totalScore,
    };
  }, [
    selectedAnswers,
    loadedExamData.questions,
    loadedExamData.signs,
    loadedExamData.maquettes,
    randomizedExamData.questions,
    randomizedExamData.signs,
    randomizedExamData.maquettes,
    isExamActive,
  ]);

  // Create flattened array of all questions for single question display
  const allQuestions = useMemo(() => {
    if (!isExamActive || randomizedExamData.questions.length === 0) {
      return [];
    }
    return [
      ...randomizedExamData.questions.map((q, i) => ({ type: 'question', data: q, index: i })),
      ...randomizedExamData.signs.map((s, i) => ({ type: 'sign', data: s, index: i })),
      ...randomizedExamData.maquettes.map((m, i) => ({ type: 'maquette', data: m, index: i }))
    ];
  }, [isExamActive, randomizedExamData]);

  // Check if the exam is passed based on criteria
  const checkPassOrFail = useMemo(() => {
    // Only calculate pass/fail if we have randomized data
    if (randomizedExamData.questions.length > 0) {
      // Passing criteria: 6 points for questions, 6 points for signs, 3 points for maquettes
      const questionPassed = scores.questionScore >= 6;
      const signPassed = scores.signScore >= 6;
      const maquettePassed = scores.maquetteScore >= 3;

      const isPassed = questionPassed && signPassed && maquettePassed;

      return {
        isPassed,
        questionPassed,
        signPassed,
        maquettePassed,
        scores,
      };
    } else {
      return {
        isPassed: false,
        questionPassed: false,
        signPassed: false,
        maquettePassed: false,
        scores: scores,
      };
    }
  }, [scores, randomizedExamData.questions.length]);

  // Function to initialize all shuffled answers when exam starts
  useEffect(() => {
    if (isExamActive) {
      // Use the already randomized data and just shuffle the answers
      if (randomizedExamData.questions.length > 0) {
        // Generate shuffled answers for the randomized questions
        const newShuffledAnswers = {};

        // Shuffle answers for questions
        randomizedExamData.questions.forEach((question, index) => {
          newShuffledAnswers[`question-${index}`] = shuffleArray(question.a);
        });

        // Shuffle answers for signs
        randomizedExamData.signs.forEach((sign, index) => {
          newShuffledAnswers[`sign-${index}`] = shuffleArray(sign.a);
        });

        // Shuffle answers for maquettes
        randomizedExamData.maquettes.forEach((maquette, index) => {
          newShuffledAnswers[`maquette-${index}`] = shuffleArray(maquette.a);
        });

        setShuffledAnswers(newShuffledAnswers);
      }
    } else {
      // Clear shuffled answers when exam is not active
      setShuffledAnswers({});
    }
  }, [isExamActive, randomizedExamData]);

  // Function to get shuffled answers for a specific question
  const getShuffledAnswers = (questionType, questionIndex) => {
    const key = `${questionType}-${questionIndex}`;
    return shuffledAnswers[key] || [];
  };

  // Handler for when an answer is selected
  const handleSelectAnswer = (questionType, questionIndex, answer) => {
    setSelectedAnswers((prev) => {
      const newSelectedAnswers = {
        ...prev,
        [`${questionType}-${questionIndex}`]: answer,
      };
      return newSelectedAnswers;
    });

    // Mark this question as answered to hide other options
    setAnsweredQuestions((prev) => {
      const newAnsweredQuestions = {
        ...prev,
        [`${questionType}-${questionIndex}`]: true,
      };
      return newAnsweredQuestions;
    });
  };



  return (
    <Page name="maquette" id="maquette-page" className="page-neu">
      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          {isExamActive ? (
            <>
              <span style={{ fontWeight: "100" }}>Eindigt In:</span>{" "}
              <span style={{ color: "red", fontWeight: "bold" }}>
                {formatTime(timeLeft)}
              </span>
            </>
          ) : (
            "Proef Examen"
          )}
        </NavTitle>
        <NavRight></NavRight>
      </Navbar>

      {!isExamActive && (
        <CardFooter style={{ marginTop: "150px" }}>
          <div />
          <Button
            text="BEGIN TEST EXAMEN"
            fill
            large
            style={{
              backgroundColor: "var(--app-primary-color, #007bff)",
              color: "white",
              width: "50vw",
            }}
            disabled={loadedExamData.questions.length === 0} // Disable until data is loaded
            onClick={() => {
              // Generate new random sets of questions, signs, and maquettes
              const newRandomizedData = generateNewRandomizedData();
              setRandomizedExamData(newRandomizedData);

              // Reset selections and answered state when starting exam
              setSelectedAnswers({});
              setAnsweredQuestions({});
              // Reset timer to 25 minutes and start the exam
              setTimeLeft(25 * 60);
              setIsExamActive(true);
              // Reset to first question
              setCurrentQuestionIndex(0);
            }}
          />
          <div />
        </CardFooter>
      )}

      <div>
        {/* Render single question when exam is active */}
        <div className="exam-container" style={{ padding: "1rem" }}>
          {isExamActive && allQuestions.length > 0 && (
            <>
              {/* Progress indicator */}
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  Vraag {currentQuestionIndex + 1} van {allQuestions.length}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "#e9ecef",
                    borderRadius: "4px",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: `${((currentQuestionIndex + 1) / allQuestions.length) * 100}%`,
                      height: "100%",
                      backgroundColor: "var(--app-primary-color, #007bff)",
                      borderRadius: "4px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>

              {/* Render current question */}
              {(() => {
                const currentQuestion = allQuestions[currentQuestionIndex];
                const isAnswered = answeredQuestions[`${currentQuestion.type}-${currentQuestion.index}`];
                const isExamFinished = !isExamActive;
                const questionAnswers =
                  isAnswered || isExamFinished
                    ? currentQuestion.data.a
                    : getShuffledAnswers(currentQuestion.type, currentQuestion.index);
                const correctAnswerText = currentQuestion.data.a.find(
                  (answer) => answer.score === 1
                )?.text;

                if (currentQuestion.type === 'question') {
                  return (
                    <QuestionComponent
                      key={`question-${currentQuestion.index}`}
                      question={currentQuestion.data.q}
                      answers={questionAnswers}
                      onSelectAnswer={(answer) =>
                        handleSelectAnswer("question", currentQuestion.index, answer)
                      }
                      selectedAnswer={selectedAnswers[`question-${currentQuestion.index}`]?.text}
                      isAnswered={isAnswered}
                      isExamFinished={isExamFinished}
                      correctAnswerText={correctAnswerText}
                    />
                  );
                } else if (currentQuestion.type === 'sign') {
                  return (
                    <SignQuestionComponent
                      key={`sign-${currentQuestion.index}`}
                      signQuestion={currentQuestion.data.q}
                      answers={questionAnswers}
                      onSelectAnswer={(answer) =>
                        handleSelectAnswer("sign", currentQuestion.index, answer)
                      }
                      selectedAnswer={selectedAnswers[`sign-${currentQuestion.index}`]?.text}
                      isAnswered={isAnswered}
                      isExamFinished={isExamFinished}
                      correctAnswerText={correctAnswerText}
                    />
                  );
                } else if (currentQuestion.type === 'maquette') {
                  return (
                    <MaquettesComponent
                      key={`maquette-${currentQuestion.index}`}
                      maquetteQuestion={currentQuestion.data.q}
                      answers={questionAnswers}
                      onSelectAnswer={(answer) =>
                        handleSelectAnswer("maquette", currentQuestion.index, answer)
                      }
                      selectedAnswer={selectedAnswers[`maquette-${currentQuestion.index}`]?.text}
                      isAnswered={isAnswered}
                      isExamFinished={isExamFinished}
                      correctAnswerText={correctAnswerText}
                    />
                  );
                }
                return null;
              })()}

              {/* Navigation buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem" }}>
                <Button
                  text="Vorige"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  style={{
                    backgroundColor: currentQuestionIndex === 0 ? "#ccc" : "var(--app-primary-color, #007bff)",
                    color: "white",
                  }}
                />
                <Button
                  text={currentQuestionIndex === allQuestions.length - 1 ? "Voltooien" : "Volgende"}
                  fill
                  onClick={() => {
                    if (currentQuestionIndex === allQuestions.length - 1) {
                      // Finish exam
                      setIsExamActive(false);
                    } else {
                      // Next question
                      setCurrentQuestionIndex(currentQuestionIndex + 1);
                    }
                  }}
                  style={{
                    backgroundColor: "var(--app-primary-color, #007bff)",
                    color: "white",
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Card style={{ marginBottom: "180px" }}>
        {/* Score display */}
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
            }}
          >
            <div style={{ margin: "0.5rem" }}>
              <strong>Vragen:</strong> {checkPassOrFail.scores.questionScore}/
              {isExamActive
                ? randomizedExamData.questions.length
                : randomizedExamData.questions.length > 0
                  ? randomizedExamData.questions.length
                  : 0}
            </div>
            <div style={{ margin: "0.5rem" }}>
              <strong>Borden:</strong> {checkPassOrFail.scores.signScore}/
              {isExamActive
                ? randomizedExamData.signs.length
                : randomizedExamData.signs.length > 0
                  ? randomizedExamData.signs.length
                  : 0}
            </div>
            <div style={{ margin: "0.5rem" }}>
              <strong>Maquette:</strong> {checkPassOrFail.scores.maquetteScore}/
              {isExamActive
                ? randomizedExamData.maquettes.length
                : randomizedExamData.maquettes.length > 0
                  ? randomizedExamData.maquettes.length
                  : 0}
            </div>
          </div>
          {Object.keys(selectedAnswers).length > 0 && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.5rem",
                borderRadius: "4px",
                backgroundColor: checkPassOrFail.isPassed
                  ? "#d4edda"
                  : "#f8d7da",
                color: checkPassOrFail.isPassed ? "#155724" : "#721c24",
                fontWeight: "bold",
              }}
            >
              {checkPassOrFail.isPassed ? "GEHAALD!" : "GEZAKT!"}
            </div>
          )}
        </div>
      </Card>

      {/* Bottom Toolbar - moved outside the scaling div */}
      {canManageCurrentSchool && (
        <Toolbar bottom className="neu-toolbar">
          <div />
          {isExamActive && (
            <Button
              style={{
                width: "50vw",
                backgroundColor: "var(--app-primary-color, #007bff)",
              }}
              text="KLAAR / OPNIEUW"
              fill
              large
              onClick={() => {
                // Stop the exam when done
                setIsExamActive(false);
              }}
            />
          )}
          {!isExamActive && (
            <Button text="CONTROLEREN" href="/mockexamssequenced/" />
          )}
          <div />
        </Toolbar>
      )}
    </Page>
  );
};

export default MockExams;
