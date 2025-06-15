import React from "react";
import TabNav, { TabItem } from "../components/TabNav";
import SubscriptionPanel from "../components/SubscriptionPanel";
import IntegrationsPanel from "../components/IntegrationsPanel";
import AccountPanel from "../components/AccountPanel";

export default function SettingsPage() {
  const [selectedTab, setSelectedTab] = React.useState("subscription");
  
  // Define tabs
  const tabs: TabItem[] = [
    { key: "subscription", title: "Subscription", icon: "lucide:credit-card" },
    { key: "integrations", title: "Integrations", icon: "lucide:plug" },
    { key: "account", title: "Account", icon: "lucide:user" }
  ];
  
  // Render the selected tab panel
  const renderTabPanel = () => {
    switch (selectedTab) {
      case "subscription":
        return <SubscriptionPanel />;
      case "integrations":
        return <IntegrationsPanel />;
      case "account":
        return <AccountPanel />;
      default:
        return <SubscriptionPanel />;
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
      
      <TabNav 
        tabs={tabs} 
        selectedTab={selectedTab} 
        onTabChange={setSelectedTab} 
      />
      
      {renderTabPanel()}
    </div>
  );
}