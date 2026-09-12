import { tool } from '@openai/agents/realtime';
import { z } from 'zod';
import {
  bus,
  callTool,
  type ToolArgs,
  type ToolName,
} from '@/lib/contract';

async function dispatch<T extends ToolName>(name: T, args: ToolArgs[T]) {
  const id = crypto.randomUUID();
  bus.emit({ t: 'state', state: 'working' });
  bus.emit({ t: 'tool_start', id, tool: name, args, at: Date.now() });
  const result = await callTool(name, args);
  bus.emit({ t: 'tool_done', id, tool: name, result, at: Date.now() });
  return result.speak;
}

export const rallyTools = [
  tool({
    name: 'file_task',
    description: 'File a task from the meeting. Leave assignee out when nobody owns it yet.',
    parameters: z.object({
      title: z.string(),
      details: z.string().optional(),
      assignee: z.string().optional(),
      priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
    }),
    execute: (args) => dispatch('file_task', args),
  }),
  tool({
    name: 'send_mail',
    description: 'Send a concise meeting email. Recipient first names are valid.',
    parameters: z.object({
      to: z.array(z.string()),
      subject: z.string(),
      body: z.string(),
    }),
    execute: (args) => dispatch('send_mail', args),
  }),
  tool({
    name: 'book_slot',
    description: 'Book a meeting using the natural-language time stated by the speaker.',
    parameters: z.object({
      title: z.string(),
      with: z.array(z.string()),
      when: z.string(),
      duration_minutes: z.number().optional(),
    }),
    execute: (args) => dispatch('book_slot', args),
  }),
  tool({
    name: 'write_recap',
    description: 'Write a meeting recap with decisions and owners when known.',
    parameters: z.object({
      title: z.string(),
      bullets: z.array(z.string()),
      decisions: z.array(z.string()).optional(),
      owners: z.array(z.object({ who: z.string(), what: z.string() })).optional(),
    }),
    execute: (args) => dispatch('write_recap', args),
  }),
  tool({
    name: 'remember',
    description: 'Remember a durable fact from this meeting for later meetings.',
    parameters: z.object({
      fact: z.string(),
      tags: z.array(z.string()).optional(),
    }),
    execute: (args) => dispatch('remember', args),
  }),
  tool({
    name: 'recall',
    description: 'Recall relevant facts from earlier meetings.',
    parameters: z.object({ query: z.string() }),
    execute: (args) => dispatch('recall', args),
  }),
  tool({
    name: 'delegate',
    description: 'Hand longer research or follow-up work to the persistent slow brain.',
    parameters: z.object({
      task: z.string(),
      report_to: z.string().optional(),
    }),
    execute: (args) => dispatch('delegate', args),
  }),
];
