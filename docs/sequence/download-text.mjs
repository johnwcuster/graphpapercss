export function setupDownloads(announce){
 const urls=new Set();
 window.addEventListener('pagehide',()=>{for(const url of urls)URL.revokeObjectURL(url);urls.clear();});
 return (text,name,type)=>{
  const url=URL.createObjectURL(new Blob([text],{type}));urls.add(url);
  const link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>{URL.revokeObjectURL(url);urls.delete(url);},1000);
  announce(`${name} downloaded.`);
 };
}
