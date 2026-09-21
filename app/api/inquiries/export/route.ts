import { isAdminAuthenticated } from '@/lib/admin-auth';
import { cloudflareEnv } from '@/lib/cloudflare-env';
import { normalizeInquiry } from '@/lib/db-api';
// The workbook builder is shared with the one-time PostgreSQL migration tools.
import { buildInquiryWorkbook } from '@/scripts/inquiry-export.mjs';

export async function GET(request:Request){
  if(!await isAdminAuthenticated(request))return Response.json({message:'관리자 로그인이 필요합니다.'},{status:401});
  try{
    const url=new URL(request.url);const values:unknown[]=[];const where:string[]=[];
    const add=(column:string,value:string)=>{values.push(value);where.push(`${column}=?`)};
    const status=url.searchParams.get('status');const source=url.searchParams.get('source');const from=url.searchParams.get('from');const to=url.searchParams.get('to');
    if(status&&status!=='all')add('status',status);if(source&&source!=='all')add('source_type',source);
    if(from){values.push(from);where.push('date(created_at)>=date(?)')}if(to){values.push(to);where.push('date(created_at)<=date(?)')}
    const sql=`SELECT * FROM inquiries ${where.length?`WHERE ${where.join(' AND ')}`:''} ORDER BY created_at DESC`;
    const result=await cloudflareEnv().DB.prepare(sql).bind(...values).all<Record<string,unknown>>();
    const bytes=await buildInquiryWorkbook(result.results.map(normalizeInquiry));
    return new Response(bytes,{headers:{'content-type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','content-disposition':`attachment; filename="oic-inquiries-${new Date().toISOString().slice(0,10)}.xlsx"`,'cache-control':'no-store'}});
  }catch(error){return Response.json({message:error instanceof Error?error.message:'엑셀을 만들지 못했습니다.'},{status:503})}
}
