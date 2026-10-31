# Generates in-between animation frames + Vaka rig parts from the committed art sheets.
import json,numpy as np,cv2
from PIL import Image,ImageDraw
D='/workspace/tyg/assets/art/'
FR=json.load(open(D+'frames.json'))
def crop(sheet,k):
    x,y,w,h=FR[sheet][k];return np.array(SH[sheet].crop((x,y,x+w,y+h)))
def shear(a,ys,k,bob=0,pad=4):
    h,w,_=a.shape;o=np.zeros((h+pad,w+2*pad,4),np.uint8);ysp=int(h*ys)
    for y in range(h):
        if y<ysp: dx=0;ty=y+pad+bob
        else: dx=int(round(k*(y-ysp)/max(1,h-1-ysp)));ty=y+pad+(bob if y<ysp else 0)
        if y>=ysp: ty=y+pad
        # stretch gap: if bob<0 duplicate split row so no hole
        row=a[y];m=row[:,3]>0
        xs=np.arange(w)+pad+dx;o[ty][xs[m]]=row[m]
    if bob<0:
        for t in range(1,-bob+1):
            r=a[ysp];m=r[:,3]>0;o[ysp+pad-t][(np.arange(w)+pad)[m]]=r[m]
    return o
def scale(a,sx,sy):
    h,w,_=a.shape;nw,nh=max(1,round(w*sx)),max(1,round(h*sy))
    return np.array(Image.fromarray(a).resize((nw,nh),Image.NEAREST))
def vsquash(a,ys,f):  # scale rows above ys by f (wings), keep below
    h,w,_=a.shape;ysp=int(h*ys);top=scale(a[:ysp],1,f);return np.concatenate([top,a[ysp:]],0)
def trim(a):
    m=a[:,:,3]>0;ys=np.where(m.any(1))[0];xs=np.where(m.any(0))[0]
    return a[ys[0]:ys[-1]+1,xs[0]:xs[-1]+1]
SH={n:Image.open(D+n+'.png').convert('RGBA') for n in ['vel','dog','boar','hawk','vaka']}
NEW={}
r1,r2,ju,idl=crop('vel','run1'),crop('vel','run2'),crop('vel','jump'),crop('vel','idle')
sh=[0,-2,-4,-2];bb=[0,-1,-1,0]
NEW['vel']={f'rn{i}':shear(r1 if i<4 else r2,.55,sh[i%4],bb[i%4]) for i in range(8)}
NEW['vel'].update(rise=scale(shear(ju,.55,-2,0),0.94,1.07),apex=shear(ju,.55,1,0),fall=shear(ju,.55,3,0),land=scale(idl,1.12,0.86))
d1,d2,sit=crop('dog','run1'),crop('dog','run2'),crop('dog','sit')
NEW['dog']={f'r{i}':shear(d1 if i<3 else d2,.6,[0,-2,-3][i%3],[0,-1,0][i%3]) for i in range(6)}
NEW['dog']['sitb']=shear(sit,.45,0,-1)
NEW['dog']['leap']=crop('dog','bark')
bs,bc=crop('boar','stand'),crop('boar','charge')
NEW['boar']={'w0':shear(bs,.6,0,0),'w1':shear(bs,.6,-2,-1),'w2':shear(bs,.6,2,0),'w3':shear(bs,.6,-1,-1),
 'c0':shear(bc,.55,0,0),'c1':shear(bc,.55,-3,-1),'c2':shear(bc,.55,2,0),'c3':shear(bc,.55,-2,-1)}
hu,hd=crop('hawk','up'),crop('hawk','down')
NEW['hawk']={'f0':hu,'f1':vsquash(hu,.5,.55),'f2':hd,'f3':vsquash(hu,.5,.3),'dv':hd}
for n,fr in NEW.items():
    base=SH[n];W,H=base.size;x=W+1;items=[]
    for k,a in fr.items():
        a=trim(a);items.append((k,a,x));x+=a.shape[1]+1
    nh=max(H,max(a.shape[0] for _,a,_ in items));out=Image.new('RGBA',(x,nh));out.paste(base,(0,0))
    for k,a,x0 in items:
        out.paste(Image.fromarray(a),(x0,0));FR[n][k]=[x0,0,a.shape[1],a.shape[0]]
    out.save(D+n+'.png')
