import {
  Navbar,
  Page,
  Toolbar,
  NavRight,
  Button,
  NavTitle,
  NavLeft,
  CardFooter,
  Icon,
} from "framework7-react";
import { useState, useEffect } from "react";
import { isLocalhost } from "../js/utils";
import { trafficSignsData } from "../js/trafficSignsData";
import { examService } from "../services";
import { useAdminStatus } from "../contexts/AdminStatusContext";
import NavHomeButton from "./NavHomeButton";

const questionContainer = {
  marginBottom: "2rem",
  padding: "1rem",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

// Get folder based on environment variable
const selectedFolder = process.env.VITE_REACT_APP_TITLE?.toLowerCase() || "rayer";
const totalExams = selectedFolder === "amelia" ? 10 : 25;

// Component to render a single question with answers displayed with A, B, C prefixes
const QuestionComponent = ({ question, answers, correctAnswerText, onEditAnswer, isAdmin }) => {
  return (
    <div style={questionContainer}>
      <h3>{question}</h3>
      <div className="answers-container">
        {answers.map((answer, index) => {
          const isCorrect = answer.text === correctAnswerText;
          const letter = String.fromCharCode(65 + index); // A, B, C, etc.

          return (
            <div
              key={index}
              className={`answer-option ${isCorrect ? "correct-answer" : ""}`}
              style={{
                padding: "0.75rem",
                margin: "0.5rem 0",
                border: isCorrect
                  ? "2px solid var(--f7-theme-color, #28a745)"
                  : "1px solid var(--f7-border-color, #ccc)",
                borderRadius: "4px",
                backgroundColor: isCorrect
                  ? "rgba(40, 167, 69, 0.1)"
                  : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ flex: 1 }}>
                <strong>{letter}.</strong> {answer.text}
              </span>
              {isCorrect && (
                <span
                  style={{
                    color: "var(--f7-theme-color, #28a745)",
                    fontWeight: "bold",
                    marginLeft: "0.5rem",
                  }}
                >
                  ✓ Correct
                </span>
              )}
              {isAdmin && (
                <span
                  style={{ cursor: "pointer", marginLeft: "0.5rem" }}
                  onClick={() => onEditAnswer(answer, index, 'questions')}
                >
                  ✏️
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component to render a sign question with answers displayed with A, B, C prefixes
const SignQuestionComponent = ({
  signQuestion,
  answers,
  correctAnswerText,
  onEditAnswer,
  onEditSign,
  isAdmin,
}) => {
  return (
    <div style={questionContainer}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "1rem",
          backgroundColor: "white",
          borderRadius: "10px",
          width: "180px",
          margin: "0 auto",
          position: "relative",
        }}
      >
        <img
          src={signQuestion}
          alt="Verkeersbord"
          style={{ maxWidth: "100px", maxHeight: "100px", display: "block", margin: "0 auto" }}
        />
        {isAdmin && (
          <span
            style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              cursor: "pointer",
              backgroundColor: "white",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
            onClick={onEditSign}
          >
            ✏️
          </span>
        )}
      </div>
      <div className="answers-container">
        {answers.map((answer, index) => {
          const isCorrect = answer.text === correctAnswerText;
          const letter = String.fromCharCode(65 + index); // A, B, C, etc.

          return (
            <div
              key={index}
              className={`answer-option ${isCorrect ? "correct-answer" : ""}`}
              style={{
                padding: "0.75rem",
                margin: "0.5rem 0",
                border: isCorrect
                  ? "2px solid var(--f7-theme-color, #28a745)"
                  : "1px solid var(--f7-border-color, #ccc)",
                borderRadius: "4px",
                backgroundColor: isCorrect
                  ? "rgba(40, 167, 69, 0.1)"
                  : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ flex: 1 }}>
                <strong>{letter}.</strong> {answer.text}
              </span>
              {isCorrect && (
                <span
                  style={{
                    color: "var(--f7-theme-color, #28a745)",
                    fontWeight: "bold",
                    marginLeft: "0.5rem",
                  }}
                >
                  ✓ Correct
                </span>
              )}
              {isAdmin && (
                <span
                  style={{ cursor: "pointer", marginLeft: "0.5rem" }}
                  onClick={() => onEditAnswer(answer, index, 'signs')}
                >
                  ✏️
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component to render a maquette question with answers displayed with A, B, C prefixes
const MaquettesComponent = ({
  maquetteQuestion,
  answers,
  correctAnswerText,
  onEditAnswer,
  isAdmin,
}) => {
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
        {answers.map((answer, index) => {
          const isCorrect = answer.text === correctAnswerText;
          const letter = String.fromCharCode(65 + index); // A, B, C, etc.

          return (
            <div
              key={index}
              className={`answer-option ${isCorrect ? "correct-answer" : ""}`}
              style={{
                padding: "0.75rem",
                margin: "0.5rem 0",
                border: isCorrect
                  ? "2px solid var(--f7-theme-color, #28a745)"
                  : "1px solid var(--f7-border-color, #ccc)",
                borderRadius: "4px",
                backgroundColor: isCorrect
                  ? "rgba(40, 167, 69, 0.1)"
                  : "transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ flex: 1 }}>
                <strong>{letter}.</strong> {answer.text}
              </span>
              {isCorrect && (
                <span
                  style={{
                    color: "var(--f7-theme-color, #28a745)",
                    fontWeight: "bold",
                    marginLeft: "0.5rem",
                  }}
                >
                  ✓ Correct
                </span>
              )}
              {isAdmin && (
                <span
                  style={{ cursor: "pointer", marginLeft: "0.5rem" }}
                  onClick={() => onEditAnswer(answer, index, 'maquettes')}
                >
                  ✏️
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MockExamsSequenced = () => {
  const { canManageCurrentSchool } = useAdminStatus();
  // State for tracking selected JSON file
  const [selectedFileNumber, setSelectedFileNumber] = useState(1);
  // State for exam data
  const [examData, setExamData] = useState({
    questions: [],
    signs: [],
    maquettes: [],
  });
  // State for loading
  const [loading, setLoading] = useState(false);
  // State for zoom functionality
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 1.25 = 125%, 1.5 = 150%

  // State for managing answer editing
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [answerIndex, setAnswerIndex] = useState(null); // Index of the question
  const [answerInQuestionIndex, setAnswerInQuestionIndex] = useState(null); // Index of the answer within the question
  const [answerSection, setAnswerSection] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [editedScore, setEditedScore] = useState(0);

  // State for managing sign image editing
  const [isSignEditSheetOpen, setIsSignEditSheetOpen] = useState(false);
  const [currentSignQuestionIndex, setCurrentSignQuestionIndex] = useState(null);

  // Function to load exam data from database
  const fetchExamFromDB = async (fileNumber) => {
    try {
      const { data, error } = await examService.getExam(selectedFolder, fileNumber);

      if (error) {
        throw error;
      }

      if (data) {
        console.log(`Loaded exam ${fileNumber} from database`);
        return {
          questions: data.questions || [],
          signs: data.signs || [],
          maquettes: data.maquettes || [],
        };
      }

      // If no data found in DB, return empty state or handle as error
      console.warn(`No data found in database for exam ${fileNumber}`);
      return {
        questions: [],
        signs: [],
        maquettes: [],
      };
    } catch (error) {
      console.error(`Failed to load exam ${fileNumber} from database:`, error);
      throw error;
    }
  };

  // Effect hook to load exam data when component mounts with file number 1
  useEffect(() => {
    fetchExamFromDB(selectedFileNumber)
      .then((data) => {
        setExamData(data);
      })
      .catch((error) => {
        console.error("Failed to load initial exam data:", error);
      });
  }, [selectedFileNumber, selectedFolder]); // Load when selectedFileNumber or selectedFolder changes

  // Function to handle file selection
  const handleFileSelect = (fileNumber) => {
    setLoading(true);
    setSelectedFileNumber(fileNumber);
    fetchExamFromDB(fileNumber)
      .then((data) => {
        setExamData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          `Failed to load exam data for file ${fileNumber}:`,
          error
        );
        setLoading(false);
      });
  };

  // Function to toggle zoom levels
  const toggleZoom = () => {
    setZoomLevel((prevZoom) => {
      if (prevZoom === 1) return 1.25;
      if (prevZoom === 1.25) return 1.5;
      return 1; // Reset to 100%
    });
  };

  // Function to format file number with leading zero
  const formatFileNumber = (num) => String(num).padStart(2, "0");

  // Function to handle answer editing
  const handleEditAnswer = (answer, questionIndex, section) => {
    if (!canManageCurrentSchool) {
      alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    // Find the index of the answer within the question's answers array
    const question = examData[section][questionIndex];
    const answerIndexInQuestion = question.a.findIndex(a => a.text === answer.text && a.score === answer.score);

    setCurrentAnswer(answer);
    setAnswerIndex(questionIndex); // This is the question index
    setAnswerInQuestionIndex(answerIndexInQuestion); // This is the answer index within the question
    setAnswerSection(section);
    setEditedText(answer.text);
    setEditedScore(answer.score);
    setIsEditSheetOpen(true);
  };

  // Function to handle sign editing
  const handleEditSign = (questionIndex) => {
    if (!canManageCurrentSchool) {
      alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }
    setCurrentSignQuestionIndex(questionIndex);
    setIsSignEditSheetOpen(true);
  };

  // Function to select and save the new sign image
  const handleSelectSignImage = (newImage) => {
    if (!canManageCurrentSchool) {
      alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    // Create a copy of the current exam data to update
    const updatedExamData = { ...examData };

    // Update the specific sign question in the signs section
    const updatedSigns = [...updatedExamData.signs];
    if (updatedSigns.length > currentSignQuestionIndex) {
      updatedSigns[currentSignQuestionIndex] = { ...updatedSigns[currentSignQuestionIndex], q: newImage };
      updatedExamData.signs = updatedSigns;

      setExamData(updatedExamData);
    }

    setIsSignEditSheetOpen(false);
  };

  // Function to save the edited answer
  const handleSaveAnswer = () => {
    if (!canManageCurrentSchool) {
      alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    // Create a copy of the current exam data to update
    const updatedExamData = { ...examData };

    // Update the specific answer in the appropriate section
    const section = updatedExamData[answerSection];
    if (section && section.length > answerIndex && answerInQuestionIndex !== null) {
      // Create a new array for the answers to trigger re-render
      const updatedQuestion = { ...section[answerIndex] };
      const updatedAnswers = [...updatedQuestion.a];

      // Update the specific answer that was being edited
      updatedAnswers[answerInQuestionIndex] = { ...updatedAnswers[answerInQuestionIndex], text: editedText, score: editedScore };
      updatedQuestion.a = updatedAnswers;

      // Update the exam data
      const updatedSection = [...section];
      updatedSection[answerIndex] = updatedQuestion;
      updatedExamData[answerSection] = updatedSection;

      setExamData(updatedExamData);
    }

    setIsEditSheetOpen(false);
  };

  // Function to persist edited exam data to the database
  const handleSaveToDatabase = async () => {
    if (!canManageCurrentSchool) {
      alert("Je hebt geen beheertoegang voor de huidige rijschool.");
      return;
    }

    try {
      const payload = {
        school: selectedFolder,
        exam: selectedFileNumber,
        questions: examData.questions,
        signs: examData.signs,
        maquettes: examData.maquettes,
      };

      const { data, error } = await examService.upsertExam(payload);

      if (error) {
        throw error;
      }

      console.log('Persisted to DB:', data);
      alert('Changes saved to database successfully!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert(`Failed to save changes: ${error.message}`);
    }
  };

  return (
    <Page name="maquette" id="maquette-page" className="page-neu">
      <Navbar className="neu-navbar">
        <NavLeft>
          <NavHomeButton />
        </NavLeft>
        <NavTitle className="neu-text-primary" style={{ fontWeight: 700 }}>
          {`Proef Examen - File ${formatFileNumber(selectedFileNumber)}`}
        </NavTitle>
        <NavRight>
          <div
            className="neu-btn-circle"
            style={{
              width: "36px",
              height: "36px",
              marginRight: "8px",
              position: "relative",
            }}
            onClick={toggleZoom}
          >
            <Icon f7="zoom_in" style={{ fontSize: "18px", color: "var(--f7-theme-color)" }} />
            {zoomLevel !== 1 && (
              <span
                style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  fontSize: "9px",
                  fontWeight: "bold",
                  backgroundColor: "var(--app-primary-color)",
                  color: "white",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {Math.round(zoomLevel * 100) / 100}x
              </span>
            )}
          </div>
        </NavRight>
      </Navbar>

      {/* File selection buttons */}
      <CardFooter style={{ marginTop: "20px", padding: "10px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "5px",
          }}
        >
          {Array.from({ length: totalExams }, (_, i) => i + 1).map((num) => (
            <Button
              key={num}
              text={num.toString()}
              fill={selectedFileNumber === num}
              style={{
                backgroundColor:
                  selectedFileNumber === num
                    ? "var(--app-primary-color, #007bff)"
                    : "#e0e0e0",
                color: selectedFileNumber === num ? "white" : "black",
                width: "30px",
                height: "30px",
                margin: "2px",
                fontSize: "12px",
              }}
              onClick={() => handleFileSelect(num)}
            />
          ))}
        </div>
      </CardFooter>

      {loading && (
        <div
          style={{ textAlign: "center", padding: "2rem", fontSize: "1.2rem" }}
        >
          Loading...
        </div>
      )}

      <div
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: "top center",
          transition: "transform 0.3s ease",
          width: zoomLevel > 1 ? `${100 / zoomLevel}%` : "100%",
          margin: "0 auto",
        }}
      >
        {/* Render exam data - show all loaded data without exam functionality */}
        <div className="exam-container" style={{ padding: "1rem" }}>
          {/* Render questions */}
          <h2>Vragen</h2>
          {examData.questions.map((question, index) => {
            const correctAnswerText = question.a.find(
              (answer) => answer.score === 1
            )?.text;
            return (
              <QuestionComponent
                key={`question-${index}`}
                question={question.q}
                answers={question.a}
                correctAnswerText={correctAnswerText}
                onEditAnswer={(answer, answerIndex, section) => handleEditAnswer(answer, index, section)}
                isAdmin={canManageCurrentSchool}
              />
            );
          })}

          {/* Render signs */}
          <h2>Borden</h2>
          {examData.signs.map((sign, index) => {
            const correctAnswerText = sign.a.find(
              (answer) => answer.score === 1
            )?.text;
            return (
              <SignQuestionComponent
                key={`sign-${index}`}
                signQuestion={sign.q}
                answers={sign.a}
                correctAnswerText={correctAnswerText}
                onEditAnswer={(answer, answerIndex, section) => handleEditAnswer(answer, index, section)}
                onEditSign={() => handleEditSign(index)}
                isAdmin={canManageCurrentSchool}
              />
            );
          })}

          {/* Render maquettes */}
          <h2>Maquettes</h2>
          {examData.maquettes.map((maquette, index) => {
            const correctAnswerText = maquette.a.find(
              (answer) => answer.score === 1
            )?.text;
            return (
              <MaquettesComponent
                key={`maquette-${index}`}
                maquetteQuestion={maquette.q}
                answers={maquette.a}
                correctAnswerText={correctAnswerText}
                onEditAnswer={(answer, answerIndex, section) => handleEditAnswer(answer, index, section)}
                isAdmin={canManageCurrentSchool}
              />
            );
          })}
        </div>
      </div>

      {canManageCurrentSchool && (
        <Toolbar bottom>
          <div />
          <Button fill text="Save Changes" onClick={handleSaveToDatabase} />
          <div />
        </Toolbar>
      )}

      {/* Edit Answer Sheet */}
      {isEditSheetOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onClick={() => setIsEditSheetOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Edit Answer</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Text:</label>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  minHeight: '60px',
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Score:</label>
              <select
                value={editedScore}
                onChange={(e) => setEditedScore(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value={0}>0 (Incorrect)</option>
                <option value={1}>1 (Correct)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button fill color="red" text="Cancel" onClick={() => setIsEditSheetOpen(false)} />
              <Button fill color="green" text="Save" onClick={handleSaveAnswer} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Sign Image Sheet */}
      {isSignEditSheetOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onClick={() => setIsSignEditSheetOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Select Traffic Sign</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '10px',
              maxHeight: '60vh',
              overflowY: 'auto',
              padding: '10px',
            }}>
              {trafficSignsData.map((sign) => (
                <div
                  key={sign.id}
                  style={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    padding: '5px',
                    border: '2px solid transparent',
                    borderRadius: '5px',
                  }}
                  onClick={() => handleSelectSignImage(sign.image)}
                >
                  <img
                    src={sign.image}
                    alt={sign.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'contain',
                      margin: '0 auto',
                    }}
                  />
                  <div style={{ fontSize: '10px', marginTop: '5px' }}>
                    {sign.name}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '15px', textAlign: 'right' }}>
              <Button fill color="red" text="Cancel" onClick={() => setIsSignEditSheetOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <br />
      <br />
      <br />
      <br />
    </Page>
  );
};

export default MockExamsSequenced;
