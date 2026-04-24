import { useState } from 'react';
// @ts-ignore — JSX files without TS types
import { SessionsPage } from './initiative-tracker/SessionsPage';
// @ts-ignore — JSX files without TS types
import { EncounterPage } from './initiative-tracker/EncounterPage';

type View = 'sessions' | 'encounter';

export function InitiativeTrackerPage() {
  const [view, setView] = useState<View>('sessions');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleOpenSession = (id: string) => {
    setSessionId(id);
    setView('encounter');
  };

  const handleBack = () => {
    setSessionId(null);
    setView('sessions');
  };

  if (view === 'encounter' && sessionId) {
    return <EncounterPage sessionId={sessionId} onBack={handleBack} />;
  }

  return <SessionsPage onOpenSession={handleOpenSession} />;
}
