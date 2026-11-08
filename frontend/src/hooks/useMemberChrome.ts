import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { dashboardMenu, type NavSection } from '@/constants/navigation';
import { LEARNING_TOPICS, type LearningTopic } from '@/constants/learningCatalog';
import type { MemberChrome, MemberMenuItem } from '@/types/siteContent';

export function useMemberChrome() {
  return useQuery({
    queryKey: ['member-chrome'],
    queryFn: () => apiGet<MemberChrome>('/dashboard/chrome'),
    staleTime: 30_000,
  });
}

export function useLearningTopics() {
  const chrome = useMemberChrome();
  const topics: LearningTopic[] = chrome.data?.member.topics?.length ? chrome.data.member.topics : LEARNING_TOPICS;
  const topicByName = useMemo(() => {
    return (name?: string | null) => {
      const value = (name ?? '').trim().toLowerCase();
      if (!value) return undefined;
      return topics.find((topic) => value === topic.key.toLowerCase() || value.includes(topic.key.toLowerCase()));
    };
  }, [topics]);
  return { topics, topicByName, isLoading: chrome.isLoading };
}

export function applyMemberMenu(menu: MemberMenuItem[] | undefined): NavSection[] {
  if (!menu?.length) return dashboardMenu;
  const saved = new Map(menu.map((item) => [item.to, item]));
  return dashboardMenu
    .map((section) => ({
      ...section,
      items: section.items.flatMap((item) => {
        const override = saved.get(item.to);
        if (override?.hidden) return [];
        return [{ ...item, label: override?.label || item.label }];
      }),
    }))
    .filter((section) => section.items.length > 0);
}
