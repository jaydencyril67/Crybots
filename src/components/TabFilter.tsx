import React from 'react';
import './TabFilter.css';

export interface TabItem {
  id: string;
  label: string;
}

interface TabFilterProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabFilter: React.FC<TabFilterProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tab-filter-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-filter-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: `0 1 ${100 / tabs.length}%`,
            minWidth: '60px'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabFilter;

