import React from "react";
import {
  f7,
  useStore,
} from "framework7-react";
import GenericListPage from "../components/GenericListPage.jsx";

const InsurancePage = () => {
  const insurances = useStore("insuranceProviders") || [];
  const categories = useStore("insuranceCategories") || [];

  const handleAddInsurance = () => {
    f7.dialog.alert(
      "Deze functie is nog in ontwikkeling. Kom snel terug!",
      "Binnenkort beschikbaar"
    );
  };

  const handleContact = (insurance) => {
    if (insurance.phone) {
      window.location.href = `tel:${insurance.phone}`;
    } else {
      f7.dialog.alert(
        "Contactgegevens niet beschikbaar. Zoek online naar het bedrijf voor actuele contactinformatie.",
        "Contact informatie"
      );
    }
  };

  return (
    <GenericListPage
      pageName="insurance"
      title="Verzekeringen"
      items={insurances}
      categories={categories}
      onAddItem={handleAddInsurance}
      onContact={handleContact}
      onAddItemText="Verzekering Toevoegen"
      getItemIcon={(insurance) => insurance.icon}
      getItemName={(insurance) => insurance.name}
      getItemDescription={(insurance) => insurance.description}
      getItemAddress={(insurance) => insurance.address}
      getItemRating={(insurance) => insurance.rating}
      showCategoryFilter={true}
      categoryFilterType="buttons"
      showAddButton={true}
      emptyStateMessage="Geen verzekeringen gevonden"
      emptyStateSubMessage="Probeer een andere zoekterm of categorie"
      getItemId={(insurance) => insurance.id}
    />
  );
};

export default InsurancePage;