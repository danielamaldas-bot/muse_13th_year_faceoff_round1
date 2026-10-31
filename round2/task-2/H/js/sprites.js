'use strict';
class Spr{
 constructor(w,h){this.w=w;this.h=h;this.d=new Uint32Array(w*h)}
 p(x,y,c){x|=0;y|=0;if(x>=0&&y>=0&&x<this.w&&y<this.h)this.d[y*this.w+x]=c}
 g(x,y){x|=0;y|=0;return(x>=0&&y>=0&&x<this.w&&y<this.h)?this.d[y*this.w+x]:0}
 pick(R,l,x,y){l+=BAYER[(y&3)*4+(x&3)]*0.3;const n=R.length;if(n>3&&l>0.72)return R[3];if(l>0.22)return R[2];if(l>-0.32)return R[1];return R[0]}
 ell(cx,cy,rx,ry,R,amb=0){for(let y=Math.floor(cy-ry);y<=cy+ry;y++)for(let x=Math.floor(cx-rx);x<=cx+rx;x++){const nx=(x+.5-cx)/rx,ny=(y+.5-cy)/ry,dd=nx*nx+ny*ny;if(dd>1)continue;const l=-(nx*0.65+ny*0.8)*0.9+(1-dd)*0.25-0.05+amb;this.p(x,y,this.pick(R,l,x,y))}
 cap(x0,y0,x1,y1,r,R,amb=0){const dx=x1-x0,dy=y1-y0,L2=dx*dx+dy*dy||1e-6,L=Math.sqrt(L2);let nx=-dy/L