'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, Save, Search } from 'lucide-react';

type Inquiry={id:number;name:string;organization:string;contact:string;message:string;status:string;assignee:string;memo:string;created_at:string;updated_at:string};
const labels:Record<string,string>={new:'신규',contacting:'상담 중',quoted:'견적 전달',contracted:'계약',closed:'종료'};

export default function InquiryAdmin(){
  const [items,setItems]=useState<Inquiry[]>([]);
  const [selected,setSelected]=useState<Inquiry|null>(null);
  const [query,setQuery]=useState(''); const [filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true); const [notice,setNotice]=useState('');
  async function load(){
    setLoading(true); setNotice('');
    const res=await fetch('/api/inquiries',{cache:'no-store'});
    if(!res.ok){setNotice('관리자 권한을 확인할 수 없습니다.');setLoading(false);return}
    const data=await res.json() as {inquiries:Inquiry[]};
    setItems(data.inquiries); setSelected(current=>data.inquiries.find(v=>v.id===current?.id)||data.inquiries[0]||null); setLoading(false);
  }
  useEffect(()=>{void load()},[]);
  const visible=useMemo(()=>items.filter(v=>(filter==='all'||v.status===filter)&&[v.name,v.organization,v.contact,v.message].join(' ').includes(query)),[items,query,filter]);
  async function save(){
    if(!selected)return; setNotice('저장 중...');
    const res=await fetch('/api/inquiries',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(selected)});
    if(!res.ok){setNotice('저장하지 못했습니다.');return}
    setNotice('저장되었습니다.'); await load();
  }
  const counts=Object.keys(labels).reduce((acc,key)=>({...acc,[key]:items.filter(v=>v.status===key).length}),{} as Record<string,number>);
  return <main className="admin-page">
    <header className="admin-header"><a href="/"><ArrowLeft/> 사이트</a><div><small>OIC KOREA</small><b>문의 관리</b></div><button onClick={()=>void load()}><RefreshCw/> 새로고침</button></header>
    <section className="admin-stats"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}><span>전체</span><b>{items.length}</b></button>{Object.entries(labels).map(([key,label])=><button className={filter===key?'active':''} onClick={()=>setFilter(key)} key={key}><span>{label}</span><b>{counts[key]||0}</b></button>)}</section>
    <section className="admin-workspace">
      <aside className="inquiry-list">
        <label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="기관명, 이름, 연락처 검색"/></label>
        {loading?<p className="admin-empty">불러오는 중...</p>:visible.length?visible.map(v=><button className={selected?.id===v.id?'selected':''} onClick={()=>setSelected(v)} key={v.id}><div><span className={`status ${v.status}`}>{labels[v.status]}</span><time>{v.created_at.slice(0,10)}</time></div><b>{v.organization}</b><span>{v.name} · {v.contact}</span><p>{v.message}</p></button>):<p className="admin-empty">조건에 맞는 문의가 없습니다.</p>}
      </aside>
      <section className="inquiry-detail">
        {selected?<><div className="detail-title"><div><small>문의 #{selected.id}</small><h1>{selected.organization}</h1><p>{selected.name} · {selected.contact}</p></div><button onClick={()=>void save()}><Save/> 저장</button></div>
          <article><h2>문의 내용</h2><p>{selected.message}</p></article>
          <div className="admin-fields"><label>처리 상태<select value={selected.status} onChange={e=>setSelected({...selected,status:e.target.value})}>{Object.entries(labels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>담당자<input value={selected.assignee} onChange={e=>setSelected({...selected,assignee:e.target.value})} placeholder="담당자 이름"/></label></div>
          <label className="memo">내부 메모<textarea rows={8} value={selected.memo} onChange={e=>setSelected({...selected,memo:e.target.value})} placeholder="상담 내용, 다음 연락 일정 등을 기록하세요."/></label>
          {notice&&<p className="admin-notice">{notice}</p>}
        </>:<div className="admin-empty">왼쪽에서 문의를 선택하세요.</div>}
      </section>
    </section>
  </main>
}
