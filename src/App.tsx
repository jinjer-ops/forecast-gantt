// src/App.tsx
import React, { useEffect, useState } from 'react'
import { listTasks, Task } from './api'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listTasks()
      .then((ts) => {
        setTasks(ts)
        setError(null)
      })
      .catch((e: any) => {
        setError(e?.message ?? String(e))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: 16, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <h1>Debug: GAS → React</h1>

      {loading && <p>読み込み中…</p>}

      {error && (
        <div style={{ color: 'red', whiteSpace: 'pre-wrap', marginTop: 8 }}>
          <b>エラー:</b>
          <br />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p style={{ marginTop: 8 }}>
            取得できたタスク数: <b>{tasks.length}</b>
          </p>

          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              marginTop: 8,
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                <th style={th}>Task</th>
                <th style={th}>Workstream</th>
                <th style={th}>Start</th>
                <th style={th}>End</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t, i) => (
                <tr key={i}>
                  <td style={td}>{t.Task}</td>
                  <td style={td}>{t.Workstream}</td>
                  <td style={td}>{String(t.Start).slice(0, 10)}</td>
                  <td style={td}>{String(t.End).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details style={{ marginTop: 16 }}>
            <summary>生の JSON を見る</summary>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, background: '#f8fafc', padding: 8 }}>
              {JSON.stringify(tasks, null, 2)}
            </pre>
          </details>
        </>
      )}
    </div>
  )
}

const th: React.CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
  textAlign: 'left',
  padding: '4px 8px',
}

const td: React.CSSProperties = {
  borderBottom: '1px solid #f1f5f9',
  padding: '4px 8px',
}
