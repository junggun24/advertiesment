'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function InquiryForm({compact=false}:{compact?:boolean}){
  const [sent,setSent]=useState(false); const [sending,setSending]=useState(false); const [error,setError]=useState('');
  return <form className={compact?'quote-form compact':'quote-form'} onSubmit={async e=>{e.preventDefault();setSending(true);setError('');const form=new FormData(e.currentTarget);try{const response=await fetch('/api/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(form))});const data=await response.json() as {message?:string};if(!response.ok)throw new Error(data.message||'문의 접수에 실패했습니다.');setSent(true)}catch(err){setError(err instanceof Error?err.message:'문의 접수에 실패했습니다.')}finally{setSending(false)}}}>
    {sent?<div className="success"><CheckCircle2/><h3>문의가 접수되었습니다.</h3><p>담당자가 내용을 확인한 뒤 연락드립니다.</p><button type="button" onClick={()=>setSent(false)}>다시 작성</button></div>:<><div className="row"><label>이름<input name="name" required maxLength={40} placeholder="담당자 성함"/></label><label>기관·회사명<input name="organization" required maxLength={100} placeholder="기관 또는 회사명"/></label></div><label>연락처<input name="contact" required maxLength={40} type="tel" placeholder="010-0000-0000"/></label><label>문의 내용<textarea name="message" required maxLength={2000} rows={compact?3:5} placeholder="설치 장소, 사용 목적, 대략적인 크기와 예산을 적어주세요."/></label><label className="consent"><input required type="checkbox"/> 개인정보 수집 및 이용에 동의합니다.</label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="submit" disabled={sending}>{sending?'접수 중...':'견적 문의 보내기'} <ArrowRight/></button></>}
  </form>;
}
