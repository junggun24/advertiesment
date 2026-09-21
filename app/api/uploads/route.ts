import { isAdminAuthenticated } from '@/lib/admin-auth';

const DATA_API='http://127.0.0.1:3101';
export async function POST(request:Request){
  if(!await isAdminAuthenticated(request))return Response.json({message:'관리자 로그인이 필요합니다.'},{status:401});
  const form=await request.formData();const file=form.get('file');
  if(!(file instanceof File))return Response.json({message:'이미지를 선택해 주세요.'},{status:400});
  if(!file.type.startsWith('image/'))return Response.json({message:'이미지 파일만 업로드할 수 있습니다.'},{status:400});
  const response=await fetch(`${DATA_API}/uploads?filename=${encodeURIComponent(file.name)}`,{method:'POST',headers:{'content-type':file.type},body:await file.arrayBuffer()});
  return new Response(response.body,{status:response.status,headers:{'content-type':'application/json; charset=utf-8'}});
}
