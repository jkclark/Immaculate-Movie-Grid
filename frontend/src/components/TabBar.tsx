import React from "react";

interface TabProps {
  label: string;
  onClick: () => void;
}

interface TabInfo {
  [key: string]: TabProps;
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
    <div className="flex flex-row w-full justify-around">
      {Object.entries(tabs).map(([key, tab]) => {
        return <Tab key={key} {...tab} />;
      })}
    </div>
  );
};

const Tab: React.FC<TabProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};

export default TabBar;
