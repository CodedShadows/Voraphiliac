import { CustomClient, RawMetric } from '../../../typings/Extensions.js';
import { default as is } from '../../../configs/instatus.json' with { type: 'json' };

export const name = 'latency';
export async function execute(client: CustomClient): Promise<void> {
  setInterval(() => updateMetric(client), 35_000);
}

async function updateMetric(c: CustomClient) {
  // Get the metrics
  const metrics: RawMetric[] = await fetch(`https://api.instatus.com/v1/${is.pageId}/metrics`, {
    headers: { Authorization: `Bearer ${is.apiKey}` }
  })
    .then((r) => r.json())
    .then((r: RawMetric[]) => r.filter((m) => m.active))
    .catch(() => []);
  const latency = metrics.find((m) => m.id === is.metricId) || metrics.find((m) => m.name === 'Latency');
  if (!latency) return;
  // Try to use client WS ping
  let diff = c.ws.ping,
    end = Date.now();
  // If we lack a websocket ping, ping Discord
  if (!diff || diff < 0) {
    const start = Date.now();
    await c.application.fetch();
    end = Date.now();
    diff = end - start;
  }
  // Update the metric
  await fetch(`https://api.instatus.com/v1/${is.pageId}/metrics/${latency.id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${is.apiKey}`
    },
    body: JSON.stringify({
      timestamp: end,
      value: diff
    })
  });
}
