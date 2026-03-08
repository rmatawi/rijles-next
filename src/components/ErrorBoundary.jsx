// components/ErrorBoundary.jsx - Simple error boundary
import React, { Component } from "react";
import {
  Page,
  Navbar,
  Block,
  Button,
  Card,
  CardContent,
  Icon,
} from "framework7-react";

// Import translations
import translations from "../i18n/translations.json";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  // Get translated text based on current language
  getTranslation = (key) => {
    // Get language from localStorage or default to 'nl'
    const language = localStorage.getItem('language') || 'nl';
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key; // Return key if translation not found
  }

  render() {
    if (this.state.hasError) {
      return (
        <Page>
          <Navbar title={this.getTranslation('errors.pageTitle')} />
          <Block>
            <Card>
              <CardContent className="text-align-center">
                <Icon
                  f7="exclamationmark_triangle"
                  size="48"
                  className="text-color-red margin-bottom"
                />
                <h2>{this.getTranslation('errors.title')}</h2>
                <p className="text-color-gray margin-bottom">
                  {this.getTranslation('errors.description')}
                </p>
                <Button
                  fill
                  onClick={() => window.location.reload()}
                  className="margin-bottom"
                >
                  {this.getTranslation('errors.refreshPage')}
                </Button>
                <Button onClick={() => this.setState({ hasError: false })}>
                  {this.getTranslation('errors.tryAgain')}
                </Button>
              </CardContent>
            </Card>
          </Block>
        </Page>
      );
    }

    return this.props.children;
  }
}
