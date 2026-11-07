import {cpSync,mkdirSync} from 'node:fs';
for(const folder of ['cmaps','standard_fonts']){mkdirSync('public/tools/pdfjs',{recursive:true});cpSync(`node_modules/pdfjs-dist/${folder}`,`public/tools/pdfjs/${folder}`,{recursive:true});}
