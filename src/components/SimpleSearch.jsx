// components/SimpleSearch.jsx - Search functionality component
import React, { useState } from "react";
import {
  Sheet,
  Toolbar,
  Link,
  Block,
  Card,
  CardContent,
  Searchbar,
  List,
  ListItem,
  Icon,
  Badge,
} from "framework7-react";
import { useI18n } from "../i18n/i18n";

export const SimpleSearch = ({ data, onResults, isOpen, onClose }) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      onResults([]);
      return;
    }

    setIsSearching(true);
    const results = [];

    try {
      if (Array.isArray(data)) {
        data.forEach((section, index) => {
          const title =
            section.title_01 ||
            section.title_02 ||
            section.title_03 ||
            `Section ${index + 1}`;

          if (title.toLowerCase().includes(term.toLowerCase())) {
            results.push({
              type: "title",
              title: title.replace(/^#+\s*/, ""),
              content: "Hoofdstuk titel",
              section: index,
              relevance: title.toLowerCase().indexOf(term.toLowerCase()),
            });
          }

          if (section.content && Array.isArray(section.content)) {
            section.content.forEach((paragraph, pIndex) => {
              if (paragraph.toLowerCase().includes(term.toLowerCase())) {
                results.push({
                  type: "content",
                  title: title.replace(/^#+\s*/, ""),
                  content:
                    paragraph.length > 150
                      ? paragraph.substring(0, 150) + "..."
                      : paragraph,
                  section: index,
                  paragraph: pIndex,
                  relevance: paragraph
                    .toLowerCase()
                    .indexOf(term.toLowerCase()),
                });
              }
            });
          }
        });
      } else if (typeof data === "object") {
        Object.entries(data).forEach(([key, value]) => {
          if (
            [
              "title",
              "subtitle",
              "author",
              "year",
              "isbn",
              "approval",
            ].includes(key)
          ) {
            return;
          }

          const sectionTitle = key.replace(/_/g, " ");

          if (sectionTitle.toLowerCase().includes(term.toLowerCase())) {
            results.push({
              type: "section",
              title: sectionTitle,
              content: "Sectie naam",
              section: key,
              relevance: sectionTitle.toLowerCase().indexOf(term.toLowerCase()),
            });
          }

          const searchInValue = (val, path = "") => {
            if (
              typeof val === "string" &&
              val.toLowerCase().includes(term.toLowerCase())
            ) {
              results.push({
                type: "content",
                title: sectionTitle,
                content: val.length > 150 ? val.substring(0, 150) + "..." : val,
                section: key,
                path: path,
                relevance: val.toLowerCase().indexOf(term.toLowerCase()),
              });
            } else if (typeof val === "object" && val !== null) {
              Object.entries(val).forEach(([subKey, subVal]) => {
                searchInValue(subVal, path ? `${path}.${subKey}` : subKey);
              });
            }
          };

          searchInValue(value);
        });
      }

      results.sort((a, b) => a.relevance - b.relevance);
      setSearchResults(results.slice(0, 20));
      onResults(results.slice(0, 20));
    } catch (error) {
      console.warn("Search error:", error);
      setSearchResults([]);
      onResults([]);
    }

    setIsSearching(false);
  };

  const handleSearchInput = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    setTimeout(() => {
      if (term === e.target.value) {
        performSearch(term);
      }
    }, 300);
  };

  const handleClear = () => {
    setSearchTerm("");
    setSearchResults([]);
    onResults([]);
  };

  return (
    <Sheet opened={isOpen} onSheetClosed={onClose} swipeToClose backdrop>
      <Toolbar>
        <div className="left">
          <Link sheetClose>Sluiten</Link>
        </div>
        <div className="right">
          <div className="font-weight-semibold">Zoeken</div>
        </div>
      </Toolbar>

      <div className="page-content">
        <Block>
          <Searchbar
            placeholder="Zoek in het boek..."
            value={searchTerm}
            onInput={handleSearchInput}
            onClear={handleClear}
            className="margin-bottom"
          />

          {isSearching && (
            <Card>
              <CardContent className="text-align-center">
                <Icon
                  f7="arrow_2_circlepath"
                  size="24"
                  className="margin-bottom"
                />
                <div className="text-size-14">Zoeken...</div>
              </CardContent>
            </Card>
          )}

          {searchResults.length > 0 && (
            <Card>
              <CardContent>
                <div className="display-flex align-items-center justify-content-space-between margin-bottom">
                  <h3>{t('search.searchResults')}</h3>
                  <Badge color="blue">{searchResults.length}</Badge>
                </div>
                <List>
                  {searchResults.map((result, index) => (
                    <ListItem key={index}>
                      <div slot="media">
                        <Icon
                          f7={
                            result.type === "title"
                              ? "textformat_size"
                              : result.type === "section"
                              ? "folder"
                              : "doc_text"
                          }
                          size="20"
                          className={`text-color-${
                            result.type === "title"
                              ? "blue"
                              : result.type === "section"
                              ? "green"
                              : "gray"
                          }`}
                        />
                      </div>
                      <div slot="title" className="font-weight-medium">
                        {result.title}
                      </div>
                      <div slot="subtitle" className="text-size-12">
                        {result.content}
                      </div>
                      <div slot="after">
                        <Badge
                          color={
                            result.type === "title"
                              ? "blue"
                              : result.type === "section"
                              ? "green"
                              : "orange"
                          }
                        >
                          {result.type === "title"
                            ? "Titel"
                            : result.type === "section"
                            ? "Sectie"
                            : "Tekst"}
                        </Badge>
                      </div>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {searchTerm.length > 2 &&
            searchResults.length === 0 &&
            !isSearching && (
              <Card>
                <CardContent>
                  <div className="text-align-center text-color-gray">
                    <Icon f7="search" size="48" className="margin-bottom" />
                    <div>Geen resultaten gevonden voor "{searchTerm}"</div>
                    <div className="text-size-12 margin-top">
                      Probeer andere zoektermen
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <Card>
              <CardContent>
                <div className="text-align-center text-color-gray">
                  <Icon
                    f7="textformat_abc"
                    size="48"
                    className="margin-bottom"
                  />
                  <div>Typ minstens 2 karakters om te zoeken</div>
                </div>
              </CardContent>
            </Card>
          )}
        </Block>
      </div>
    </Sheet>
  );
};