'use client';

const MAX_IMAGE_DIMENSION=2400;

export async function optimizeImageForUpload(file:File):Promise<File>{
  if(file.type==='image/gif'||!file.type.startsWith('image/'))return file;
  try{
    const bitmap=await createImageBitmap(file);
    const scale=Math.min(1,MAX_IMAGE_DIMENSION/Math.max(bitmap.width,bitmap.height));
    if(scale===1&&file.type==='image/webp'){bitmap.close();return file}
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale));
    canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const context=canvas.getContext('2d');
    if(!context){bitmap.close();return file}
    context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',.86));
    if(!blob||blob.size>=file.size)return file;
    return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.webp',{type:'image/webp',lastModified:file.lastModified});
  }catch{return file}
}
