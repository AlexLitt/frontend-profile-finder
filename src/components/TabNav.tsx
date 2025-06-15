import React from "react";
import { Tabs, Tab, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export interface TabItem {
  key: string;
  title: string;
  icon: string;
}

interface TabNavProps {
  tabs: TabItem[];
  selectedTab: string;
  onTabChange: (key: string) => void;
}

const TabNav: React.FC<TabNavProps> = ({ tabs, selectedTab, onTabChange }) => {
  // Find the currently selected tab for mobile dropdown
  const currentTab = tabs.find(tab => tab.key === selectedTab) || tabs[0];

  return (
    <>
      {/* Desktop tabs */}
      <div className="hidden md:block">
        <Tabs 
          selectedKey={selectedTab} 
          onSelectionChange={onTabChange as any}
          aria-label="Settings tabs"
          color="primary"
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-6",
            cursor: "w-full",
            tab: "max-w-fit px-0 h-12",
            tabContent: "group-data-[selected=true]:text-primary-500"
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.key}
              title={
                <div className="flex items-center gap-2">
                  <Icon icon={tab.icon} />
                  <span>{tab.title}</span>
                </div>
              }
              role="tab"
              aria-selected={selectedTab === tab.key}
              aria-controls={`tabpanel-${tab.key}`}
            />
          ))}
        </Tabs>
      </div>

      {/* Mobile dropdown */}
      <div className="md:hidden mb-4">
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
              className="w-full justify-between"
              endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
            >
              <div className="flex items-center gap-2">
                <Icon icon={currentTab.icon} />
                <span>{currentTab.title}</span>
              </div>
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Settings tabs"
            selectedKeys={[selectedTab]}
            selectionMode="single"
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              onTabChange(selected);
            }}
          >
            {tabs.map((tab) => (
              <DropdownItem key={tab.key}>
                <div className="flex items-center gap-2">
                  <Icon icon={tab.icon} />
                  <span>{tab.title}</span>
                </div>
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
};

export default TabNav;