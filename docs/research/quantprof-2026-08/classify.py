import sys, json, re
from fractions import Fraction

def diffs(a): return [a[i+1]-a[i] for i in range(len(a)-1)]
def const(a): return len(a)>=2 and all(x==a[0] for x in a)

def solve_lin(a):
    # x_{n+1} = p*x_n + q  from first two pairs, verify all
    if len(a)<3: return None
    if a[1]==a[0]: return None
    try: p = Fraction(a[2]-a[1], a[1]-a[0])
    except ZeroDivisionError: return None
    q = a[1]-p*a[0]
    if all(a[i+1]==p*a[i]+q for i in range(len(a)-1)): return (p,q)
    return None

def solve_rec2(a):
    # x_n = p*x_{n-1} + q*x_{n-2}
    if len(a)<4: return None
    d = a[1]*a[0]-a[0]*a[1]  # placeholder
    # solve 2x2 from n=2,3
    m11,m12,r1 = a[1],a[0],a[2]
    m21,m22,r2 = a[2],a[1],a[3]
    det = m11*m22-m12*m21
    if det==0: return None
    p = Fraction(r1*m22-m12*r2, det)
    q = Fraction(m11*r2-r1*m21, det)
    if all(a[i]==p*a[i-1]+q*a[i-2] for i in range(2,len(a))): return (p,q)
    return None

def is_poly(a, k):
    d = a
    for _ in range(k): d = diffs(d)
    return const(d) and len(d)>=2

def mult_plus_linear(a):
    # x_{i+1} = m*x_i + (c + d*i)   -> residuals form an arithmetic progression
    n=len(a)
    if n<4: return None
    for m in list(range(-12,13)):
        res=[a[i+1]-m*a[i] for i in range(n-1)]
        dd=diffs(res)
        if const(dd):
            if dd[0]==0: continue          # that is plain recur-linear
            return (m,res[0],dd[0])
    return None

