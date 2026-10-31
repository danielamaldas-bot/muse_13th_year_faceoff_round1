exec(open('/workspace/art/build.py').read())
meta=json.load(open(O+'frames.json'))
def haze(rgb,amt,des,col=(226,232,222)):
    f=rgb.astype(np.float32);g=f.mean(2,keepdims=True);f=f*(1-des)+g*des;f=f*(1-amt)+np.array(col)*amt;return f.clip(0,255).astype(np.uint8)
# ---- boss
a=load('boss_hall.jpg').astype(np.uint8);bgr=a[...,::-1].copy()
mask=np.zeros(a.shape[:2],np.uint8);bm=np.zeros((1,65),np.float64);fm=np.zeros((1,65),np.float64)
mask[:]=0;mask[10:500,430:820]=3
for (p,q) in [((517,35),(545,100)),((662,22),(655,95)),((640,60),(680,85)),((505,60),(535,85))]: cv2.line(mask,p,q,1,9)
mask[:120,560:620]=np.where(mask[:120,560:620]==3,2,mask[:120,560:620])
cv2.grabCut(bgr,mask,None,bm,fm,8,cv2.GC_INIT_WITH_MASK)
fg=(mask==1)|(mask==3)
lab,n=nd.label(fg);sz=nd.sum(fg,lab,range(1,n+1));fg=lab==(int(np.argmax(sz))+1);fg&=~((a.min(2)>120)&(np.arange(a.shape[0])[:,None]<220));ai=a.astype(int);reg=np.zeros_like(fg);reg[140:380,670:790]=True;fg&=~(reg&(ai[...,1]>0.5*ai[...,0])&(ai[...,0]>60));fg=nd.binary_opening(fg,iterations=2);lab,n=nd.label(fg);sz=nd.sum(fg,lab,range(1,n+1));fg=lab==(int(np.argmax(sz))+1);fg=nd.binary_fill_holes(fg);fg&=~(reg&(ai[...,1]>0.5*ai[...,0])&(ai[...,0]>60));fg=nd.binary_opening(fg,iterations=1)
ys=np.where(fg.any(1))[0];xs=np.where(fg.any(0))[0];box=(xs[0],ys[0],xs[-1]+1,ys[-1]+1);print('boss box',box)
r=rgba(a.astype(np.int16),fg,box);s=104/(box[3]-box[1]);v=outline(down(r,s))
Image.fromarray(v).save(O+'vaka.png');meta['vaka']={'idle':[0,0,v.shape[1],v.shape[0]]}
# arena: inpaint demon + tiny hero/dog, crop to 16:9 
im=np.zeros(a.shape[:2],np.uint8);im[410:515,150:320]=255
ar=cv2.inpaint(bgr,im,9,cv2.INPAINT_TELEA)[...,::-1];ar=np.concatenate([ar[:,:440],ar[:,790:]],1)
ar=np.array(Image.fromarray(ar).resize((round(ar.shape[1]*180/572),180),Image.LANCZOS));ar=np.concatenate([ar,ar[:,::-1]],1);Image.fromarray(haze(ar,0.35,0.3)).save(O+'arena.png')
# ---- far jungle (mirror tile for seamless parallax)
a=load('jungle_far.jpg').astype(np.uint8);w=round(a.shape[1]*180/a.shape[0])
f=np.array(Image.fromarray(a).resize((w,180),Image.LANCZOS));f=np.concatenate([f,f[:,::-1]],1)
Image.fromarray(haze(f,0.42,0.35)).save(O+'far.png')
# ---- ruins: inpaint hero/dog, mirror tile, mid layer
a=load('ruins.jpg').astype(np.uint8);bgr=a[...,::-1].copy();im=np.zeros(a.shape[:2],np.uint8);im[205:292,420:505]=255;im[395:450,385:470]=255
r=cv2.inpaint(bgr,im,9,cv2.INPAINT_TELEA)[...,::-1];w=round(r.shape[1]*180/r.shape[0])
f=np.array(Image.fromarray(r).resize((w,180),Image.LANCZOS));f=np.concatenate([f,f[:,::-1]],1)
Image.fromarray(haze(f,0.32,0.25)).save(O+'ruins.png')
# ---- brick tiles from ruins platform (64px src -> 16px, nearest)
def tile(x,y): return np.array(Image.fromarray(r[y:y+64,x:x+64]).resize((16,16),Image.NEAREST))
tiles=[tile(540,232),tile(300,308),tile(760,318),tile(820,318),tile(880,318),tile(600,236)]
Image.fromarray(np.concatenate(tiles,1)).save(O+'tiles.png');meta['tiles']={'top':[0,1],'fill':[2,3,4,5]}
# ---- title from key art
a=load('keyart.jpg').astype(np.uint8);Image.fromarray(a).resize((320,180),Image.LANCZOS).save(O+'title.png')
json.dump(meta,open(O+'frames.json','w'),indent=0)
