'use client';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { SortableNewspaperCard } from './SortableNewspaperCard';
import { useTranslations, type Locale } from '@/lib/i18n';
import type { SubscriptionItem, NewspaperData } from '@/types';

interface SubscribedNewspaperListProps {
  subscriptions: SubscriptionItem[];
  newspapers: NewspaperData[];
  onNewspaperClick: (id: string) => void;
  locale: Locale;
}

export function SubscribedNewspaperList({
  subscriptions,
  newspapers,
  onNewspaperClick,
  locale,
}: SubscribedNewspaperListProps) {
  const { reorderSubscriptions } = useSubscriptions();
  const t = useTranslations(locale);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subscriptions.findIndex((sub) => sub.id === active.id);
      const newIndex = subscriptions.findIndex((sub) => sub.id === over.id);

      const newOrder = arrayMove(subscriptions, oldIndex, newIndex);
      reorderSubscriptions(newOrder);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">{t.dragToReorder}</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={subscriptions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {subscriptions.map((subscription) => {
              const newspaper = newspapers.find((n) => n.id === subscription.id);
              return (
                <SortableNewspaperCard
                  key={subscription.id}
                  subscription={subscription}
                  newspaper={newspaper}
                  onClick={() => onNewspaperClick(subscription.id)}
                  locale={locale}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
