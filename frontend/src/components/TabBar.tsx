import React, { useState } from "react";

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
  const [activeTab, setActiveTab] = useState<number>(0);

  return (
    <div className="flex flex-row w-full justify-around mt-4">
      {Object.values(tabs).map((tab, index) => {
        return (
          <Tab
            key={index}
            label={tab.label}
            active={activeTab === index}
            onClick={() => {
              setActiveTab(index);
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
