// src/api.ts
export type Task = {
  [key: string]: any
}

const GAS_URL = import.meta.env.VITE_GAS_URL as string

export async function listTasks(): Promise<Task[]> {
  if (!GAS_URL) {
    throw new Error('VITE_GAS_URL が設定されていません（Vercel の環境変数を確認してください）')
  }

  const url = `${GAS_URL}?action=list`

  const res = await fetch(url)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} / ${res.statusText}\n${text.slice(0, 200)}`)
  }

  const json = await res.json()
  if (!json.ok) {
    throw new Error(`GAS 側エラー: ${json.error || 'ok:false'}`)
  }
  if (!Array.isArray(json.tasks)) {
    throw new Error('GAS から tasks 配列が返ってきていません')
  }

  return json.tasks as Task[]
}
