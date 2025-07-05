import React, { useState } from "react";
import { 
  Card, 
  CardBody, 
  CardHeader,
  Button,
  Chip as UIChip
} from "@heroui/react"; // COPILOT REMOVE NOTES: Removed Textarea import
import { Icon } from "@iconify/react";
import { SearchResult } from "../api/profileSearch";
import "./ProspectDetailsCard.css";

// Interface for the component props
interface ProspectDetailsCardProps {
  prospect: SearchResult;
  onClose?: () => void;
}

// Removed collapsible component as it's no longer needed

// COPILOT REMOVE NOTES: Removed AutoSaveTextarea component as it's no longer needed

// MatchBadge component
const MatchBadge: React.FC<{value: number}> = ({ value }) => {
  const color = value > 90 ? "success" : value > 80 ? "primary" : "warning";
  const ariaLabel = `${value}% match confidence`;
  
  return (
    <UIChip
      color={color}
      variant="flat"
      size="sm"
      className="font-medium ml-2"
      aria-label={ariaLabel}
      data-testid="match-badge"
    >
      {value}% Match
    </UIChip>
  );
};

// COPILOT FIX PD-CONTACT
// Removed ChipGroup and Chip components as they're replaced by the contact list

const ProspectDetailsCard: React.FC<ProspectDetailsCardProps> = ({ prospect, onClose }) => {
  // Function to copy text to clipboard
  const copy = (text: string) => () => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // You could add a toast notification here
        alert(`Copied: ${text}`);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Define contact items for the list
  const contactItems = [
    prospect.email && { 
      icon: <Icon icon="lucide:mail" className="text-gray-500" aria-hidden="true" />, 
      label: prospect.email, 
      onClick: copy(prospect.email),
      type: "email"
    },
    prospect.phone && { 
      icon: <Icon icon="lucide:phone" className="text-gray-500" aria-hidden="true" />, 
      label: prospect.phone, 
      onClick: copy(prospect.phone),
      type: "phone"
    },
    prospect.linkedInUrl && {
      icon: <Icon icon="logos:linkedin-icon" className="text-gray-500" aria-hidden="true" />,
      label: "View on LinkedIn",
      onClick: () => window.open(prospect.linkedInUrl, '_blank'),
      type: "linkedin",
      isLink: true,
      url: prospect.linkedInUrl
    }
  ].filter(Boolean);

  // COPILOT REMOVE NOTES: Removed updateProspectNotes function

  return (
    <Card className="prospect-details-card shadow-soft" data-testid="prospect-details-card">
      <CardBody>
        {/* COPILOT FIX PD-HEAD */}
        <div className="headline-block" data-testid="prospect-headline-block">
          <div className="title-line"          data-testid="prospect-title-line">
            <div className="flex justify-between items-center w-full">
              <h2 className="name">
                {prospect.name}
                {/* COPILOT FIX GAP-TITLE - Match badge inline with name */}
                <MatchBadge value={prospect.confidence} />
              </h2>
              {onClose && (
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={onClose}
                  className="ml-auto"
                  aria-label="Close prospect details"
                >
                  <Icon icon="lucide:x" aria-hidden="true" />
                </Button>
              )}
            </div>
            {/* COPILOT FIX GAP-TITLE - Job title directly under name with reduced spacing */}
            <p className="job-title">
              {prospect.jobTitle} at {prospect.company}
            </p>
          </div>
        </div>
        
        {/* COPILOT FIX GAP-CONTACT */}
        <div className="contact-list" data-testid="prospect-contact-list">
          <h3 className="text-sm font-semibold text-gray-500">Contact Information</h3>
          {/* Reduced spacing between items for more compact presentation */}
          {contactItems.map((item: any) => (
            <div 
              key={item.type}
              className="contact-item"
              onClick={item.isLink ? undefined : item.onClick}
              role="button"
              tabIndex={0}
              title={item.isLink ? "Open LinkedIn profile" : `Copy ${item.label} to clipboard`}
              data-testid={`prospect-${item.type}-item`}
              onKeyDown={(e) => e.key === 'Enter' && item.onClick?.()}
            >
              {item.icon}
              {item.isLink ? (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
              {!item.isLink && <Icon icon="lucide:copy" className="ml-auto text-gray-400" aria-hidden="true" />}
            </div>
          ))}
        </div>
        
        {/* COPILOT FIX GAP-AI */}
        <div className="insight" data-testid="prospect-insight-column">
          <h3 className="text-sm font-semibold text-gray-500 mb-1">AI-Generated Insights</h3>
          <p>{prospect.snippet}</p>
        </div>
        
        {/* COPILOT REMOVE NOTES - Removed Notes section */}
        
        {/* COPILOT REMOVE PD-EXPORT */}
        {/* Export button removed as it is obsolete */}
      </CardBody>
    </Card>
  );
};

export default ProspectDetailsCard;
