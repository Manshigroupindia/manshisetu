// Vercel Serverless Function: WebSocket & Real-time Notification Gateway Diagnostic Endpoint
// Path: /api/ws

import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body: any;
}

interface VercelResponse extends ServerResponse {
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
  send: (body: any) => void;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Upgrade, Connection');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const isUpgradeRequest =
    (req.headers['upgrade'] || '').toString().toLowerCase() === 'websocket' ||
    (req.headers['connection'] || '').toString().toLowerCase().includes('upgrade');

  // Platform Technical Limitation Audit:
  // Vercel Serverless Functions on the Hobby plan run in ephemeral execution environments
  // with a maximum execution duration of 10s to 60s. They terminate immediately after
  // responding and cannot sustain long-lived persistent bidirectional TCP WebSocket streams.
  if (isUpgradeRequest) {
    res.statusCode = 426; // 426 Upgrade Required / Protocol Unsupported
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: 'unsupported_on_serverless',
        error: 'Vercel Serverless Functions on the Hobby plan do not support persistent TCP WebSockets.',
        guidance:
          'Manshi Group Setu automatically uses the native Firestore Realtime WebChannel engine (100% free on Firebase Spark plan) for zero-latency push events. If a standalone WebSocket server is required, deploy a dedicated Node.js/ws instance (e.g., on Render/Railway) and set VITE_WS_NOTIFICATION_URL.',
        code: 426,
      })
    );
    return;
  }

  // Health and Diagnostic Probe
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      service: 'Manshi Group Setu Notification Gateway',
      environment: 'Vercel Serverless (Hobby Plan)',
      activeRealtimeEngine: 'Firebase Firestore WebChannel / Realtime Listeners',
      webSocketGatewaySupported: false,
      reason: 'Serverless ephemeral container execution limit (10s-60s) prevents stateful in-memory TCP socket pools.',
      fallbackStatus: 'Active & Operational (Zero cost on Firebase Spark plan)',
      supportedEvents: [
        'duty_on',
        'duty_off',
        'task_assigned',
        'task_updated',
        'task_completed',
        'expense_submitted',
        'expense_approved',
        'expense_rejected',
        'salary_processed',
        'salary_advance_requested',
        'salary_advance_approved',
        'salary_advance_rejected',
        'notice_published',
        'holiday_added',
        'event_added',
      ],
      timestamp: new Date().toISOString(),
    })
  );
}
