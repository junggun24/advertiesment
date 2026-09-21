'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, RefreshCw, Save, Search, Trash2 } from 'lucide-react';
import './attachments.css';

type Attachment={id:number;name:string;type:string;size:number;url:string};
type Inquiry={id:number;name:string;organization:string;contact:string;message:string;status:string;assignee:string;memo:string;created_at:string;updated_at:string;attachments:Attachment[]};
const labels:Record<string,string>={new:'신규',contacting:'상담 중',quoted:'견적 전달',contracted:'계약',closed:'종료'};

export default function InquiryAdmin(){
  const [items,setItems]=useState<Inquiry[]>([]);
  const [selected,setSelected]=useState<Inquiry|null>(null);
  const [query,setQuery]=useState(''); const [filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true); const [notice,setNotice]=useState('');
  async function load(){
    setLoading(true); setNotice('');
    const res=await fetch('/api/inquiries',{cache:'no-store'});
    if(res.status===401){window.location.replace('/admin/login');return}
    if(!res.ok){setNotice('문의 내역을 불러오지 못했습니다.');setLoading(false);return}
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
  async function logout(){
    await fetch('/api/admin/session',{method:'DELETE'});
    window.location.replace('/admin/login');
  }
  async function remove(){
    if(!selected||!window.confirm(`문의 #${selected.id}을 삭제할까요?`))return;
    const res=await fetch(`/api/inquiries?id=${selected.id}`,{method:'DELETE'});
    if(!res.ok){setNotice('삭제하지 못했습니다.');return}
    setSelected(null); setNotice('삭제되었습니다.'); await load();
  }
  async function removeAttachment(file:Attachment){
    if(!window.confirm(`${file.name} 파일을 삭제할까요?`))return;
    const res=await fetch(file.url,{method:'DELETE'});
    if(!res.ok){setNotice('첨부파일을 삭제하지 못했습니다.');return}
    setNotice('첨부파일이 삭제되었습니다.'); await load();
  }
  const counts=Object.keys(labels).reduce((acc,key)=>({...acc,[key]:items.filter(v=>v.status===key).length}),{} as Record<string,number>);
  return <main className="admin-page">
    <header className="admin-header"><a href="/admin"><ArrowLeft/> 관리자 홈</a><div><small>OIC KOREA</small><b>문의 관리</b></div><span className="admin-actions"><a href="/admin/content">콘텐츠 관리</a><button onClick={()=>void load()}><RefreshCw/> 새로고침</button><button onClick={()=>void logout()}>로그아웃</button></span></header>
    <section className="admin-stats"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}><span>전체</span><b>{items.length}</b></button>{Object.entries(labels).map(([key,label])=><button className={filter===key?'active':''} onClick={()=>setFilter(key)} key={key}><span>{label}</span><b>{counts[key]||0}</b></button>)}</section>
    <section className="admin-workspace">
      <aside className="inquiry-list">
        <label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="기관명, 이름, 연락처 검색"/></label>
        {loading?<p className="admin-empty">불러오는 중...</p>:visible.length?visible.map(v=><button className={selected?.id===v.id?'selected':''} onClick={()=>setSelected(v)} key={v.id}><div><span className={`status ${v.status}`}>{labels[v.status]}</span><time>{v.created_at.slice(0,10)}</time></div><b>{v.organization}</b><span>{v.name} · {v.contact}</span><p>{v.message}</p></button>):<p className="admin-empty">조건에 맞는 문의가 없습니다.</p>}
      </aside>
      <section className="inquiry-detail">
        {selected?<><div className="detail-title"><div><small>문의 #{selected.id}</small><h1>{selected.organization}</h1><p>{selected.name} · {selected.contact}</p></div><span className="admin-detail-actions"><button className="danger" onClick={()=>void remove()}><Trash2/> 삭제</button><button onClick={()=>void save()}><Save/> 저장</button></span></div>
          <article><h2>문의 내용</h2><p>{selected.message}</p></article>
          {selected.attachments?.length>0&&<section className="admin-attachments"><h2>첨부파일</h2>{selected.attachments.map(file=><div key={file.id}><a href={file.url} target="_blank" rel="noreferrer"><Download/><span><b>{file.name}</b><small>{file.type||'파일'} · {(file.size/1024/1024).toFixed(2)} MB</small></span></a><button title="첨부파일 삭제" onClick={()=>void removeAttachment(file)}><Trash2/></button></div>)}</section>}
          <div className="admin-fields"><label>처리 상태<select value={selected.status} onChange={e=>setSelected({...selected,status:e.target.value})}>{Object.entries(labels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>담당자<input value={selected.assignee} onChange={e=>setSelected({...selected,assignee:e.target.value})} placeholder="담당자 이름"/></label></div>
          <label className="memo">내부 메모<textarea rows={8} value={selected.memo} onChange={e=>setSelected({...selected,memo:e.target.value})} placeholder="상담 내용, 다음 연락 일정 등을 기록하세요."/></label>
          {notice&&<p className="admin-notice">{notice}</p>}
        </>:<div className="admin-empty">왼쪽에서 문의를 선택하세요.</div>}
      </section>
    </section>
  </main>
}
