export type Task = {
  Plan: string; Workstream: string; Category: 'BUILD'|'ANALYZE'|'THINK'|'OPS'|'DOCS'|string;
  Task: string; Start: string; End: string; Deliverable?: string; DefinitionOfDone?: string; Owner?: string; Dependencies?: string; Notes?: string;
  Spec?: number; Dev?: number; Test?: number; Ship?: number;
}
const GAS_URL = import.meta.env.VITE_GAS_URL as string
export const pollMs = Number(import.meta.env.VITE_POLL_MS || 15000)
export async function listTasks(): Promise<Task[]> {
  const res = await fetch(`${GAS_URL}?action=list`, { credentials: 'include' })
  const j = await res.json(); if (!j.ok) throw new Error(j.error || 'failed list'); return j.tasks as Task[]
}
export async function saveTicks(rows: { TaskID: string, Spec:number, Dev:number, Test:number, Ship:number }[]) {
  const res = await fetch(`${GAS_URL}?action=saveTicks`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ rows }), credentials:'include' })
  const j = await res.json(); if (!j.ok) throw new Error(j.error || 'failed save'); return j
}
