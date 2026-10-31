exec(open('/workspace/art/build.py').read())
from PIL import ImageDraw
meta={}
def sheet(name,frames_):
    # frames_: list of (key, rgba) -> horizontal sheet, bottom aligned
    H=max(f.shape[0] for _,f in frames_); W=sum(f.shape[1] for _,f in frames_)+len(frames_)
    sh=np.zeros((H,W,4),np.uint8); x=0; m={}
    for k,f in frames_:
        h,w=f.shape[:2]; sh[H-h:H,x:x+w]=f; m[k]=[x,H-h,w,h]; x+=w+1
    Image.fromarray(sh).save(O+name+'.png'); meta[name]=m
# --- Vel
a=load('vel_strip.jpg');fg=cut_white(a)
cuts=[('idle',15,111),('run1',121,258),('run2',260,393),('jump',401,499),('draw',510,647),('aim',648,750),('strike',750,873),('hurt',873,1009)]
img=Image.fromarray(a.astype(np.uint8)); 
def sword(gold):
    b=a.copy(); f=fg.copy(); f[:400,750:772]=False
    # erase staff tail past the hands
    yy,xx=np.mgrid[0:a.shape[0],0:a.shape[1]]
    P0=np.array([772,262.]);P1=np.array([873,355.]);d=P1-P0;L=np.hypot(*d);u=d/L
    t=((xx-P0[0])*u[0]+(yy-P0[1])*u[1]);dist=np.abs((xx-P0[0])*u[1]-(yy-P0[1])*u[0])
    f[(dist<7)&(t>L*0.84)&(xx<873)]=False
    im=Image.fromarray(b.astype(np.uint8));dr=ImageDraw.Draw(im);mk=Image.fromarray((f*255).astype(np.uint8));dm=ImageDraw.Draw(mk)
    hand=P0+u*L*0.80; tip=P0-u*10
    blade=(255,214,90) if gold else (196,214,232); edge=(255,250,210) if gold else (244,250,255); dark=(40,40,60)
    for w,c in [(13,dark),(9,blade)]:
        dr.line([tuple(hand),tuple(tip)],fill=c,width=w); dm.line([tuple(hand),tuple(tip)],fill=255,width=w)
    dr.line([tuple(hand-u*6+np.array([-u[1],u[0]])*2),tuple(tip+u*4+np.array([-u[1],u[0]])*2)],fill=edge,width=3)
    # guard
    g=hand-u*4; n=np.array([-u[1],u[0]])
    for w,c in [(9,dark),(5,(242,198,50))]:
        dr.line([tuple(g-n*12),tuple(g+n*12)],fill=c,width=w); dm.line([tuple(g-n*12),tuple(g+n*12)],fill=255,width=w)
    return np.array(im).astype(np.int16),np.array(mk)>127
ref=fg[:,15:111];hgt=np.where(ref.any(1))[0];s=34/(hgt[-1]-hgt[0]+1)
fr=[]
for k,x0,x1 in cuts:
    if k=='strike':
        for gold in (0,1):
            b,f=sword(gold);f[:,:750]=False;f[:,873:]=False
            ys=np.where(f.any(1))[0];xs=np.where(f.any(0))[0]
            fr.append(('strike'+('D' if gold else ''),outline(down(rgba(b,f,(xs[0],ys[0],xs[-1]+1,ys[-1]+1)),s))))
        continue
    f=fg.copy();f[:,:x0]=False;f[:,x1:]=False
    if k=='aim':f[:,x1-1:]=False
    ys=np.where(f.any(1))[0];xs=np.where(f.any(0))[0]
    fr.append((k,outline(down(rgba(a,f,(xs[0],ys[0],xs[-1]+1,ys[-1]+1)),s))))
sheet('vel',fr)
# --- Dog
a=load('dog_strip.jpg');fg=cut_white(a,holes=False);F=frames(fg);names=['stand','run1','run2','bark','sit']
s=18/(F[0][3]-F[0][1]);sheet('dog',[(n,outline(down(rgba(a,fg,b),s))) for n,b in zip(names,F)])
# --- Boar / hawk
a=load('boar_hawk.jpg');fg=cut_white(a)
def q(box):
    x0,y0,x1,y1=box;f=np.zeros_like(fg);f[y0:y1,x0:x1]=fg[y0:y1,x0:x1];ys=np.where(f.any(1))[0];xs=np.where(f.any(0))[0];return f,(xs[0],ys[0],xs[-1]+1,ys[-1]+1)
f1,b1=q((60,30,500,310));f2,b2=q((520,30,1000,310));s=26/(b1[3]-b1[1])
sheet('boar',[('stand',outline(flip(down(rgba(a,f1,b1),s)))),('charge',outline(flip(down(rgba(a,f2,b2),s))))])
f3,b3=q((60,345,480,628));f4,b4=q((520,345,1000,628));s=30/(b4[2]-b4[0])
sheet('hawk',[('up',outline(down(rgba(a,f3,b3),s))),('down',outline(down(rgba(a,f4,b4),s)))])
json.dump(meta,open(O+'frames.json','w'))
print(json.dumps(meta))
