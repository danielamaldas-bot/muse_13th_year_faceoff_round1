import numpy as np, json, cv2
from PIL import Image
from scipy import ndimage as nd
S='/workspace/tyg/assets/art/src/'; O='/workspace/tyg/assets/art/'
def load(n): return np.array(Image.open(S+n).convert('RGB')).astype(np.int16)
def cut_white(a,tol=26,holes=True):
    b=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]); bg=np.median(b,0)
    near=(np.abs(a-bg).max(2)<tol)
    lab,n=nd.label(near); edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bgm=np.isin(lab,list(edge))
    if holes:
        sz=nd.sum(near,lab,range(1,n+1));bgm|=np.isin(lab,[i+1 for i,v in enumerate(sz) if v>=120])
    # halo: light pixels touching bg
    light=(np.abs(a-bg).max(2)<60)
    for _ in range(2): bgm|= light & nd.binary_dilation(bgm)
    fg=~bgm
    lab,n=nd.label(fg); sz=nd.sum(fg,lab,range(1,n+1)); keep=np.isin(lab,[i+1 for i,s in enumerate(sz) if s>=150])
    fg=keep
    return fg
def frames(fg,gap=4):
    cols=fg.any(0); runs=[];x=0;W=len(cols)
    while x<W:
        if cols[x]:
            s=x
            while x<W and cols[x:x+gap].any(): x+=1
            runs.append((s,x))
        x+=1
    out=[]
    for s,e in runs:
        rows=np.where(fg[:,s:e].any(1))[0]; out.append((s,int(rows[0]),e,int(rows[-1])+1))
    return out
def rgba(a,fg,box):
    x0,y0,x1,y1=box; r=np.zeros((y1-y0,x1-x0,4),np.uint8); r[...,:3]=a[y0:y1,x0:x1]; r[...,3]=fg[y0:y1,x0:x1]*255; return r
def down(r,s):
    h,w=r.shape[:2]; im=Image.fromarray(r).resize((max(1,round(w*s)),max(1,round(h*s))),Image.NEAREST); r=np.array(im); r[...,3]=np.where(r[...,3]>127,255,0); return r
def outline(r,col=(26,16,32)):
    m=r[...,3]>0; p=np.pad(r,((1,1),(1,1),(0,0))); mp=np.pad(m,1); ring=nd.binary_dilation(mp)&~mp
    p[ring]=(*col,255); return p
def flip(r): return r[:,::-1].copy()
