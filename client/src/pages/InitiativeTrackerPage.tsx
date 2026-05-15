import { useState } from 'react';
// @ts-expect-error — JSX files without TS types
import { EncountersPage } from './initiative-tracker/EncountersPage';
// @ts-expect-error — JSX files without TS types
import { EncounterPage } from './initiative-tracker/EncounterPage';

type View = 'encounters' | 'encounter';

export function InitiativeTrackerPage({ initialSessionId }: { initialSessionId?: string } = {}) {
  const [view, setView] = useState<View>(initialSessionId ? 'encounter' : 'encounters');
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);

  const handleOpenEncounter = (id: string) => {
    setSessionId(id);
    setView('encounter');
  };

  const handleBack = () => {
    setSessionId(null);
    setView('encounters');
  };

  if (view === 'encounter' && sessionId) {
    return <EncounterPage sessionId={sessionId} onBack={handleBack} />;
  }

  return <EncountersPage onOpenEncounter={handleOpenEncounter} />;
}
