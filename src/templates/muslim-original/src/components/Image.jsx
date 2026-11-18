import React from 'react';
export default function Image({src,alt='',fill=false,priority,sizes,className='',...props}) {
 const style=fill?{position:'absolute',inset:0,width:'100%',height:'100%',...props.style}:props.style;
 return <img src={src} alt={alt} loading={priority?'eager':'lazy'} sizes={sizes} className={className} style={style} {...Object.fromEntries(Object.entries(props).filter(([k])=>!['style','objectFit'].includes(k)))} />;
}