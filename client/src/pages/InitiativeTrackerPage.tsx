import { useState } from 'react';
// @ts-ignore — JSX files without TS types
import { EncountersPage } from './initiative-tracker/EncountersPage';
// @ts-ignore — JSX files without TS types
import { EncounterPage } from './initiative-tracker/EncounterPage';

type View = 'encounters' | 'encounter';

export function InitiativeTrackerPage() {
  const [view, setView] = useState<View>('encounters');
  const [sessionId, setSessionId] = useState<string | null>(null);

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
