import React, { useState } from "react";
import {
  Sheet,
  Page,
  Navbar,
  NavTitle,
  NavRight,
  PageContent,
  Block,
  BlockTitle,
  Card,
  CardContent,
  List,
  ListItem,
  Preloader,
  f7,
  Icon,
} from "framework7-react";
import { studentService } from "../services/studentService";

const StudentWhatsAppHistorySheet = () => {
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDateTime = (dateString) => {
    if (!dateString) return "Onbekende datum";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return String(dateString);

    return new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const normalizeHistory = (value) => {
    const raw = Array.isArray(value) ? value : [];
    return [...raw].sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
  };

  const loadHistory = async (studentData) => {
    if (!studentData?.id) {
      setStudent(studentData || null);
      setHistory([]);
      return;
    }

    setLoading(true);
    setError("");
    setStudent(studentData);

    try {
      const { data, error: fetchError } = await studentService.getStudentById(studentData.id);
      if (fetchError) {
        throw fetchError;
      }

      setStudent((prev) => ({ ...(prev || {}), ...(data || {}) }));
      setHistory(normalizeHistory(data?.whatsapp_template_history));
    } catch (err) {
      console.error("Error loading WhatsApp history:", err);
      setHistory(normalizeHistory(studentData?.whatsapp_template_history));
      setError(err?.message || "Kon WhatsApp geschiedenis niet laden");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    window.openStudentWhatsAppHistorySheet = (studentData) => {
      loadHistory(studentData);
      f7.sheet.open(".student-whatsapp-history-sheet");
    };

    return () => {
      delete window.openStudentWhatsAppHistorySheet;
    };
  }, []);

  const handleClose = () => {
    f7.sheet.close(".student-whatsapp-history-sheet");
    setTimeout(() => {
      setStudent(null);
      setHistory([]);
      setLoading(false);
      setError("");
    }, 300);
  };

  return (
    <Sheet
      className="student-whatsapp-history-sheet"
      style={{ height: "70vh" }}
      swipeToClose
      backdrop
      onSheetClosed={handleClose}
    >
      <Page>
        <Navbar>
          <NavTitle>
            {student?.name ? `${student.name} - WhatsApp historie` : "WhatsApp historie"}
          </NavTitle>
          <NavRight>
            <div
              className="neu-btn-circle sheet-close"
              style={{ width: "36px", height: "36px", marginRight: "8px", cursor: "pointer" }}
            >
              <Icon f7="xmark" style={{ fontSize: "18px" }} />
            </div>
          </NavRight>
        </Navbar>

        <PageContent>
          {loading && (
            <Block className="text-align-center">
              <Preloader />
              <p>Laden...</p>
            </Block>
          )}

          {!loading && error && (
            <Block strong inset style={{ color: "var(--color-red)" }}>
              {error}
            </Block>
          )}

          {!loading && (
            <>
              <BlockTitle>Template geschiedenis</BlockTitle>
              {history.length === 0 ? (
                <Block strong inset style={{ color: "var(--color-gray-text)" }}>
                  Nog geen WhatsApp templates verstuurd voor deze student.
                </Block>
              ) : (
                <List strong inset mediaList>
                  {history.map((entry, index) => (
                    <ListItem
                      key={`${entry?.date || "no-date"}-${index}`}
                      title={entry?.templateTitle || "Onbekende template"}
                      after={formatDateTime(entry?.date)}
                      subtitle={entry?.adminName || "Onbekende admin"}
                    />
                  ))}
                </List>
              )}

              {!loading && history.length > 0 && (
                <Block>
                  <Card>
                    <CardContent style={{ fontSize: "12px", color: "var(--color-gray-text)" }}>
                      Totaal: {history.length} verstuurde template
                      {history.length === 1 ? "" : "s"}.
                    </CardContent>
                  </Card>
                </Block>
              )}
            </>
          )}
        </PageContent>
      </Page>
    </Sheet>
  );
};

export default StudentWhatsAppHistorySheet;
