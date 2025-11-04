import React from 'react';
import ColumnHeader from './ColumnHeader';
import CardItem from './CardItem';

export const Column = ({
  column,
  headerRefs,
  maxHeaderHeight,
  editingColumnId,
  editingColumnTitle,
  editingColumnColor,
  setEditingColumnTitle,
  setEditingColumnColor,
  confirmEditColumn,
  startEditColumn,
  setEditingColumnId,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragStart,
  onDeleteColumn,
  onCardDragOverList,
  onCardDropOnListEnd,
  onCardDragStart,
  onCardDropOnItem,
  handleEditTask,
  handleDeleteTask,
  currentUserRole,
  totalCards,
}) => {
  return (
    <div
      key={column.id}
      className="board-column"
      onDragOver={onColumnDragOver}
      onDrop={(e) => onColumnDrop(e, column.id)}
    >
      <ColumnHeader
        column={column}
        editingColumnId={editingColumnId}
        editingColumnTitle={editingColumnTitle}
        editingColumnColor={editingColumnColor}
        setEditingColumnTitle={setEditingColumnTitle}
        setEditingColumnColor={setEditingColumnColor}
        confirmEditColumn={confirmEditColumn}
        startEditColumn={startEditColumn}
        setEditingColumnId={setEditingColumnId}
        headerRef={(el) => { if (el) headerRefs.current.set(column.id, el); }}
        onDragStart={onColumnDragStart}
        onDeleteColumn={onDeleteColumn}
        maxHeaderHeight={maxHeaderHeight}
  currentUserRole={currentUserRole}
      />

      <ul
        className="tasks-list"
        onDragOver={onCardDragOverList}
        onDrop={(e) => onCardDropOnListEnd(e, column)}
      >
        {(column.cards || []).map((card) => (
          <CardItem
            key={card.id}
            card={card}
            column={column}
            columnCount={(column.cards || []).length}
            totalCards={totalCards}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onDragStart={onCardDragStart}
            onDragOver={onCardDragOverList}
            onDrop={onCardDropOnItem}
            onDoubleClick={(e) => { const li = e.currentTarget; li.classList.toggle('expanded'); }}
            currentUserRole={currentUserRole}
          />
        ))}
      </ul>
    </div>
  );
};

export default Column;
