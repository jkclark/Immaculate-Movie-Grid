import React from "react";

interface TabData {
  label: string;
  onClick: () => void;
}

interface TabProps extends TabData {
  active: boolean;
}

interface TabInfo {
  [key: string]: TabData;
}

interface TabBarProps {
  tabs: TabInfo;
}

const TabBar: React.FC<TabBarProps> = ({ tabs }) => {
  // TODO: Implement tab state within this component so only one tab can be active
  // Use index or something to determine active tab
  // Wrap passed onclick with a function that sets the active tab index
  const [activeTab, setActiveTab] = React.useState<string | null>(null);

  return (
    <div className="flex flex-row w-full justify-around mt-4">
      {Object.entries(tabs).map(([key, tab]) => {
        return (
          <Tab
            key={key}
            label={tab.label}
            active={activeTab === key}
            onClick={() => {
              setActiveTab(key);
              tab.onClick();
            }}
          />
        );
      })}
    </div>
  );
};

const Tab: React.FC<TabProps> = ({ label, onClick, active }) => {
  return (
    <button className={`${active ? "selected-tab" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
};

export default TabBar;
