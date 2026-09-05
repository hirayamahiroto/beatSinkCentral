import json, sys, glob, os, collections, datetime

d = os.path.expanduser("~/.claude/projects/-Users-hirayamahiroto-dev-myProjects-beatSinkCentral")
files = sorted(glob.glob(f"{d}/*.jsonl"), key=os.path.getmtime)

def text_of(content):
    if isinstance(content, str): return content
    return " ".join(x.get("text","") for x in content if isinstance(x,dict) and x.get("type")=="text")

def is_prompt(rec):
    if rec.get("type")!="user": return False
    c = rec["message"].get("content")
    if isinstance(c,list) and any(isinstance(x,dict) and x.get("type")=="tool_result" for x in c): return False
    t = text_of(c).strip()
    if not t or t.startswith("<command-name>") or t.startswith("<local-command") or t.startswith("<system-reminder>") or t.startswith("Caveat:"): return False
    return True

sessions=[]
turns=[]
for f in files:
    sid=os.path.basename(f)[:-6]
    seen=set()
    cur=None
    s={"sid":sid,"start":None,"end":None,"prompts":0,"in":0,"cache_w":0,"cache_r":0,"out":0,"calls":0,"tools":0,"models":collections.Counter(),"first":""}
    for line in open(f):
        try: r=json.loads(line)
        except: continue
        ts=r.get("timestamp")
        if ts:
            s["start"]=s["start"] or ts; s["end"]=ts
        if is_prompt(r):
            cur={"sid":sid,"ts":ts,"text":text_of(r["message"]["content"]).strip().replace("\n"," ")[:70],"in":0,"cache_w":0,"cache_r":0,"out":0,"calls":0,"tools":0}
            turns.append(cur); s["prompts"]+=1
            if not s["first"]: s["first"]=cur["text"]
        if r.get("type")=="assistant":
            m=r["message"]; u=m.get("usage") or {}
            rid=r.get("requestId")
            content=m.get("content") or []
            ntools=sum(1 for x in content if isinstance(x,dict) and x.get("type")=="tool_use")
            s["tools"]+=ntools
            if cur: cur["tools"]+=ntools
            if not u or (rid and rid in seen): continue
            if rid: seen.add(rid)
            vals=(u.get("input_tokens",0),u.get("cache_creation_input_tokens",0),u.get("cache_read_input_tokens",0),u.get("output_tokens",0))
            for k,v in zip(("in","cache_w","cache_r","out"),vals):
                s[k]+=v
                if cur: cur[k]+=v
            s["calls"]+=1; s["models"][m.get("model")]+=1
            if cur: cur["calls"]+=1
    sessions.append(s)

def fmt(n): return f"{n/1000:,.0f}k"
tot=lambda s: s["in"]+s["cache_w"]+s["cache_r"]
print("== 全体 ==")
T={k:sum(s[k] for s in sessions) for k in ("in","cache_w","cache_r","out","calls","prompts","tools")}
print(f"sessions={len(sessions)} prompts={T['prompts']} api_calls={T['calls']} tool_calls={T['tools']}")
print(f"input(非キャッシュ)={fmt(T['in'])} cache_write={fmt(T['cache_w'])} cache_read={fmt(T['cache_r'])} output={fmt(T['out'])}")
print(f"入力総量={fmt(T['in']+T['cache_w']+T['cache_r'])} うちキャッシュ読み={100*T['cache_r']/(T['in']+T['cache_w']+T['cache_r']):.0f}%")
print(f"指示1回あたり平均: 入力総量={fmt((T['in']+T['cache_w']+T['cache_r'])/max(T['prompts'],1))} output={fmt(T['out']/max(T['prompts'],1))} API呼出={T['calls']/max(T['prompts'],1):.1f}回 ツール={T['tools']/max(T['prompts'],1):.1f}回")
print("\n== モデル別 API 呼び出し ==")
mc=collections.Counter()
for s in sessions: mc.update(s["models"])
for m,c in mc.most_common(): print(f"  {m}: {c}")

print("\n== セッション別 上位 (入力総量) ==")
print(f"{'date':<11}{'prompts':>7}{'calls':>6}{'tools':>6}{'in_total':>10}{'cache_r':>9}{'cache_w':>9}{'output':>8}  first prompt")
for s in sorted(sessions,key=tot,reverse=True)[:15]:
    dt=(s["start"] or "")[:10]
    print(f"{dt:<11}{s['prompts']:>7}{s['calls']:>6}{s['tools']:>6}{fmt(tot(s)):>10}{fmt(s['cache_r']):>9}{fmt(s['cache_w']):>9}{fmt(s['out']):>8}  {s['first'][:50]}")

print("\n== 指示(プロンプト)別 上位 20 (入力総量) ==")
print(f"{'ts':<17}{'calls':>6}{'tools':>6}{'in_total':>10}{'output':>8}  prompt")
tt=lambda t: t["in"]+t["cache_w"]+t["cache_r"]
for t in sorted(turns,key=tt,reverse=True)[:20]:
    print(f"{(t['ts'] or '')[5:16]:<17}{t['calls']:>6}{t['tools']:>6}{fmt(tt(t)):>10}{fmt(t['out']):>8}  {t['text'][:60]}")

print("\n== 日別 ==")
day=collections.defaultdict(lambda: collections.Counter())
for t in turns:
    dk=(t["ts"] or "")[:10]
    day[dk]["prompts"]+=1; day[dk]["in_total"]+=tt(t); day[dk]["out"]+=t["out"]; day[dk]["calls"]+=t["calls"]
for dk in sorted(day):
    c=day[dk]; print(f"{dk} prompts={c['prompts']:>3} calls={c['calls']:>4} in_total={fmt(c['in_total']):>9} out={fmt(c['out']):>7}")

json.dump({"sessions":[{**s,"models":dict(s["models"])} for s in sessions],"turns":turns},open(os.path.join(os.path.dirname(__file__),"usage.json"),"w"),ensure_ascii=False)
