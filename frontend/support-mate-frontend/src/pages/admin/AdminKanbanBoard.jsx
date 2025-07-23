import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import CustomKanbanCard from '../../components/common/CustomKanbanCard';
import CustomKanbanDetailsModal from '../../components/common/CustomKanbanDetailsModal';
import CustomSearchBar from '../../components/common/CustomSearchBar';
import CustomCategoryFilter from '../../components/common/CustomCategoryFilter';

const initialData = {
  columns: {
    PENDING: {
      name: 'Pending',
      items: [
        {
          id: '1',
          title: 'Kullanıcıdan bilgi bekleniyor',
          category: 'Genel',
          deadline: '2024-07-01 15:00',
          description: 'Kullanıcıdan ek bilgi talep edildi. Yanıt bekleniyor.',
          assignee: 'Ahmet Yılmaz',
          priority: 'Yüksek',
        },
        {
          id: '2',
          title: 'Yeni destek talebi oluşturuldu',
          category: 'Teknik',
          deadline: '2024-07-02 10:30',
          description: 'Kullanıcı yeni bir teknik destek talebi açtı.',
          assignee: 'Mehmet Demir',
          priority: 'Orta',
        },
      ],
    },
    IN_PROGRESS: {
      name: 'In Progress',
      items: [
        {
          id: '3',
          title: 'Sunucu bakımı yapılıyor',
          category: 'Yazılım',
          deadline: '2024-07-03 18:00',
          description: 'Sunucu güncellemesi ve bakım işlemleri devam ediyor.',
          assignee: 'Ayşe Kaya',
          priority: 'Düşük',
        },
      ],
    },
    DONE: {
      name: 'Done',
      items: [
        {
          id: '4',
          title: 'Şifre sıfırlama tamamlandı',
          category: 'Genel',
          deadline: '2024-06-30 09:00',
          description: 'Kullanıcının şifre sıfırlama işlemi başarıyla tamamlandı.',
          assignee: 'Ahmet Yılmaz',
          priority: 'Orta',
        },
      ],
    },
  },
};

const columnOrder = ['PENDING', 'IN_PROGRESS', 'DONE'];

export default function AdminKanbanBoard() {
  const [data, setData] = useState(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Tüm kategorileri tasklardan topla (tekrarsız)
  const allCategories = useMemo(() => {
    const cats = [];
    Object.values(data.columns).forEach(col => {
      col.items.forEach(item => {
        if (item.category && !cats.includes(item.category)) cats.push(item.category);
      });
    });
    return cats;
  }, [data]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = data.columns[source.droppableId];
    const destCol = data.columns[destination.droppableId];
    const sourceItems = Array.from(sourceCol.items);
    const [removed] = sourceItems.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceItems.splice(destination.index, 0, removed);
      setData(prev => ({
        ...prev,
        columns: {
          ...prev.columns,
          [source.droppableId]: { ...sourceCol, items: sourceItems },
        },
      }));
    } else {
      const destItems = Array.from(destCol.items);
      destItems.splice(destination.index, 0, removed);
      setData(prev => ({
        ...prev,
        columns: {
          ...prev.columns,
          [source.droppableId]: { ...sourceCol, items: sourceItems },
          [destination.droppableId]: { ...destCol, items: destItems },
        },
      }));
    }
  };

  const handleCardClick = (task) => {
    setModalTask(task);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalTask(null);
  };

  // Filtreli kolonlar
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

  return (
    <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <h2 className="text-2xl font-bold mb-6">Kanban Board</h2>
      <div className="mb-8 w-full max-w-5xl flex flex-col sm:flex-row sm:items-center gap-3 justify-start">
        <div className="flex-1 min-w-[200px]">
          <CustomSearchBar
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Görev veya kategori ara..."
            className="w-full max-w-xs"
          />
        </div>
        <div className="flex-shrink-0">
          <CustomCategoryFilter
            categories={allCategories}
            selected={category}
            onSelect={setCategory}
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
      {/* Modalı sadece bir kez aç ve children ile detayları göster */}
      <CustomKanbanDetailsModal
        open={modalOpen && !!modalTask}
        onClose={handleModalClose}
        title={modalTask?.title}
        category={modalTask?.category}
        description={modalTask?.description}
        assignee={modalTask?.assignee}
        priority={modalTask?.priority}
        deadline={modalTask?.deadline}
      />
    </div>
  );
}
