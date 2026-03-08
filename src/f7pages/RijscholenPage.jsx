import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  Button,
  Card,
  CardContent,
  Icon,
  Navbar,
  Page,
  f7,
  useStore,
  Searchbar,
  List,
  ListItem,
  NavLeft,
  NavTitle,
} from "framework7-react";
import { t } from "../i18n/translate";
import { normalizePhoneForWhatsApp } from "../services/adminContactService";
import { SEO } from "../js/seoUtils";
import { openExternalUrl } from "../utils/externalLinks";

const RijscholenPage = () => {
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, rating, experience
  const [favorites, setFavorites] = useState([]);

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("favoriteDrivingSchools");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("favoriteDrivingSchools", JSON.stringify(favorites));
  }, [favorites]);

  // Process and filter schools
  useEffect(() => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      schools = schools.filter(
        (school) =>
          school.name.toLowerCase().includes(query) ||
          school.fullName?.toLowerCase().includes(query) ||
          school.description?.toLowerCase().includes(query) ||
          school.address?.toLowerCase().includes(query) ||
          school.specialties?.some((spec) => spec.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    schools.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "experience":
          // Sort by experience years (if available)
          const aExp = parseInt(a.experience) || 0;
          const bExp = parseInt(b.experience) || 0;
          return bExp - aExp;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredSchools(schools);
  }, [searchQuery, sortBy]);

  const getAvatar = (schoolName) => {
    const avatars = {
      "Rijschool Klarex": "🚗",
      "Rijschool Pawiro H": "📚",
      "Rijschool Meu": "🎓",
      "Rijschool Kalicharan": "🏆",
      "Rotco's Rijschool": "⭐",
      "Rijschool Sheer Singh": "🎯",
      "Rijschool Toy": "🚙",
      "Rijschool A. Dhoen": "🚕",
      "Rijschool GYR": "🏁",
      "Rijschool Isaya": "✨",
    };
    return avatars[schoolName] || "🚗";
  };

  const getAvailability = (school) => {
    if (school.working_hours) {
      const today = new Date().getDay();
      const days = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const todayHours = school.working_hours[days[today]];
      return (
        todayHours && todayHours !== "Closed" && todayHours !== "Always open"
      );
    }
    return true;
  };

  const getWorkingHours = (school) => {
    if (!school.working_hours) return "Contact voor openingstijden";
    const entries = Object.entries(school.working_hours);
    const openDays = entries.filter(
      ([day, hours]) => hours && hours !== "Closed"
    ).length;
    return `${openDays} dagen per week geopend`;
  };

  const getRating = () => {
    return (Math.random() * (4.8 - 4.0) + 4.0).toFixed(1);
  };

  const toggleFavorite = (schoolId) => {
    if (favorites.includes(schoolId)) {
      setFavorites(favorites.filter((id) => id !== schoolId));
    } else {
      setFavorites([...favorites, schoolId]);
    }
  };

  const contactRijschool = (rijschool) => {
    // Use admin phone number for school contact
    let phoneNumber = null;

    if (Array.isArray(rijschool.admin_phone)) {
      phoneNumber = rijschool.admin_phone[0];
    } else if (
      rijschool.admin_phone &&
      rijschool.admin_phone !== "Contact via website"
    ) {
      phoneNumber = rijschool.admin_phone;
    }

    const normalizedPhone = normalizePhoneForWhatsApp(phoneNumber || "");

    if (normalizedPhone) {
      // Directly call the phone number
      window.location.href = `tel:${normalizedPhone}`;
    } else {
      // If no phone number, show contact information
      const contactInfo = [`Adres: ${rijschool.address}`];

      if (rijschool.email) {
        contactInfo.push(`Email: ${rijschool.email}`);
      }

      if (rijschool.website) {
        contactInfo.push(`Website: Beschikbaar`);
      }

      if (rijschool.facebook) {
        contactInfo.push(`Facebook: Beschikbaar`);
      }

      contactInfo.push(`Specialiteiten: ${rijschool.specialties.join(", ")}`);

      f7.dialog.alert(
        contactInfo.join("\n\n"),
        `Contactinformatie - ${rijschool.name}`
      );
    }
  };

  const openWebsite = (url) => {
    if (url) {
      openExternalUrl(url);
    }
  };

  const openFacebook = (url) => {
    if (url) {
      openExternalUrl(url);
    }
  };

  return (
    <Page name="rijscholen">
      <SEO page="rijscholen" />
      <Navbar>
        <NavLeft>
          <Button iconF7="arrow_left" href="/" />
        </NavLeft>
        <NavTitle>{t("nav.rijscholen")}</NavTitle>
      </Navbar>

      {/* Search and Filter Section */}
      <Block>
        <Searchbar
          placeholder="Zoek rijscholen..."
          value={searchQuery}
          onInput={(e) => setSearchQuery(e.target.value)}
          style={{ marginBottom: "16px" }}
        />

        <List inset>
          <ListItem
            title={t("school.sort")}
            smartSelect
            smartSelectParams={{
              openIn: "sheet",
              sheetPush: true,
              closeOnSelect: true,
            }}
          >
            <select
              name="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">{t("school.name")}</option>
              <option value="rating">{t("school.rating")}</option>
              <option value="experience">{t("school.experience")}</option>
            </select>
          </ListItem>
        </List>
      </Block>

      <BlockTitle>
        <h1 style={{ fontSize: '24px', margin: '0' }}>
          {filteredSchools.length} Rijscholen gevonden
          {favorites.length > 0 && ` (${favorites.length} favorieten)`}
        </h1>
      </BlockTitle>

      {filteredSchools && filteredSchools.length > 0 ? (
        filteredSchools.map((rijschool) => (
          <Card key={rijschool.id}>
            <CardContent>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-gray-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "10px",
                    fontSize: "24px",
                  }}
                >
                  {rijschool.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 5px 0" }}>{rijschool.name}</h3>
                  <p style={{ margin: "0", fontSize: "14px", opacity: "0.7" }}>
                    {rijschool.experience} ervaring
                  </p>
                </div>
                <Button
                  iconF7={
                    favorites.includes(rijschool.id) ? "heart_fill" : "heart"
                  }
                  iconColor={favorites.includes(rijschool.id) ? "red" : "gray"}
                  onClick={() => toggleFavorite(rijschool.id)}
                />
              </div>
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "5px",
                  }}
                >
                  <Icon
                    f7="star_fill"
                    size="16"
                    color="orange"
                    style={{ marginRight: "5px" }}
                  />
                  <span>{rijschool.rating} beoordeling</span>
                  {rijschool.available && (
                    <Icon
                      f7="checkmark_circle_fill"
                      size="16"
                      color="green"
                      style={{ marginLeft: "10px" }}
                    />
                  )}
                </div>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  <strong>Adres:</strong> {rijschool.address}
                </p>
                <p style={{ margin: "5px 0", fontSize: "14px" }}>
                  {rijschool.description}
                </p>
                {rijschool.established && (
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Opgericht:</strong> {rijschool.established}
                  </p>
                )}
                {rijschool.owner && (
                  <p style={{ margin: "5px 0", fontSize: "14px" }}>
                    <strong>Eigenaar:</strong> {rijschool.owner}
                  </p>
                )}
                <p style={{ margin: "5px 0" }}>
                  <strong>Specialiteiten:</strong>{" "}
                  {rijschool.specialties?.join(", ") || "Geen opgegeven"}
                </p>
                <p style={{ margin: "5px 0" }}>
                  <strong>Openingstijden:</strong> {rijschool.workingHours}
                </p>
                {(rijschool.website || rijschool.facebook) && (
                  <div
                    style={{ margin: "10px 0", display: "flex", gap: "10px" }}
                  >
                    {rijschool.website && (
                      <Button
                        small
                        outline
                        color="blue"
                        onClick={() => openWebsite(rijschool.website)}
                      >
                        Website
                      </Button>
                    )}
                    {rijschool.facebook && (
                      <Button
                        small
                        outline
                        color="blue"
                        onClick={() => openFacebook(rijschool.facebook)}
                      >
                        Facebook
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Button
                  round
                  fill
                  color="blue"
                  onClick={() => contactRijschool(rijschool)}
                  style={{ width: "100%" }}
                >
                  <Icon f7="phone" slot="start" />
                  Bel Nu
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Icon f7="magnifyingglass" size="50" color="gray" />
              <p>Geen rijscholen gevonden met uw zoekcriteria.</p>
              <p>Probeer een andere zoekterm of verwijder filters.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </Page>
  );
};

export default RijscholenPage;
