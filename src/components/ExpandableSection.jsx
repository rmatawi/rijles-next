// components/ExpandableSection.jsx - Collapsible content sections
import React, { useState } from "react";
import { Card, CardContent, Icon, Button } from "framework7-react";

export const ExpandableSection = ({
  title,
  children,
  isExpandedByDefault = false,
  icon = "chevron_down",
  className = "",
  variant = "default", // default, info, warning, success
}) => {
  const [isExpanded, setIsExpanded] = useState(isExpandedByDefault);

  const getVariantStyles = () => {
    switch (variant) {
      case "info":
        return {
          headerClass: "bg-blue-light",
          iconColor: "text-color-blue",
          borderColor: "border-blue",
        };
      case "warning":
        return {
          headerClass: "bg-orange-light",
          iconColor: "text-color-orange",
          borderColor: "border-orange",
        };
      case "success":
        return {
          headerClass: "bg-green-light",
          iconColor: "text-color-green",
          borderColor: "border-green",
        };
      default:
        return {
          headerClass: "bg-gray-light",
          iconColor: "text-color-gray",
          borderColor: "border-gray",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={`expandable-section ${className} margin-bottom`}>
      <CardContent className="padding-0">
        {/* Header */}
        <div
          className={`padding display-flex align-items-center justify-content-space-between ${styles.headerClass}`}
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: "pointer" }}
        >
          <div className="display-flex align-items-center">
            <Icon
              f7={icon}
              size="16"
              className={`margin-right-half ${styles.iconColor}`}
            />
            <div className="font-weight-medium text-size-16">{title}</div>
          </div>

          <Icon
            f7={isExpanded ? "chevron_up" : "chevron_down"}
            size="16"
            className={`${styles.iconColor} transition-transform`}
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          />
        </div>

        {/* Expandable Content */}
        <div
          className={`expandable-content ${
            isExpanded ? "expanded" : "collapsed"
          }`}
          style={{
            // maxHeight: isExpanded ? "1000px" : "0px",
            // overflow: "hidden",
            transition: "max-height 0.3s ease-in-out",
          }}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
};

// Specialized expandable sections
export const InfoSection = ({ title, children, ...props }) => (
  <ExpandableSection title={title} variant="info" icon="info_circle" {...props}>
    {children}
  </ExpandableSection>
);

export const WarningSection = ({ title, children, ...props }) => (
  <ExpandableSection
    title={title}
    variant="warning"
    icon="exclamationmark_triangle"
    {...props}
  >
    {children}
  </ExpandableSection>
);

export const TipSection = ({ title, children, ...props }) => (
  <ExpandableSection
    title={title}
    variant="success"
    icon="lightbulb"
    {...props}
  >
    {children}
  </ExpandableSection>
);

export const ExampleSection = ({ title, children, ...props }) => (
  <ExpandableSection
    title={title}
    variant="default"
    icon="doc_text_viewfinder"
    {...props}
  >
    {children}
  </ExpandableSection>
);
