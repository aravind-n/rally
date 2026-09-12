'use client';

import { useCopilotReadable, useCopilotAction } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import type { ActionCard } from '@/lib/contract';
import type { TranscriptLine } from './Transcript';

interface Props {
  cards: ActionCard[];
  transcript: TranscriptLine[];
  attendees: string[];
  topic: string | null;
}

export default function RallyCopilot({ cards, transcript, attendees, topic }: Props) {
  // Expose meeting context so the sidebar can answer grounded questions
  useCopilotReadable({
    description: 'Actions Rally has taken in this meeting (filed tasks, sent mail, booked slots, etc.)',
    value: cards,
  });

  useCopilotReadable({
    description: 'Live meeting transcript — what everyone said',
    value: transcript.map((l) => `${l.speaker ?? 'Room'}: ${l.text}`).join('\n'),
  });

  useCopilotReadable({
    description: 'Meeting attendees and topic',
    value: { attendees, topic },
  });

  // Reassign a task to someone else — calls file_task to create a replacement card
  useCopilotAction({
    name: 'reassign',
    description: 'Reassign a Rally-filed task to a different person',
    parameters: [
      { name: 'taskTitle', type: 'string', description: 'Title of the task to reassign' },
      { name: 'to', type: 'string', description: 'Name of the person to assign it to' },
    ],
    handler: async ({ taskTitle, to }) => {
      await fetch('/api/tools/file_task', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, assignee: to }),
      });
      return `Reassigned "${taskTitle}" to ${to}.`;
    },
  });

  // Add a note to persistent memory from the sidebar
  useCopilotAction({
    name: 'remember',
    description: 'Save a fact or decision from this meeting to Rally\'s persistent memory',
    parameters: [
      { name: 'fact', type: 'string', description: 'The fact or decision to remember' },
    ],
    handler: async ({ fact }) => {
      await fetch('/api/tools/remember', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fact }),
      });
      return `Remembered: "${fact}"`;
    },
  });

  return (
    <CopilotSidebar
      defaultOpen={false}
      labels={{
        title: 'Rally',
        placeholder: 'Reassign a task, add a note, ask what happened…',
        initial: "I've been taking notes. Ask me to reassign a task, remember something, or recap what just happened.",
      }}
      clickOutsideToClose={false}
    />
  );
}
