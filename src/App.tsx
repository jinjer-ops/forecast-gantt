import React, { useEffect, useMemo, useState } from 'react'
import { listTasks, saveTicks, Task, pollMs } from './api'

const LANES = ['Data / ETL','Integration (Xactry/SF)','Modeling','Dashboard / Viz','Ops / Governance','Enablement']
const CAT: Record<string,{label:string,color:string}> = {
  BUILD:{label:'実装', color:'#3b82f6'},
  ANALYZE:{label:'分析', color:'#10b981'},
  THINK:{label:'設計', color:'#f59e0b'},
  OPS:{label:'運用', color:'#a21caf'},
  DOCS:{label:'資料', color:'#475569'},
}
const START = new Date('2025-11-17T00:00:00')
const WEEK = 7*24*60*60*1000

export default function App(){
  const [tasks, setTasks] = useState<Task[]>([])
  const [ticks, setTicks] = useState<Record<string, {Spec:number,Dev:number,Test:number,Ship:number}>>({})
  const [lane, setLane] = useState<'all'|string>('all')
  const [cat, setCat] = useState<'all'|string>('all')
  const [saving, setSaving] = useState(false)

  async function reload(){
    const t = await listTasks()
    setTasks(t)
    const m: Record<string, any> = {}
    t.forEach(x => { m[x.Task] = { Spec:x.Spec||0, Dev:x.Dev||0, Test:x.Test||0, Ship:x.Ship||0 } })
    setTicks(m)
  }
  useEffect(()=>{ reload(); const h=setInterval(reload, pollMs); return ()=>clearInterval(h) }, [])

  const filtered = useMemo(()=> tasks.filter(t => (lane==='all'||t.Workstream===lane) && (cat==='all'||t.Category===cat)), [tasks,lane,cat])

  const progress = useMemo(()=>{
    const total = filtered.length*4
    const done = filtered.reduce((acc,t)=> acc + (ticks[t.Task]?.Spec?1:0)+(ticks[t.Task]?.Dev?1:0)+(ticks[t.Task]?.Test?1:0)+(ticks[t.Task]?.Ship?1:0), 0)
    const pct = total? Math.round((done/total)*100):0
    return {done,total,pct}
  },[filtered,ticks])

  async function doSave(){
    setSaving(true)
    try{
      const rows = Object.entries(ticks).map(([TaskID,v]) => ({ TaskID, Spec:+!!v.Spec, Dev:+!!v.Dev, Test:+!!v.Test, Ship:+!!v.Ship }))
      await saveTicks(rows)
      await reload()
    } finally{ setSaving(false) }
  }

  return (
    <div style={{padding:16, maxWidth:1200, margin:'0 auto'}}>
      <h2>Gantt（Start: 2025-11-17）＋ Checklist</h2>
      <div style={{color:'#64748b', fontSize:12}}>React + GAS/Sheets（自動15秒ポーリング・保存で即反映）</div>

      <Legend />

      <div style={{border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', marginTop:12}}>
        <Timeline tasks={tasks} />
      </div>

      <div style={{display:'flex', gap:8, alignItems:'center', marginTop:12}}>
        <select value={lane} onChange={e=>setLane(e.target.value)}>
          <option value='all'>All Lanes</option>
          {LANES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={cat} onChange={e=>setCat(e.target.value)}>
          <option value='all'>All Categories</option>
          {Object.entries(CAT).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={reload}>Reload</button>
        <button onClick={doSave} disabled={saving}>{saving? 'Saving...':'Save checks'}</button>
        <div style={{marginLeft:'auto', fontSize:12, color:'#64748b'}}>進捗：<b>{progress.pct}%</b>（{progress.done}/{progress.total}）</div>
      </div>

      <Checklist tasks={filtered} ticks={ticks} setTicks={setTicks} />
    </div>
  )
}

function Legend(){
  return (
    <div style={{display:'flex', gap:8, alignItems:'center', marginTop:6}}>
      {Object.entries(CAT).map(([k,v]) => (
        <span key={k} style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12}}>
          <span style={{width:10, height:10, borderRadius:9999, background:v.color}} />
          {v.label}
        </span>
      ))}
    </div>
  )
}

function Timeline({tasks}:{tasks:Task[]}){
  const end = new Date(START.getTime() + 26*WEEK)
  const totalDays = Math.ceil((+end-+START)/(24*60*60*1000))
  const weeks = Math.ceil(totalDays/7)

  // 横スクロールで見切れ防止
  const minWidth = 220 + weeks * 80

  // 今日の位置（タイムライン上の何%か）
  const today = new Date()
  const dayOffset = Math.floor((+today - +START)/(24*60*60*1000))
  const clampedOffset = Math.min(Math.max(dayOffset, 0), totalDays)
  const todayLeftPct = (clampedOffset / totalDays) * 100
  
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth, position:'relative' }}>
        {/* 今日の縦線 */}
        <div
          style={{
            position:'absolute',
            top:0,
            bottom:0,
            left:`${todayLeftPct}%`,
            width:2,
            background:'rgba(239,68,68,0.9)', // 赤
            pointerEvents:'none',
            zIndex:4,
          }}
        />
        <div style={{display:'grid', gridTemplateColumns: `220px repeat(${weeks}, 80px)`}}>
          <div
            style={{
              padding:'6px 8px',
              fontWeight:600,
              position:'sticky',
              left:0,
              background:'#fff',
              borderRight:'1px solid #e5e7eb',
              zIndex:3,
            }}
          >
            Timeline
          </div>
          {Array.from({length:weeks}).map((_,i)=>{
            const w0 = new Date(START.getTime()+i*WEEK)
            const w1 = new Date(w0.getTime()+6*24*60*60*1000)
            return (
              <div
                key={i}
                style={{
                  borderLeft:'1px solid #e5e7eb',
                  textAlign:'center',
                  fontSize:11,
                  color:'#475569',
                  padding:'6px 0'
                }}
              >
                W{i+1} {fmt(w0).slice(5)}–{fmt(w1).slice(5)}
              </div>
            )
          })}
        </div>
        {LANES.map(l => {
          const lt = tasks
            .filter(t => t.Workstream && l.startsWith(t.Workstream.split(' ')[0]))
            .sort((a,b)=> a.Start>b.Start?1:-1)
          const height = Math.max(40, lt.length*24 + 24)
          return (
            <div key={l} style={{display:'grid', gridTemplateColumns: `220px 1fr`, borderTop:'1px solid #f1f5f9'}}>
              <div
                style={{
                  background:'#f8fafc',
                  borderRight:'1px solid #e5e7eb',
                  padding:8,
                  fontWeight:600,
                  position:'sticky',
                  left:0,
                  zIndex:2,
                }}
              >
                {l}
              </div>
                {l}
              </div>
              <div style={{position:'relative', height}}>
                {lt.map((t, i) => {
                  // ★ ここを修正：'T00:00:00' を足さない
                  const s = new Date(t.Start)
                  const e = new Date(t.End)

                  // 日付だけにそろえる（時間ズレ対策）
                  const sDay = new Date(s.getFullYear(), s.getMonth(), s.getDate())
                  const eDay = new Date(e.getFullYear(), e.getMonth(), e.getDate())

                  const leftPct = (Math.ceil((+sDay-+START)/(24*60*60*1000))/totalDays)*100
                  const widthPct = (Math.max(1, Math.ceil((+eDay-+sDay)/(24*60*60*1000)))/totalDays)*100
                  const color = CAT[t.Category]?.color || '#6b7280'
                  return (
                    <div
                      key={t.Task}
                      style={{
                        position:'absolute',
                        top: 10 + i*22,
                        left:`${leftPct}%`,
                        width:`${widthPct}%`,
                        height:16,
                        background:color,
                        borderRadius:8,
                        color:'#fff',
                        fontSize:10,
                        padding:'0 8px',
                        display:'flex',
                        alignItems:'center',
                        whiteSpace:'nowrap',
                        boxShadow:'0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {t.Task} ({dateLabel(t.Start)}→{dateLabel(t.End)})
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Checklist({tasks, ticks, setTicks}:{tasks:Task[], ticks:Record<string, any>, setTicks:Function}){
  return (
    <div style={{border:'1px solid #e5e7eb', borderRadius:12, background:'#fff', marginTop:12}}>
      <div style={{maxHeight:420, overflow:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#f8fafc', position:'sticky', top:0}}>
              <th style={th}>Lane</th><th style={th}>Category</th><th style={th}>Task</th><th style={th}>Start</th><th style={th}>End</th>
              <th style={th}>仕様確定</th><th style={th}>実装完了</th><th style={th}>テストOK</th><th style={th}>運用開始</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t,i)=>{
              const row = ticks[t.Task] || {Spec:0,Dev:0,Test:0,Ship:0}
              return (
                <tr key={t.Task} style={{background: i%2?'#fff':'#f8fafc80'}}>
                  <td style={td}>{t.Workstream}</td>
                  <td style={td}>{CAT[t.Category]?.label || t.Category}</td>
                  <td style={td}>{t.Task}</td>
                  <td style={td}>{dateLabel(t.Start)}</td>
                  <td style={td}>{dateLabel(t.End)}</td>
                  {['Spec','Dev','Test','Ship'].map(k=> (
                    <td key={k} style={{...td, textAlign:'center'}}>
                      <input type="checkbox" checked={!!row[k]} onChange={e => setTicks((prev: any) => ({ ...prev, [t.Task]: { ...prev[t.Task], [k]: e.target.checked ? 1 : 0 } }))} />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding:'8px', borderBottom:'1px solid #e5e7eb', textAlign:'left' }
const td: React.CSSProperties = { padding:'8px', borderBottom:'1px solid #e5e7eb' }

function fmt(d:Date){
  return d.toISOString().slice(0,10)
}

function dateLabel(v: any){
  const d = new Date(v)
  const y = d.getFullYear()
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  return `${y}-${m}-${day}`
}

