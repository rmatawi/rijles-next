import React, { useState, useEffect } from "react";
import {
  Block,
  BlockTitle,
  Button,
  Card,
  CardContent,
  Icon,
  List,
  ListInput,
  ListItem,
  NavLeft,
  NavTitle,
  Navbar,
  Page,
  Searchbar,
  f7,
} from "framework7-react";
import { useI18n } from "../i18n/i18n";

const GenericListPage = ({
  pageName,
  title,
  items = [],
  categories = [],
  onAddItem,
  onContact,
  onAddItemText = "Item Toevoegen",
  getItemIcon = () => "wrench_fill",
  getItemName = (item) => item.name,
  getItemDescription = (item) => item.description,
  getItemAddress = (item) => item.address,
  getItemRating = (item) => item.rating,
  getItemSpecialties = (item) => item.specialities || item.specialties,
  getItemOpeningHours = (item) => item.openingstijden || item.workingHours,
  getItemWebsite = (item) => item.website,
  getItemWhatsapp = (item) => item.whatsapp,
  showCategoryFilter = true,
  categoryFilterType = "buttons", // 'buttons', 'select', 'checkbox'
  showAddButton = true,
  emptyStateMessage = "Geen items gevonden",
  emptyStateSubMessage = "Probeer een andere zoekterm of categorie",
  getItemId = (item) => item.id,
}) => {
  const [filteredItems, setFilteredItems] = useState(items);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { t } = useI18n();

  useEffect(() => {
    let result = items;

    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const name = getItemName(item) ? getItemName(item).toLowerCase() : "";
        const description = getItemDescription(item)
          ? getItemDescription(item).toLowerCase()
          : "";
        const address = getItemAddress(item)
          ? getItemAddress(item).toLowerCase()
          : "";
        const specialties = getItemSpecialties(item);
        const specialtiesText = Array.isArray(specialties)
          ? specialties.join(" ").toLowerCase()
          : (specialties || "").toLowerCase();

        // Check if item has services array and search through it
        const services = item.diensten || item.services;
        const servicesText = Array.isArray(services)
          ? services.join(" ").toLowerCase()
          : "";

        return (
          name.includes(query) ||
          description.includes(query) ||
          address.includes(query) ||
          specialtiesText.includes(query) ||
          servicesText.includes(query)
        );
      });
    }

    setFilteredItems(result);
  }, [searchQuery, selectedCategory, items]);

  const handleContact = (item) => {
    if (onContact) {
      onContact(item);
    } else {
      const phone = item.phone || item.telefoon;
      if (phone) {
        window.location.href = `tel:${phone}`;
      } else {
        f7.dialog.alert(
          "Contactgegevens niet beschikbaar. Zoek online naar het bedrijf voor actuele contactinformatie.",
          "Contact informatie"
        );
      }
    }
  };

  const renderCategoryFilter = () => {
    if (!showCategoryFilter || categories.length === 0) return null;

    switch (categoryFilterType) {
      case "buttons":
        return (
          <Block>
            <div
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "10px",
                padding: "10px 0",
              }}
            >
              {categories.map((category) => (
                <Button
                  key={category.id}
                  round
                  outline
                  small
                  active={selectedCategory === category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{ whiteSpace: "nowrap" }}
                >
                  <Icon f7={category.icon} slot="start" size="16" />
                  {category.name}
                </Button>
              ))}
              <Button
                round
                outline
                small
                active={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
                style={{ whiteSpace: "nowrap" }}
              >
                <Icon f7="list_bullet" slot="start" size="16" />
                Alle Categorieën
              </Button>
            </div>
          </Block>
        );

      case "select":
        return (
          <List>
            <ListInput
              outline
              type="select"
              placeholder="Categorie"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Alle Categorieën</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </ListInput>
          </List>
        );

      case "checkbox":
        return (
          <Block>
            <BlockTitle>{t('categories.alleCategorieen')}</BlockTitle>
            <List>
              <ListItem
                title="Alle categorieën"
                checkbox
                checked={selectedCategory === "all"}
                onChange={() => setSelectedCategory("all")}
              />
              {categories.map((category) => (
                <ListItem
                  key={category.id}
                  title={category.name}
                  checkbox
                  checked={selectedCategory === category.id}
                  onChange={() => setSelectedCategory(category.id)}
                />
              ))}
            </List>
          </Block>
        );

      default:
        return null;
    }
  };

  const renderItems = () => {
    if (filteredItems.length === 0) {
      return (
        <Card>
          <CardContent>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Icon
                f7="binoculars"
                size="48"
                color="gray"
                style={{ marginBottom: "10px" }}
              />
              <p>{emptyStateMessage}</p>
              <p style={{ fontSize: "14px", opacity: "0.7" }}>
                {emptyStateSubMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <List strong inset dividersIos>
        {filteredItems.map((item) => (
          <ListItem key={getItemId(item)} noChevron>
            <Icon
              slot="media"
              f7={getItemIcon(item)}
              size="24"
              color="blue"
              style={{ marginRight: "10px" }}
            />
            <div slot="inner">
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {getItemName(item)}
              </div>
              <div style={{ fontSize: "14px", marginBottom: "4px" }}>
                {getItemDescription(item)}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  opacity: "0.7",
                  marginBottom: "4px",
                }}
              >
                <Icon f7="location" size="12" style={{ marginRight: "4px" }} />
                {getItemAddress(item)}
              </div>
              {getItemOpeningHours(item) && (
                <div
                  style={{
                    fontSize: "12px",
                    opacity: "0.6",
                    marginBottom: "4px",
                  }}
                >
                  <Icon f7="clock" size="12" style={{ marginRight: "4px" }} />
                  {getItemOpeningHours(item)}
                </div>
              )}
              {getItemSpecialties(item) && (
                <div
                  style={{
                    fontSize: "12px",
                    marginBottom: "4px",
                    color: "var(--app-primary-color)",
                  }}
                >
                  <Icon f7="star" size="12" style={{ marginRight: "4px" }} />
                  {Array.isArray(getItemSpecialties(item))
                    ? getItemSpecialties(item).join(", ")
                    : getItemSpecialties(item)}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  {getItemRating(item) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginRight: "8px",
                      }}
                    >
                      <Icon
                        f7="star_fill"
                        size="14"
                        color="orange"
                        style={{ marginRight: "4px" }}
                      />
                      <span>{getItemRating(item)}</span>
                    </div>
                  )}
                  {getItemWhatsapp(item) && (
                    <Icon
                      f7="logo_whatsapp"
                      size="14"
                      color="green"
                      style={{ marginLeft: "8px" }}
                    />
                  )}
                  {getItemWebsite(item) && (
                    <Icon
                      f7="globe"
                      size="14"
                      color="blue"
                      style={{ marginLeft: "4px" }}
                    />
                  )}
                </div>
                <Button
                  round
                  small
                  onClick={() => handleContact(item)}
                  style={{ marginLeft: "10px" }}
                  color="blue"
                >
                  <Icon f7="phone_fill" slot="start" size="14" />
                  Bel
                </Button>
              </div>
            </div>
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Page name={pageName}>
      <Navbar>
        <NavLeft>
          <Button iconF7="arrow_left" href="/" />
        </NavLeft>
        <NavTitle>{title}</NavTitle>
      </Navbar>

      <Searchbar
        placeholder={`Zoek ${title.toLowerCase()}...`}
        disableButton={!searchQuery}
        onInput={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery("")}
      />

      {renderCategoryFilter()}

      {showAddButton && onAddItem && (
        <Block>
          <Button fill round onClick={onAddItem}>
            <Icon f7="plus" slot="start" />
            {onAddItemText}
          </Button>
        </Block>
      )}

      <BlockTitle>
        {selectedCategory === "all"
          ? `${t('common.allCategories')} ${title}`
          : (categories.find((c) => c.id === selectedCategory) || {}).name ||
            `${t('common.allCategories')} ${title}`}
        <span
          style={{ float: "right", fontSize: "14px", fontWeight: "normal" }}
        >
          {filteredItems.length} {t('common.found') || "gevonden"}
        </span>
      </BlockTitle>

      {renderItems()}
    </Page>
  );
};

export default GenericListPage;
