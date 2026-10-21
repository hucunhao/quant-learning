#!/usr/bin/env python3
"""把 Market Dashboard（macro-site）里学习页需要的数据复制成精简版。
用法：python3 build_data.py [macro-site 路径]
- data/series_lite.js：只保留 SPX、NDX、BAA10Y、HY_OAS、IG_OAS 五条日线
- data/interp.js：把 content/week*_interpretation.md 打包给网页用
- data/week1.js / week2.js / week3.js：直接复制（第 1–3 周的计算结果，静态，不每天更新）
"""
import json, re, shutil, sys, pathlib
here = pathlib.Path(__file__).resolve().parent
src = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/workspace/macro-site')
def load_js(p):
    t = (src / 'data' / p).read_text(encoding='utf-8')
    return json.loads(t[t.index('=') + 1:].strip().rstrip(';'))
ms = load_js('series.js')
keep = ['SPX', 'NDX', 'BAA10Y', 'HY_OAS', 'IG_OAS']
lite = {'meta': {'generated': ms['meta'].get('generated'), 'tz': ms['meta'].get('tz')},
        'series': {k: {f: ms['series'][k][f] for f in ('name', 'source', 'start', 'end', 'd', 'v')} for k in keep}}
(here / 'data' / 'series_lite.js').write_text('window.MS=' + json.dumps(lite, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
for w in ('week1', 'week2', 'week3'):
    shutil.copy(src / 'data' / f'{w}.js', here / 'data' / f'{w}.js')
interp = {}
for w in ('week1', 'week2', 'week3'):
    p = here / 'content' / f'{w}_interpretation.md'
    if p.exists(): interp[w] = p.read_text(encoding='utf-8')
tried = here / 'content' / 'tried.md'
if tried.exists(): interp['tried'] = tried.read_text(encoding='utf-8')
(here / 'data' / 'interp.js').write_text('window.INTERP=' + json.dumps(interp, ensure_ascii=False) + ';\n', encoding='utf-8')
print('ok', {k: len(v['d']) for k, v in lite['series'].items()}, list(interp))

# 首页小图：每月取一个点，体积很小
def load_local(p):
    t = (here / 'data' / p).read_text(encoding='utf-8'); return json.loads(t[t.index('=') + 1:].strip().rstrip(';'))
W2 = load_local('week2.js'); W3 = load_local('week3.js')
spx = lite['series']['SPX']; i0 = next(i for i, d in enumerate(spx['d']) if d >= '1990-01-01')
hi = -1; dd = []
for i, v in enumerate(spx['v']):
    hi = max(hi, v)
    if i >= i0: dd.append((spx['d'][i], v / hi - 1))
def monthly(pairs):
    out, last = [], None
    for d, v in pairs:
        if d[:7] != last: out.append(round(v, 4)); last = d[:7]
    return out
b = W2['BAA10Y']; R = W3['idx']['SPX']
home = {'dd': monthly(dd), 'z': monthly([(d, z) for d, z in zip(b['d'], b['ze']) if z is not None]),
        'eq': monthly(list(zip(R['wk_dates'], R['rules']['LC']['runs']['real']['eq']))), 'bh': monthly(list(zip(R['wk_dates'], R['bh'])))}
(here / 'data' / 'home.js').write_text('window.HOME=' + json.dumps(home, separators=(',', ':')) + ';\n', encoding='utf-8')
print('home', {k: len(v) for k, v in home.items()})
