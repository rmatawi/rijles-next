import React from "react";
import {
  f7,
} from "framework7-react";
import { auto_bedrijven_paramaribo } from "../js/auto_bedrijven_paramaribo.js";
import GenericListPage from "../components/GenericListPage.jsx";
import { SEO } from "../js/seoUtils";

const ServicesPage = () => {
  const getCategoryIcon = (categoryKey) => {
    const icons = {
      autoreparatiebedrijven: "wrench_fill",
      auto_onderdelen_winkels: "gear_alt_fill",
      auto_accessoires_winkels: "car_fill",
      bandenwinkels: "circle_fill",
      autowasserettes: "drop_triangle_fill",
      autodealers: "car_detailed_fill",
      auto_elektronica_audio: "speaker_3_fill",
    };
    return icons[categoryKey] || "wrench_fill";
  };

  const getCategoryName = (categoryKey) => {
    const names = {
      autoreparatiebedrijven: "Auto Reparatie",
      auto_onderdelen_winkels: "Onderdelen",
      auto_accessoires_winkels: "Accessoires",
      bandenwinkels: "Banden Service",
      autowasserettes: "Car Wash",
      autodealers: "Auto Dealers",
      auto_elektronica_audio: "Audio & Elektronica",
    };
    return names[categoryKey] || categoryKey;
  };

  const getServiceIcon = (categoryKey) => {
    return getCategoryIcon(categoryKey);
  };

  const getRating = () => {
    return (Math.random() * (4.8 - 3.5) + 3.5).toFixed(1);
  };

  const getPhone = (business) => {
    const excludedPhoneValues = [
      "Beschikbaar via website",
      "Beschikbaar via Facebook",
      "Beschikbaar via Google Maps",
      "Beschikbaar via business directory",
      "Bel voor info"
    ];
    
    if (business.telefoon && !excludedPhoneValues.includes(business.telefoon)) {
      return business.telefoon;
    }
    if (business.whatsapp) {
      return business.whatsapp;
    }
    return null; // Return null for absent contact info
  };

  // Convert auto businesses to services format and filter out those with absent contact info
  const allServices = [];
  let serviceId = 1;

  Object.entries(
    auto_bedrijven_paramaribo.auto_bedrijven_paramaribo.categorieën
  ).forEach(([categoryKey, businesses]) => {
    businesses.forEach((business) => {
      const phone = getPhone(business);
      // Only add businesses with valid contact info
      if (phone !== null) {
        allServices.push({
          id: serviceId++,
          name: business.naam,
          description:
            business.beschrijving ||
            business.specialiteiten ||
            "Auto service bedrijf",
          address: business.adres,
          phone: phone,
          category: categoryKey,
          icon: getServiceIcon(categoryKey),
          rating: getRating(),
          website: business.website,
          email: business.email,
          whatsapp: business.whatsapp,
          openingstijden: business.openingstijden,
          diensten: business.diensten,
          producten: business.producten,
          specialiteiten: business.specialiteiten,
        });
      }
    });
  });

  const categories = Object.keys(
    auto_bedrijven_paramaribo.auto_bedrijven_paramaribo.categorieën
  ).map((categoryKey) => ({
    id: categoryKey,
    name: getCategoryName(categoryKey),
    icon: getCategoryIcon(categoryKey),
  }));

  const handleAddService = () => {
    f7.dialog.alert(
      "Deze functie is nog in ontwikkeling. Kom snel terug!",
      "Binnenkort beschikbaar"
    );
  };

  const handleContact = (service) => {
    if (service.phone) {
      window.location.href = `tel:${service.phone}`;
    } else {
      f7.dialog.alert(
        "Contactgegevens niet beschikbaar. Zoek online naar het bedrijf voor actuele contactinformatie.",
        "Contact informatie"
      );
    }
  };

  return (
    <>
      <SEO page="services" />
      <GenericListPage
        pageName="services"
        title="Auto Services"
        items={allServices}
        categories={categories}
        onAddItem={handleAddService}
        onContact={handleContact}
        onAddItemText="Service Toevoegen"
        getItemIcon={(service) => service.icon}
        getItemName={(service) => service.name}
        getItemDescription={(service) => service.description}
        getItemAddress={(service) => service.address}
        getItemRating={(service) => service.rating}
        getItemSpecialties={(service) => service.specialiteiten}
        getItemOpeningHours={(service) => service.openingstijden}
        getItemWebsite={(service) => service.website}
        getItemWhatsapp={(service) => service.whatsapp}
        showCategoryFilter={true}
        categoryFilterType="select"
        showAddButton={true}
        emptyStateMessage="Geen services gevonden"
        emptyStateSubMessage="Probeer een andere zoekterm of categorie"
        getItemId={(service) => service.id}
      />
    </>
  );
};

export default ServicesPage;
