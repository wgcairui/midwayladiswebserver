/* import {  load } from "cheerio";
import axios from "axios";

axios.get("http://www.ladis.com.cn/products/node_13.shtml").then(({data})=>{
    const $ = load(data)
  const a =  {Pagekeywords:"",Pagedescription:''}

  $("meta").each((i,el)=>{
      console.log(el.attribs.name,el.attribs
        );

    if (el.attribs.name === 'keywords') a.Pagekeywords = el.attribs.content
    if (el.attribs.name === 'description') a.Pagedescription = el.attribs.content


    })
    console.log(a);

}) */
