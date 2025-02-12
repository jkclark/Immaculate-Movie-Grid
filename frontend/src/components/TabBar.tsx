import { useAtom } from "jotai";
import React from "react";
import { activeTabAtom } from "../state";

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
  invisible: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, invisible }) => {
  const [activeTab, setActiveTab] = useAtom(activeTabAtom);

  return (
    <div className={`flex flex-row w-full justify-around mt-4 px-4 lg:px-0 ${invisible ? "invisible" : ""}`}>
      {Object.values(tabs).map((tab, index) => {
        return (
          <Tab
            key={index}
            label={tab.label}
            active={activeTab === tab.label}
            onClick={() => {
              setActiveTab(tab.label);
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
    <button className={`tab ${active ? "selected-tab" : "unselected-tab"}`} onClick={onClick}>
      {label}
    </button>
  );
};

export default TabBar;
