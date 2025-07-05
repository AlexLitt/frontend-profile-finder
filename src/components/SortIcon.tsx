import React from 'react';

interface SortIconProps {
  dir: 'asc' | 'desc' | null;
}

// COPILOT FIX SORT: Simple component for showing sort direction
const SortIcon: React.FC<SortIconProps> = ({ dir }) => {
  if (!dir) return null;

  return (
    <span className={`sortIcon ${dir === 'desc' ? 'desc' : ''}`}>
      ▲
    </span>
  );
};

export default SortIcon;
