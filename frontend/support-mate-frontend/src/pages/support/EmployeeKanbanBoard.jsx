import React, { useState, useMemo, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CustomKanbanCard from '../../components/common/CustomKanbanCard';
import CustomKanbanDetailsModal from '../../components/common/CustomKanbanDetailsModal';
import CustomSearchBar from '../../components/common/CustomSearchBar';
import CustomCategoryFilter from '../../components/common/CustomCategoryFilter';
import { getTasksEmployee, getTask, updateTask } from '../../api/taskApi';
import { useTranslation } from 'react-i18next';

const emptyKanban = {
  columns: {
    PENDING: { name: 'Pending', items: [] },
    IN_PROGRESS: { name: 'In Progress', items: [] },
    DONE: { name: 'Done', items: [] },
  },
};

const columnOrder = ['PENDING', 'IN_PROGRESS', 'DONE'];

export default function EmployeeKanbanBoard() {
  const { t } = useTranslation();
  const [data, setData] = useState(emptyKanban);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await getTasksEmployee(token);
        const tasks = res.data.data || [];
        const columns = {
          PENDING: { name: 'Pending', items: [] },
          IN_PROGRESS: { name: 'In Progress', items: [] },
          DONE: { name: 'Done', items: [] },
        };
        tasks.forEach(task => {
          let status = task.status;
          if (!['PENDING', 'IN_PROGRESS', 'DONE'].includes(status)) status = 'PENDING';
          columns[status]?.items.push({
            id: task.id,
            title: task.title,
            category: task.category?.category_name_tr || '',
            deadline: task.deadline,
            description: task.description,
            assignee: task.assignedEmployee?.firstName ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}` : '',
            priority: task.priority,
            raw: task,
          });
        });
        setData({ columns });
      } catch (err) {
        setData(emptyKanban);
      }
    };
    fetchTasks();
  }, []);

  const allCategories = useMemo(() => {
    const cats = [];
    Object.values(data.columns).forEach(col => {
      col.items.forEach(item => {
        if (item.category && !cats.includes(item.category)) cats.push(item.category);
      });
    });
    return cats;
  }, [data]);

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = data.columns[source.droppableId];
    const destCol = data.columns[destination.droppableId];
    const sourceItems = Array.from(sourceCol.items);
    const [removed] = sourceItems.splice(source.index, 1);

    // Optimistic UI: Önce local state'i güncelle
    let destItems = [];
    let newColumns = {};
    if (source.droppableId !== destination.droppableId) {
      destItems = Array.from(destCol.items);
      destItems.splice(destination.index, 0, { ...removed, status: destination.droppableId });
      newColumns = {
        ...data.columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems },
      };
    } else {
      sourceItems.splice(destination.index, 0, removed);
      newColumns = {
        ...data.columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
      };
    }
    const prevData = data;
    setData(prev => ({ ...prev, columns: newColumns }));

    // Backend'e güncelleme isteği gönder
    if (source.droppableId !== destination.droppableId) {
      try {
        await updateTaskStatus(removed.id, destination.droppableId);
        // Başarılı ise ekstra bir şey yapmaya gerek yok
      } catch (err) {
        // Hata olursa eski state'e geri al
        alert('Durum güncellenemedi! Geri alınıyor.');
        setData(prevData);
      }
    }
  };

  const handleCardClick = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const res = await getTask(item.id, token);
      setModalTask(res.data.data);
      setModalOpen(true);
    } catch (err) {
      setModalTask(item.raw || item);
      setModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalTask(null);
  };

  const getFilteredItems = (items) => {
    let filtered = items;
    if (category) {
      filtered = filtered.filter(item => item.category === category);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(s) ||
        (item.category && item.category.toLowerCase().includes(s))
      );
    }
    return filtered;
  };

  // update task status
  // { "status": "PENDING" }
  // { "status": "IN_PROGRESS" }
  // { "status": "DONE" }
  const updateTaskStatus = async (taskId, status) => {
    const token = localStorage.getItem('token');
    const res = await updateTask(taskId, { status }, token);
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <h2 className="text-2xl font-bold mb-6">{t('kanbanBoard.title')}</h2>
      <div className="mb-8 w-full max-w-5xl flex flex-col sm:flex-row sm:items-center gap-3 justify-start">
        <div className="flex-1 min-w-[200px]">
          <CustomSearchBar
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('kanbanBoard.searchPlaceholder')}
            className="w-full max-w-xs"
          />
        </div>
        <div className="flex-shrink-0">
          <CustomCategoryFilter
            categories={allCategories}
            selected={category}
            onSelect={setCategory}
            label={t('kanbanBoard.categoryFilter')}
          />
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 w-full max-w-5xl justify-center">
          {columnOrder.map((colKey) => {
            const column = data.columns[colKey];
            const filteredItems = getFilteredItems(column.items);
            return (
              <Droppable droppableId={colKey} key={colKey}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`bg-white rounded-lg shadow-md flex-1 min-w-[260px] max-w-xs p-4 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                  >
                    <h3 className="text-lg font-semibold mb-4 text-center text-blue-700 tracking-wide">
                      {column.name}
                    </h3>
                    <div className="flex flex-col gap-3 min-h-[60px]">
                      {filteredItems.map((item, idx) => (
                        <Draggable draggableId={item.id} index={idx} key={item.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <CustomKanbanCard
                                title={item.title}
                                category={item.category}
                                deadline={item.deadline}
                                status={colKey}
                                className={snapshot.isDragging ? 'ring-2 ring-blue-400' : ''}
                                onClick={() => handleCardClick(item)}
                              >
                                {/* Detaylar buraya gelecek */}
                              </CustomKanbanCard>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
      <CustomKanbanDetailsModal
        open={modalOpen && !!modalTask}
        onClose={handleModalClose}
        task={modalTask}
      />
    </div>
  );
} 