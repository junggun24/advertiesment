import { isAdminAuthenticated } from '@/lib/admin-auth';
import { saveUpload } from '@/lib/object-storage';

export async function POST(request:Request){
  if(!await isAdminAuthenticated(request))return Response.json({message:'관리자 로그인이 필요합니다.'},{status:401});
  const form=await request.formData();const file=form.get('file');
  if(!(file instanceof File))return Response.json({message:'이미지를 선택해 주세요.'},{status:400});
  if(!file.type.startsWith('image/'))return Response.json({message:'이미지 파일만 업로드할 수 있습니다.'},{status:400});
  try{return Response.json(await saveUpload(file,'content'),{status:201})}
  catch(error){return Response.json({message:error instanceof Error?error.message:'이미지를 업로드하지 못했습니다.'},{status:400})}
}
