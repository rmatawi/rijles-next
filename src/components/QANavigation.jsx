import { Page, List, ListItem } from "framework7-react";

const QANavigation = ({ qaData, onScrollToCategory }) => {

  // Get all categories from qaData (new structure)
  const categories = qaData ? qaData.categories || [] : [];

  return (
    <Page>
      {/* Navigation List */}
      <List noHairlines>
        {categories.map((category, index) => (
          <ListItem
            link="#"
            key={index}
            title={category.name}
            iconF7="question_circle_fill"
            onClick={() => {
              if (onScrollToCategory) {
                onScrollToCategory(index);
              }
            }}
          />
        ))}
      </List>
    </Page>
  );
};

export default QANavigation;
