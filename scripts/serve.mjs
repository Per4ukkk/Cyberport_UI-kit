import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
if(!process.argv.includes('--no-build'))await import('./build.mjs');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2','.otf':'font/otf'};
const port=Number(process.env.PORT||4173);
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const decoded=decodeURIComponent(url.pathname);
  let target=path.resolve(root,'.'+decoded);
  if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403);return res.end();}
  let stat;try{stat=await fs.stat(target);}catch{}
  if(stat?.isDirectory()){
   if(!url.pathname.endsWith('/')){res.writeHead(308,{Location:url.pathname+'/'+url.search});return res.end();}
   target=path.join(target,'index.html');
  }
  let data,status=200;try{data=await fs.readFile(target);}catch{data=await fs.readFile(path.join(root,'404.html'));status=404;target='404.html';}
  res.writeHead(status,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch{res.writeHead(400);res.end('Bad request');}
}).listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}/`));
