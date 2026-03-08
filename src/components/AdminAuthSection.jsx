import { useState, useEffect } from "react";
import {
  Block,
  Card,
  CardContent,
  Button,
  Icon,
  ListInput,
  List,
  ListItem,
  CardFooter,
} from "framework7-react";
import { f7 } from "framework7-react";
import { authService, schoolService } from "../services";
import store from "../js/store";
import { useI18n } from "../i18n/i18n";

const AdminAuthSection = ({ handleSignIn, handleSignUp, noUser }) => {
  if (!noUser) return null;

  const { t } = useI18n();
  const [isSignUp, setIsSignUp] = useState(false);
  const [pickedSchool, setPickedSchool] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch schools from the database
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await schoolService.getSchools();
        if (error) {
          console.error("Error fetching schools:", error);
          setSchools([]);
        } else {
          setSchools(data || []);
        }
      } catch (err) {
        console.error("Error fetching schools:", err);
        setSchools([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await authService.signInWithGoogle();

      if (error) {
        f7.toast.show({ text: `Google sign-in failed: ${error.message}` });
        return;
      }

      // The OAuth flow will redirect the user, so we don't need to do anything here
      // The user will be redirected back to the app after authentication
    } catch (error) {
      f7.preloader.hide();
      f7.toast.show({ text: "Google sign-in failed. Please try again." });
    }
  };

  // Handle sign up button click
  const handleSignUpClick = () => {
    // Add newAdmin:true to localStorage
    localStorage.setItem("newAdmin", "true");
    // Add newSchool:whatever_user_entered to localStorage
    if (pickedSchool) {
      localStorage.setItem("newSchool", pickedSchool.name);
    } else if (schoolName && schoolName.length > 5) {
      localStorage.setItem("newSchool", schoolName);
    }

    // Navigate to auth page using Framework7 router
    // f7.views.main.router.navigate("/auth/");
    handleGoogleSignIn();
  };

  return (
    <Block style={{ margin: "16px" }}>
      <Block style={{ display: isSignUp ? "block" : "none" }}>
        <h2 style={{ textAlign: "center" }} slot="title">
          Voeg een School toe
        </h2>
        <List>
          {/* onchange should effect name */}
          <ListInput
            outline
            label="name"
            placeholder="name"
            value={schoolName}
            onChange={(e) => {
              setSchoolName(e.target.value);
              setPickedSchool(null);
            }}
          />
          {/* 
          To speed signup up we'll allow to do description, logo_url, cover_image_url afterwards.
          We don't have an admin_id yet to add the record to drv_schools so let's store name in localStorage.
          */}
        </List>
        <h2 style={{ textAlign: "center" }} slot="title">
          Of Kies een school
        </h2>
        {/*
        table drv_schools (
          admin_id uuid null,
          name text not null,
          description text null,
          logo_url text null,
          cover_image_url text null
        ) TABLESPACE pg_default;
      */}
        <List inset strong>
          {/* populate schools from table*/}
          {loading ? (
            <ListItem title={t('adminRequest.loadingSchools')} />
          ) : schools.length > 0 ? (
            schools.map((school) => (
              <ListItem
                key={school.id}
                outline
                title={school.name}
                link="#"
                onClick={() => {
                  setSchoolName("");
                  setPickedSchool(school);
                }}
              />
            ))
          ) : (
            <ListItem title="No schools available" />
          )}
        </List>
        {/* Content below should appear after picking a school or when schoolname is entered and > 5 characters*/}
      </Block>
      <Card
        style={{
          display: isSignUp
            ? pickedSchool || (schoolName && schoolName.length > 5)
              ? "block"
              : "none"
            : "block",
        }}
      >
        <CardContent>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Icon
              f7="person"
              size="60"
              color="blue"
              style={{ marginBottom: "20px" }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              {/* <h2>Al een Account?</h2> */}
              <Button
                fill
                large
                color="blue"
                text="Log In with Google"
                onClick={() => {
                  localStorage.setItem("adminLoginAttempt", "true");
                  // Clear any localStorage settings from potential previous sign-up attempts
                  localStorage.removeItem("newAdmin");
                  localStorage.removeItem("newSchool");
                  handleGoogleSignIn();
                }}
              >
                <Icon f7="logo_google" slot="start" />
              </Button>
            </div>
            <p style={{ color: "var(--color-gray-text)", marginTop: "20px", fontSize: "14px" }}>
              Note: Currently, only Google Sign-In is supported.
            </p>
          </div>
        </CardContent>
      </Card>
    </Block>
  );
};

export default AdminAuthSection;