def divisor_arith(a):
    # x_{i+1} = x_i / d_i with d_i integers in arithmetic progression
    n=len(a)
    if n<4: return None
    ds=[]
    for i in range(n-1):
        if a[i+1]==0 or a[i]%a[i+1]!=0: return None
        ds.append(a[i]//a[i+1])
    dd=diffs(ds)
    if const(dd): return (ds,dd[0])
    return None

def ratio_linear_offset(a):
    # x_{i+1} = (p + q*i)*x_i + (r + s*i)
    n=len(a)
    if n<4: return None
    best=None
    for q in list(range(1,7))+list(range(-6,0)):
        for p in range(-14,15):
            res=[a[i+1]-(p+q*i)*a[i] for i in range(n-1)]
            dd=diffs(res)
            if const(dd):
                cand=(p,q,res[0],dd[0])
                if best is None or (abs(cand[2])+abs(cand[3])) < (abs(best[2])+abs(best[3])): best=cand
    return best

def classify(a, depth=0):
    n=len(a)
    if n<3: return "too-short", ""
    d1=diffs(a)
    if const(d1): return "arithmetic", f"{d1[0]:+d}"
    if all(x!=0 for x in a[:-1]):
        r=[Fraction(a[i+1],a[i]) for i in range(n-1)]
        if const(r): return "geometric", f"x{r[0]}"
    if is_poly(a,2): return "quadratic", f"2nd diff={diffs(diffs(a))[0]}"
    # power / square / cube tables BEFORE any recurrence fit
    for k,name in ((2,"squares-offset"),(3,"cubes-offset")):
        for start in range(1,40):
            off=a[0]-start**k
            if all(a[i]==(start+i)**k+off for i in range(n)):
                return name, f"n^{k}{off:+d} from n={start}"
    for b in range(2,13):
        for s in range(0,12):
            off=a[0]-b**s
            if all(a[i]==b**(s+i)+off for i in range(n)):
                return "power-offset", f"{b}^n{off:+d}"
    if is_poly(a,3): return "cubic", f"3rd diff={diffs(diffs(diffs(a)))[0]}"
    L=solve_lin(a)
    if L:
        p_,q_=L
        if p_.denominator==1 and q_.denominator==1:
            return "recur-linear", f"x{int(p_)}{int(q_):+d}"
    if n>=4 and all(a[i]==a[i-1]+a[i-2] for i in range(2,n)): return "fiblike","sum of prev two"
    if n>=4 and all(a[i]==a[i-1]*a[i-2] for i in range(2,n)): return "product-recur","prev*prev2"
    ev,od=a[0::2],a[1::2]
    if len(ev)>=2 and len(od)>=2 and const(diffs(ev)) and const(diffs(od)):
        return "interleaved", f"{diffs(ev)[0]:+d}/{diffs(od)[0]:+d}"
    if n>=4:
        ops=[]
        for i in range(n-1):
            if a[i]!=0 and a[i+1]%a[i]==0 and a[i+1]//a[i]!=1: ops.append(('*',a[i+1]//a[i]))
            else: ops.append(('+',a[i+1]-a[i]))
        if len(set(ops[0::2]))==1 and len(set(ops[1::2]))==1 and ops[0]!=ops[1]:
            return "alt-ops", f"{ops[0][0]}{ops[0][1]},{ops[1][0]}{ops[1][1]}"
    D=divisor_arith(a)
    if D: return "divisor-arith", f"divide by {D[0]} step {D[1]:+d}"
    M=mult_plus_linear(a)
    if M: return "mult-plus-linear", f"x{M[0]} then {M[1]:+d} stepping {M[2]:+d}"
    # index-dependent multiplier: x_{n+1} = x_n * (k+n) style
    if all(x!=0 for x in a[:-1]):
        rs=[Fraction(a[i+1],a[i]) for i in range(n-1)]
        if all(r.denominator==1 for r in rs):
            rd=diffs([int(r) for r in rs])
            if const(rd) and len(rd)>=2:
                return "ratio-arith", f"ratios {[int(r) for r in rs]} step {rd[0]:+d}"
    if depth==0:
        d=diffs(a)
        if len(d)>=3:
            f2,det2=classify(d,1)
            if f2 not in ("unknown","too-short","recur-2term-frac","recur-2term"):
                return "diff-"+f2, det2
        if all(x!=0 for x in a[:-1]):
            rr=[Fraction(a[i+1],a[i]) for i in range(len(a)-1)]
            if all(r.denominator==1 for r in rr) and len(rr)>=3:
                f3,det3=classify([int(r) for r in rr],1)
                if f3 not in ("unknown","too-short","recur-2term-frac","recur-2term"):
                    return "ratio-"+f3, det3
    RL=ratio_linear_offset(a)
    if RL: return "ratio-linear-offset", f"x({RL[0]}{RL[1]:+d}i) then {RL[2]:+d} stepping {RL[3]:+d}"
    R=solve_rec2(a)
    if R:
        p_,q_=R
        if p_.denominator==1 and q_.denominator==1:
            return "recur-2term", f"{int(p_)}*p1{int(q_):+d}*p2"
        return "recur-2term-frac", f"{p_}*p1+{q_}*p2"
    return "unknown",""

if __name__=="__main__":
    rows=[json.loads(l) for l in open(sys.argv[1])]
    from collections import Counter
    c=Counter(); ex={}; unk=[]
    seen=set()
    for r in rows:
        nums=[int(x) for x in re.findall(r'-?\d+', r['s'])]
        if not nums: continue
        key=tuple(nums)
        if key in seen: continue
        seen.add(key)
        fam,detail=classify(nums)
        c[(r['t'],fam)]+=1
        ex.setdefault((r['t'],fam), (r['s'],detail))
        if fam=="unknown": unk.append(r['s'])
    print(f"unique sequences: {len(seen)}")
    for k,v in sorted(c.items(), key=lambda x:(x[0][0],-x[1])):
        print(f"  {k[0]:8s} {k[1]:16s} {v:5d}   e.g. {ex[k][0]:30s} {ex[k][1]}")
    if unk:
        print(f"\nUNKNOWN ({len(unk)}):")
        for u in unk[:40]: print("   ", u)
