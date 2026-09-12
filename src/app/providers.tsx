'use client';

import { CopilotKit } from '@copilotkit/react-core';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // runtimeUrl points to Aravind's A8 route; the sidebar gracefully degrades if it 404s
    <CopilotKit runtimeUrl="http://localhost:3000/api/copilotkit">
      {children}
    </CopilotKit>
  );
}
