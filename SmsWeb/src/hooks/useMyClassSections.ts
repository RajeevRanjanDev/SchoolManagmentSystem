import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teacherApi, type ClassTeacherSection } from '@/api/teacher.api';

/** Academic year the seeded data uses; keep in sync with the rest of the app. */
export const ACADEMIC_YEAR = '2024-2025';

/**
 * Loads the sections the logged-in teacher is class teacher of and manages the
 * "current section" selection. If the teacher has exactly one section it is
 * auto-selected; with several, the caller renders a picker.
 */
export function useMyClassSections() {
  // No academic-year filter: show the teacher's current class-teacher sections
  // regardless of which year the assignment was recorded under.
  const { data: sections = [], isLoading } = useQuery<ClassTeacherSection[]>({
    queryKey: ['my-class-sections'],
    queryFn: () => teacherApi.getMyClassSections(),
    staleTime: 60_000,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Auto-select the only (or first) section once loaded.
  useEffect(() => {
    if (sections.length && (selectedId == null || !sections.some((s) => s.sectionId === selectedId))) {
      setSelectedId(sections[0].sectionId);
    }
  }, [sections, selectedId]);

  const selected = useMemo(
    () => sections.find((s) => s.sectionId === selectedId) ?? null,
    [sections, selectedId],
  );

  return {
    sections,
    selected,
    selectedId,
    setSelectedId,
    isLoading,
    hasMultiple: sections.length > 1,
    hasNone: !isLoading && sections.length === 0,
  };
}
