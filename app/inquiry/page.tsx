import type { Metadata } from 'next';
import { Check, Phone } from 'lucide-react';
import { InquiryForm } from '@/components/inquiry-form';

export const metadata: Metadata={title:'제품·견적 문의',description:'안내전광판, 멀티비전, 옥외용 키오스크 설치 장소와 목적을 남기면 필요한 규격과 견적 범위를 안내합니다.',alternates:{canonical:'/inquiry'}};

export default function InquiryPage(){return <main className="inquiry-page"><section className="inquiry-top"><div><p className="eyebrow light">PRODUCT & PROJECT INQUIRY</p><h1>제품·견적 문의</h1><p>정확한 제품명을 몰라도 됩니다. 설치 장소와 사용 목적부터 남겨주세요.</p><ul><li><Check/>제품 및 규격 검토</li><li><Check/>예산 범위와 포함 항목 안내</li><li><Check/>현장 실사 필요 여부 확인</li></ul><div className="static-phone"><Phone/><div><small>전화 상담</small><strong>032-719-7947</strong></div></div></div><InquiryForm/></section><section className="inquiry-guide"><h2>빠른 검토를 위해 알려주세요.</h2><div><article><b>01</b><h3>어디에 설치하나요?</h3><p>실내·실외 여부와 장소 사진이 도움이 됩니다.</p></article><article><b>02</b><h3>무엇을 보여주나요?</h3><p>행정 안내, 영상, 안전 정보 등 표시할 내용을 알려주세요.</p></article><article><b>03</b><h3>언제 필요하나요?</h3><p>희망 납품일과 예산 검토 일정을 함께 적어주세요.</p></article></div></section></main>}