# ---- Vaka rig ----
V=np.array(SH['vaka'].crop(tuple([FR['vaka']['idle'][0],0,83,106])))
P={ # name: polygon, pivot, parent
 'handL':([(0,72),(19,72),(19,88),(0,88)],(9,73)),
 'foreL':([(1,55),(21,55),(21,73),(1,73)],(12,57)),
 'upperL':([(6,29),(24,29),(25,50),(19,58),(5,58),(7,42)],(18,33)),
 'handR':([(62,72),(83,72),(83,88),(62,88)],(72,73)),
 'foreR':([(61,55),(82,55),(82,73),(61,73)],(70,57)),
 'upperR':([(58,25),(72,28),(78,44),(77,58),(63,58),(59,46)],(64,31)),
 'jaw':([(27,31),(42,30),(41,40),(29,40)],(35,31)),
 'head':([(12,0),(54,0),(54,22),(46,34),(36,38),(26,36),(20,27),(12,18)],(34,34)),
 'loin':([(25,67),(57,67),(55,99),(29,99)],(41,68)),
 'legL':([(8,76),(35,76),(35,106),(6,106)],(24,79)),
 'legR':([(47,76),(72,76),(76,106),(47,106)],(58,79)),
}
taken=np.zeros(V.shape[:2],bool);parts={}
for k,(poly,pv) in P.items():
    m=Image.new('L',(83,106));ImageDraw.Draw(m).polygon(poly,fill=1);m=np.array(m).astype(bool)&~taken&(V[:,:,3]>0)
    taken|=m;a=np.zeros_like(V);a[m]=V[m];parts[k]=(a,pv)
tor=V.copy();tor[taken]=0
# backfill behind joints: inpaint inside torso core hull
core=Image.new('L',(83,106));ImageDraw.Draw(core).polygon([(14,24),(68,22),(70,40),(66,74),(20,74),(12,40)],fill=1);core=np.array(core).astype(bool)
hole=(core&taken).astype(np.uint8)*255
hole=cv2.dilate(hole,np.ones((2,2),np.uint8))&((V[:,:,3]>0)*255).astype(np.uint8)
rgb=cv2.inpaint(np.ascontiguousarray(V[:,:,:3]),(taken*255).astype(np.uint8),5,cv2.INPAINT_TELEA)
to=(tor[:,:,3]>0);base=np.median(V[to][:,:3],0)*0.62
rgb=np.zeros_like(rgb)+base.astype(np.uint8)
rgb=(rgb.astype(int)+np.random.RandomState(1).randint(-8,8,rgb.shape[:2])[...,None]).clip(0,255).astype(np.uint8)  # slightly darker = reads as shadow behind limbs
tor[hole>0,:3]=rgb[hole>0];tor[hole>0,3]=255
parts['torso']=(tor,(41,72))
# head: fill mouth hole behind jaw dark
h,_=parts['head'];j,_=parts['jaw'];jm=(j[:,:,3]>0);h[jm]=[50,12,14,255]
# legs: extend top under loin with dark fill so lifting leg shows no gap
for k in ('legL','legR'):
    a,_=parts[k];ys=np.where(a[:,:,3].any(1))[0][0];row=a[ys].copy()
    for t in range(1,6):
        m=row[:,3]>0;a[ys-t][m]=(row[m]*[.7,.7,.7,1]).astype(np.uint8)
rig={};x=0;tiles=[]
order=['legL','legR','torso','loin','head','jaw','upperL','foreL','handL','upperR','foreR','handR']
for k in order:
    a,pv=parts[k];m=a[:,:,3]>0;ys=np.where(m.any(1))[0];xs=np.where(m.any(0))[0]
    y0,y1,x0,x1=ys[0],ys[-1]+1,xs[0],xs[-1]+1;tiles.append((a[y0:y1,x0:x1],x))
    rig[k]={'r':[x,0,int(x1-x0),int(y1-y0)],'o':[int(x0),int(y0)],'p':list(pv)};x+=int(x1-x0)+1
out=Image.new('RGBA',(x,106))
for a,x0 in tiles: out.paste(Image.fromarray(a),(x0,0))
out.save(D+'vaka_parts.png');FR['vakaRig']={'order':order,'parts':rig}
json.dump(FR,open(D+'frames.json','w'))
print({n:list(f) for n,f in NEW.items()})
