import React from 'react';

interface TableCardProps {
  id: number;
  tableName: string;
  capacity: number;
  onSelect: () => void;
  selected: boolean;
  description?: string;
}

const TableCard: React.FC<TableCardProps> = ({ id, tableName, capacity, onSelect, selected }) => {
  return (
    <div className={`table-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <h4>{tableName}</h4>
      <p>Sức chứa: {capacity} người</p>
    </div>
  );
};

export default TableCard;
