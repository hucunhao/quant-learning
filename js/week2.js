// 第 2 周：信用利差 z 分数（周度）
const Week2 = (() => {
  // 只用过去的数据：窗口 = 第 i 周之前的 w 周，不含第 i 周
  function rollingZ(v, w){
    const n = v.length, z = new Array(n).fill(null), pr = new Array(n).fill(null);
    for (let i = 0; i < n; i++){
      const lo = w == null ? 0 : i - w; if (lo < 0 || i - lo < 52) continue;
      let s = 0, s2 = 0; for (let k = lo; k < i; k++){ s += v[k]; s2 += v[k]*v[k]; }
      const m = s/(i-lo), sd = Math.sqrt(Math.max(0, s2/(i-lo) - m*m));
      z[i] = sd > 0 ? (v[i]-m)/sd : null;
      let c = 0; for (let k = lo; k < i; k++) if (v[k] < v[i]) c++; pr[i] = c/(i-lo)*100;
    }
    return { z, pr };
  }
  const NAMES = { BAA10Y:'BAA10Y（Baa 公司债 − 10 年美债）', HY_OAS:'HY OAS 高收益债利差', IG_OAS:'IG OAS 投资级利差', CCC_OAS:'CCC 级利差' };
  const SHORT = { BAA10Y:'BAA10Y', HY_OAS:'HY OAS', IG_OAS:'IG OAS', CCC_OAS:'CCC' };
  const fz = x => x == null ? '—' : U.minus((x > 0 ? '+' : '') + x.toFixed(2));
  const fp = x => x == null ? '—' : x.toFixed(0) + '%';
  const zone = z => z == null ? '—' : z > 2 ? '接近危机' : z > 1 ? '有压力' : z < -1 ? '偏紧 · 市场很放心' : '正常';
  const zcls = z => z == null ? '' : z > 2 ? 'r' : z > 1 ? 'y' : z < -1 ? 'g' : '';

  const Q = [
    { id:'w2q1', q:'现在高收益债利差（HY OAS）大约 330bp。和过去 3 年比，算偏低、正常还是偏高？和过去几十年比呢？', chips:['两个都偏高','两个都正常','3 年里偏高，几十年里偏低','3 年里偏低，几十年里偏高'],
      ans: () => { const h = W2.HY_OAS, b = W2.BAA10Y, i = h.d.length-1, j = b.d.length-1;
        return `和过去 3 年比：HY OAS ${h.v[i].toFixed(0)}bp，z = <b>${fz(h.z3[i])}</b>，比 ${fp(h.p3[i])} 的周都高，<b>偏高一点</b>。HY OAS 在 FRED 上只有 3 年数据，几十年要用它的“表亲” BAA10Y：现在 ${b.v[j].toFixed(0)}bp，和 1986 年以来比 z = <b>${fz(b.ze[j])}</b>，只比 ${fp(b.pe[j])} 的周高，<b>偏低</b>。同一个“今天”，换个比较的时间段，结论就反过来了。`; } },
    { id:'w2q2', q:'如果算平均值时偷偷把“未来”的数据也用上，2008 年 11 月危机最严重时的读数，会比当时真实能算出的更吓人还是更不吓人？', chips:['更吓人','差不多','更不吓人'],
      ans: () => { const c = W2.compare, a = c.find(x => x.month === '2007-06'), b = c.find(x => x.month === '2008-11');
        return `<b>更不吓人</b>。2008 年 11 月当时能算出的 z = ${fz(b.ze)}，偷看全部历史的 z = ${fz(b.zla)}。偷看版本把 2008 年以后的高利差也算进了标准差，“通常距离”被撑大，危机就显得没那么极端。2007 年 6 月两者差不多（${fz(a.ze)} 对 ${fz(a.zla)}）。偷看会悄悄改变读数，而且你没法提前知道往哪边改。`; } },
  ];

  // —— 概念 1：标准差 ——
  function sdDemo(root){
    root.innerHTML = `<canvas class="anim"></canvas>
      <div class="slider"><span>数据有多分散</span><input type="range" min="0.2" max="2" step="0.1" value="1"><span class="v"></span></div><div class="formula"></div>`;
    const cv = U.$('canvas', root), sl = U.$('input', root), f = U.$('.formula', root);
    function draw(){
      const k = +sl.value, a = [-100, -50, 0, 50, 100].map(x => Math.round(400 + x*k)), m = U.mean(a), d = a.map(x => Math.abs(x - m)), sd = Math.sqrt(U.mean(a.map(x => (x - m)**2)));
      U.$('.v', root).textContent = '× ' + k.toFixed(1);
      const { ctx, w, h } = Cv.setup(cv, 240), L = 60, R = 30, top = 30, ph = h - 40, Y = v => top + (600 - v)/400 * ph, X = i => L + (i + 0.5) * (w - L - R)/5;
      ctx.fillStyle = '#8b939b'; ctx.strokeStyle = '#ebe6dd'; [200, 300, 400, 500, 600].forEach(v => { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - R, Y(v)); ctx.stroke(); ctx.fillText(v + 'bp', 8, Y(v)); });
      ctx.fillStyle = 'rgba(47,125,109,.10)'; ctx.fillRect(L, Y(m + sd), w - L - R, Y(m - sd) - Y(m + sd));
      ctx.strokeStyle = '#2f7d6d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(L, Y(m)); ctx.lineTo(w - R, Y(m)); ctx.stroke();
      ctx.fillStyle = '#2f7d6d'; ctx.fillRect(L, 10, 18, 2); ctx.fillText(`平均 ${m.toFixed(0)}`, L + 24, 11); ctx.fillStyle = 'rgba(47,125,109,.25)'; ctx.fillRect(L + 110, 5, 18, 12); ctx.fillStyle = '#2f7d6d'; ctx.fillText(`平均 ± 1 个标准差（${sd.toFixed(0)}）`, L + 134, 11);
      a.forEach((v, i) => { ctx.strokeStyle = '#e08a2e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(i), Y(m)); ctx.lineTo(X(i), Y(v)); ctx.stroke();
        ctx.fillStyle = '#3b6ea8'; ctx.beginPath(); ctx.arc(X(i), Y(v), 7, 0, 7); ctx.fill();
        ctx.fillStyle = '#26303a'; ctx.textAlign = 'center'; ctx.fillText(`第 ${i+1} 周 ${v}`, X(i), h - 10); if (d[i]) { ctx.fillStyle = '#e08a2e'; ctx.fillText(`差 ${d[i].toFixed(0)}`, X(i) + 30, (Y(v) + Y(m))/2); } ctx.textAlign = 'left'; });
      f.innerHTML = `5 周的利差：${a.join('、')}，平均 <b>${m.toFixed(0)}</b><br>
        ① 每周离平均差多少（橙色竖线）：${d.map(x => x.toFixed(0)).join('、')}<br>
        ② 每个差自己乘自己再求平均：(${d.map(x => x.toFixed(0) + '²').join(' + ')}) ÷ 5 = ${U.mean(d.map(x => x*x)).toFixed(0)}<br>
        ③ 开根号（哪个数自己乘自己等于它）：√${U.mean(d.map(x => x*x)).toFixed(0)} ≈ <b>${sd.toFixed(0)}</b>　→　一周的利差<b>通常离平均 ${sd.toFixed(0)} 左右</b><br>
        <span class="muted">课本里写成</span> <span class="sym">σ</span>（读“西格玛”）。<span class="muted">先平方再开根号，是为了让“高于平均”和“低于平均”的差都算成正数。</span>`;
    }
    sl.oninput = draw; draw(); window.addEventListener('resize', draw);
  }
  // —— 概念 2：z 分数尺子 ——
  function zDemo(root){
    root.innerHTML = `<canvas class="anim"></canvas>
      <div class="slider"><span>平均</span><input type="range" min="200" max="600" step="10" value="400" data-k="m"><span class="v"></span></div>
      <div class="slider"><span>标准差</span><input type="range" min="20" max="200" step="5" value="100" data-k="s"><span class="v"></span></div>
      <div class="slider"><span>今天</span><input type="range" min="100" max="900" step="1" value="331" data-k="x"><span class="v"></span></div><div class="formula"></div>`;
    const cv = U.$('canvas', root), f = U.$('.formula', root), g = k => +U.$(`[data-k=${k}]`, root).value;
    function draw(){
      const m = g('m'), s = g('s'), x = g('x'), z = (x - m)/s;
      U.$$('.slider .v', root).forEach((v, i) => v.textContent = [m, s, x][i] + 'bp');
      const { ctx, w, h } = Cv.setup(cv, 150), L = 30, R = 30, X = zz => L + (zz + 4)/8 * (w - L - R), y = 70;
      [[-4, -1, 'rgba(59,110,168,.14)', '偏紧'], [-1, 1, 'rgba(60,141,90,.12)', '正常'], [1, 2, 'rgba(232,182,60,.25)', '有压力'], [2, 4, 'rgba(196,85,63,.18)', '接近危机']].forEach(([a, b, c, l]) => { ctx.fillStyle = c; ctx.fillRect(X(a), y - 22, X(b) - X(a), 44); ctx.fillStyle = '#55606b'; ctx.textAlign = 'center'; ctx.fillText(l, (X(a) + X(b))/2, y - 32); });
      ctx.textAlign = 'center';
      for (let k = -4; k <= 4; k++){ ctx.fillStyle = '#8b939b'; ctx.fillRect(X(k) - .5, y + 22, 1, 6); ctx.fillText((k > 0 ? '+' : k < 0 ? '−' : '') + Math.abs(k), X(k), y + 38); ctx.fillText((m + k*s) + 'bp', X(k), y + 56); }
      const zc = Math.max(-4, Math.min(4, z));
      ctx.fillStyle = '#26303a'; ctx.beginPath(); ctx.moveTo(X(zc), y + 18); ctx.lineTo(X(zc) - 8, y - 2); ctx.lineTo(X(zc) + 8, y - 2); ctx.fill();
      ctx.font = 'bold 14px ' + U.css('--font'); ctx.fillText(`今天 z = ${fz(z)}`, X(zc), y - 8 - 20 < 10 ? 12 : y - 52 > 0 ? y - 56 : 12);
      ctx.textAlign = 'left';
      f.innerHTML = `今天 ${x}bp，平均 ${m}bp，标准差 ${s}bp<br>① 差多少：${x} − ${m} = ${U.minus(String(x - m))}<br>② 这个差是几个标准差：${U.minus(String(x - m))} ÷ ${s} = <b>${fz(z)}</b>　→　<b>${zone(z)}</b><br>
        <span class="muted">写成式子：</span><span class="sym">z = (今天 − 平均) ÷ 标准差</span><span class="muted">　区间是事先定好的，只用来描述，不是买卖规则。</span>`;
    }
    U.$$('input', root).forEach(i => i.oninput = draw); draw(); window.addEventListener('resize', draw);
  }
  // —— 概念 3：“拿哪段过去比” 和 “偷看未来”（用真实 BAA10Y 回放）——
  function windowAnim(root){
    const B = W2.BAA10Y, n = B.d.length, ts = B.d.map(U.ts);
    let mode = 'all';
    root.insertAdjacentHTML('beforeend', `<div class="btns"><span class="lbl">和谁比</span><button class="btn small" data-m="3y">只比过去 3 年</button><button class="btn small" data-m="all">比过去全部</button><button class="btn small" data-m="peek">偷看：连未来一起比</button></div><canvas class="anim"></canvas>`);
    const cv = U.$('canvas', root);
    const i0 = B.d.findIndex(d => d >= '1990-01-01');
    const idxOf = day => B.d.findIndex(d => d >= day);
    const at = day => (idxOf(day) - i0)/(n - 1 - i0);
    function stats(i){
      let lo, hi; if (mode === '3y'){ lo = Math.max(0, i - 156); hi = i; } else if (mode === 'all'){ lo = 0; hi = i; } else { lo = 0; hi = n; }
      let s = 0, s2 = 0; for (let k = lo; k < hi; k++){ s += B.v[k]; s2 += B.v[k]*B.v[k]; } const m = s/(hi - lo), sd = Math.sqrt(Math.max(0, s2/(hi - lo) - m*m));
      return { lo, hi, m, sd, z:(B.v[i] - m)/sd };
    }
    const steps = [
      { at:0, cap:'时间回到 1990 年。<b>浅色区域是“拿来比较的过去”</b>，绿色带子是这段过去的平均 ± 1 个标准差。' },
      { at:at('2007-06-29'), cap:'2007 年 6 月：利差很低，z 是负的，看起来“很安全”。<b>17 个月后就是金融危机。</b>' },
      { at:at('2008-11-28'), cap:'2008 年 11 月：利差冲到 600bp 以上，z 超过 +6。' },
      { at:at('2020-03-27'), cap:'2020 年 3 月：切到“只比过去 3 年”看看。之前 3 年特别平静，同样的走阔显得更吓人。' },
      { at:0.999, cap:'今天。再切到“偷看”：带子用上了全部数据（包括未来），每个时间点的 z 都会悄悄变。' },
    ];
    function draw(t){
      const { ctx, w, h } = Cv.setup(cv, 300), L = 48, R = 130, top = 16, ph = h - 46;
      const i = Math.round(i0 + t*(n - 1 - i0)), S = stats(i);
      const X = k => L + (ts[k] - ts[i0])/(ts[n-1] - ts[i0]) * (w - L - R), Y = v => top + (700 - v)/650 * ph;
      ctx.fillStyle = '#8b939b'; ctx.strokeStyle = '#ebe6dd'; [100, 200, 300, 400, 500, 600].forEach(v => { ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(w - R, Y(v)); ctx.stroke(); ctx.fillText(v + 'bp', 4, Y(v)); });
      ctx.textAlign = 'center'; for (let y = 1990; y <= 2025; y += 5){ const k = idxOf(y + '-01-01'); if (k > 0) ctx.fillText(y, X(k), h - 14); } ctx.textAlign = 'left';
      // 比较区域
      const a = Math.max(i0, S.lo), b = Math.min(n - 1, S.hi - 1);
      ctx.fillStyle = mode === 'peek' ? 'rgba(196,85,63,.08)' : 'rgba(59,110,168,.08)'; ctx.fillRect(X(a), top, X(b) - X(a), ph);
      ctx.fillStyle = 'rgba(47,125,109,.16)'; ctx.fillRect(X(a), Y(S.m + S.sd), X(b) - X(a), Y(S.m - S.sd) - Y(S.m + S.sd));
      ctx.strokeStyle = '#2f7d6d'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(a), Y(S.m)); ctx.lineTo(X(b), Y(S.m)); ctx.stroke();
      // 全部线（淡）+ 已走过（实）
      ctx.strokeStyle = '#d8d1c4'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = i0; k < n; k++) k === i0 ? ctx.moveTo(X(k), Y(B.v[k])) : ctx.lineTo(X(k), Y(B.v[k])); ctx.stroke();
      ctx.strokeStyle = '#26303a'; ctx.lineWidth = 1.6; ctx.beginPath(); for (let k = i0; k <= i; k++) k === i0 ? ctx.moveTo(X(k), Y(B.v[k])) : ctx.lineTo(X(k), Y(B.v[k])); ctx.stroke();
      const col = S.z > 2 ? '#c4553f' : S.z > 1 ? '#b7861c' : S.z < -1 ? '#3b6ea8' : '#3c8d5a';
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(i), Y(B.v[i]), 6, 0, 7); ctx.fill();
      const bx = w - R + 12; ctx.fillStyle = '#26303a'; ctx.font = '14px ' + U.css('--font');
      ctx.fillText(B.d[i], bx, top + 10); ctx.fillText(`利差 ${B.v[i].toFixed(0)}bp`, bx, top + 34); ctx.fillText(`平均 ${S.m.toFixed(0)}`, bx, top + 56); ctx.fillText(`标准差 ${S.sd.toFixed(0)}`, bx, top + 78);
      ctx.fillStyle = col; ctx.font = 'bold 17px ' + U.css('--font'); ctx.fillText(`z = ${fz(S.z)}`, bx, top + 106);
      ctx.font = '13px ' + U.css('--font'); ctx.fillText(zone(S.z), bx, top + 128);
      if (mode === 'peek'){ ctx.fillStyle = '#c4553f'; ctx.fillText('用了未来数据！', bx, top + 152); }
    }
    const pl = Cv.player(root, { steps, draw, dur:16000 });
    const setMode = m => { mode = m; U.$$('[data-m]', root).forEach(b => b.classList.toggle('on', b.dataset.m === m)); pl.paint(); };
    U.$$('[data-m]', root).forEach(b => b.onclick = () => setMode(b.dataset.m)); setMode('all');
  }

  let state = { key:'BAA10Y', win:260 };
  function render(app){
    const hy = U.ser('HY_OAS'), baa = U.ser('BAA10Y');
    app.innerHTML = `
      <div class="muted small">第 2 周 / 共 6 周</div>
      <h1>${T('信用利差')} 的 ${T('z 分数')}：现在算紧还是松？</h1>
      <p class="lead">信用利差是企业借钱比国家多付的利息，企业越让人担心，它越高。光看“330bp”不知道高不高，要和它自己的过去比。这一周学怎么比，以及比的时候最容易犯的两个错。</p>
      <div class="steps" id="steps"></div>
      <div class="question">今天的信用利差，和它自己的过去比，算不算特别低或特别高？换一段“过去”来比、或者不小心用了未来的数据，结论会怎么变？
        <small>数据：${T('HY OAS')} 和 ${T('IG OAS')} 来自 FRED，只有 ${hy.start} 以来 3 年。长历史用 ${T('BAA10Y')}（${baa.start} 起）。都用每周最后一个交易日的值。</small></div>
      <h2><span class="n">1</span>先猜</h2><div id="pred"></div>
      <h2 id="concept"><span class="n">2</span>看懂概念</h2>
      <div class="grid g2">
        <div class="card concept"><h3>${T('标准差')}<span class="gloss">通常离平均有多远</span></h3><div id="sd-demo"></div></div>
        <div class="card concept"><h3>${T('z 分数')}<span class="gloss">离平均几个标准差</span></h3><div id="z-demo"></div></div>
      </div>
      <div class="card concept" style="margin-top:16px"><h3>拿哪段过去来比？<span class="gloss">${T('窗口', '比较窗口')}和${T('偷看未来')}</span></h3>
        <p class="small muted">用 1990 年以来真实的 BAA10Y 回放。点播放，再切换上面三个按钮，看同一天的 z 怎么变。</p><div id="win-anim"></div></div>
      <div class="card concept" style="margin-top:16px"><h3>${T('百分位')}<span class="gloss">过去有多少时候比今天低</span></h3>
        <p style="margin:0">例子：过去 100 周里有 78 周比今天低，百分位就是 78%，今天算偏高。它不假设数据长成钟形，和 z 放在一起看更稳。</p></div>
      <h2 id="data"><span class="n">3</span>看数据</h2><div id="lock"></div>
      <h2 id="take"><span class="n">4</span>要点和解读</h2><div id="take-body"></div>
      <h2 id="pits"><span class="n">5</span>要小心</h2>
      <div class="card pits">
        <details><summary>偷看未来</summary><p>用全部历史算平均，会悄悄用上当时还不存在的数据。这一页所有“诚实”的 z 都只用上一周及以前的数据。</p></details>
        <details><summary>比较的时间段会漂移</summary><p>长期平静之后，3 年窗口会把一点点走阔看得很吓人；窗口太长，又可能把真正的变化看成正常。没有哪个窗口是“对的”，所以放在一起看。</p></details>
        <details><summary>${T('肥尾')}</summary><p>利差的大跳动比钟形曲线预计的多得多。z = 3 对利差来说绝不是“千分之三才发生一次”。</p></details>
        <details><summary>这一周只做描述</summary><p>z 到多少该做什么，这周不回答。某个门槛能不能预测股市，第 3 周用事先写好的规则去检验。</p></details>
      </div>`;
    const lock = U.$('#lock'), steps = U.$('#steps');
    U.$('#pred').appendChild(Predict.block(Q, ok => { lock.dataset.ok = ok ? '1' : ''; weekSteps(steps, ok); drawLocked(); }));
    weekSteps(steps, false);
    sdDemo(U.$('#sd-demo')); zDemo(U.$('#z-demo')); windowAnim(U.$('#win-anim'));

    function drawLocked(){
      const tk = U.$('#take-body');
      if (!lock.dataset.ok){
        lock.innerHTML = `<div class="lockmsg"><span class="ico">🔒</span>先在上面写下两道题的猜测并提交，图表和结果才会出现。</div>`;
        tk.innerHTML = `<div class="lockmsg"><span class="ico">🔒</span>要点会揭晓答案，提交猜测后显示。</div>`; return; }
      if (lock.dataset.drawn) return; lock.dataset.drawn = '1';
      takeaways(tk);
      const h = W2.HY_OAS, ig = U.ser('IG_OAS'), i = h.d.length-1;
      const igch = ig && ig.v.length > 63 ? U.last(ig.v) - ig.v[ig.v.length-64] : null;
      const hc = W2.handcheck;
      lock.innerHTML = `
        <div class="card"><h3 style="margin-top:0">今天的读数 <span class="small muted">${h.d[i]} 这一周</span></h3>
          <div class="kpis">${['HY_OAS','IG_OAS','CCC_OAS','BAA10Y'].map(k => { const r = W2[k], j = r.d.length-1, z = k === 'BAA10Y' ? r.ze[j] : r.z3[j];
            return `<div class="kpi ${zcls(z)}"><div class="l">${T(k === 'CCC_OAS' ? 'CCC' : SHORT[k], SHORT[k])}</div><div class="v">${r.v[j].toFixed(0)}<span class="small">bp</span></div><div class="s">z ${fz(z)}（${k === 'BAA10Y' ? '比 1986 年以来' : '比过去 3 年'}）· ${zone(z)}</div></div>`; }).join('')}</div>
          <p class="small">你计划里的信用预警：HY 利差超过 350bp，<b>并且</b> IG 利差 3 个月扩大超过 20bp。现在 HY ${h.v[i].toFixed(0)}bp（还差 ${(350 - h.v[i]).toFixed(0)}bp），IG 3 个月变化 ${igch == null ? '—' : U.sgn(igch, 0, 'bp')}。${h.v[i] > 350 && igch > 20 ? '<b>两半都成立。</b>' : '<b>目前不成立。</b>'}</p>
          <details class="more"><summary>完整读数表</summary><div class="body tablewrap"><table><thead><tr><th>序列</th><th>利差</th><th>z（3 年）</th><th>z（10 年）</th><th>z（全部过去）</th><th>百分位（3 年）</th><th>百分位（全部过去）</th></tr></thead><tbody>
          ${['HY_OAS','IG_OAS','CCC_OAS','BAA10Y'].map(k => { const r = W2[k], j = r.d.length-1; return `<tr><td>${NAMES[k]}</td><td>${r.v[j].toFixed(0)}bp</td><td>${fz(r.z3[j])}</td><td>${fz(r.z10[j])}</td><td>${fz(r.ze[j])}</td><td>${fp(r.p3[j])}</td><td>${fp(r.pe[j])}</td></tr>`; }).join('')}
          </tbody></table><p class="small muted">HY、IG、CCC 只有 3 年数据，10 年窗口算不了（显示 —），“全部过去”也就是这 3 年。</p></div></details>
        </div>
        <div class="card" style="margin-top:16px">
          <div class="btns"><span class="lbl">看哪条</span>${['BAA10Y','HY_OAS','IG_OAS','CCC_OAS'].map(k => `<button class="btn small" data-s="${k}">${SHORT[k]}${k === 'BAA10Y' ? '（1986 起）' : '（3 年）'}</button>`).join('')}</div>
          <div class="chart-title" id="w2-t1"></div><div id="w2-spread"></div>
          <div class="chart-title">z 分数<span>只用过去的数据；底色：蓝 = 偏紧，黄 = 有压力，红 = 接近危机</span></div><div id="w2-z"></div>
          <div class="slider"><span>自己定窗口</span><input type="range" min="52" max="1040" step="26" id="w2-win"><span class="v" id="w2-winv"></span></div>
          <p class="small" id="w2-winout"></p>
        </div>
        <div class="card" style="margin-top:16px"><h3 style="margin-top:0">诚实的 z 和偷看未来的 z（BAA10Y）</h3>
          <div class="tablewrap"><table><thead><tr><th>月份</th><th>利差</th><th>诚实：比过去全部</th><th>诚实：比过去 10 年</th><th>诚实：比过去 3 年</th><th style="color:var(--r)">偷看：连未来一起比</th></tr></thead><tbody>
          ${W2.compare.map(c => `<tr><td>${c.month}</td><td>${c.spread.toFixed(0)}bp</td><td>${fz(c.ze)}</td><td>${fz(c.z10)}</td><td>${fz(c.z3)}</td><td style="color:var(--r)">${fz(c.zla)}</td></tr>`).join('')}
          </tbody></table></div>
          <p class="small muted">红色这一列用了 ${W2.BAA10Y.d[0].slice(0,4)}–${U.last(W2.BAA10Y.d).slice(0,4)} 全部数据（平均 ${W2.BAA10Y.full_mean.toFixed(0)}bp，标准差 ${W2.BAA10Y.full_sd.toFixed(0)}bp），当时不可能知道，只用来对比。</p></div>
        <div class="card" style="margin-top:16px"><h3 style="margin-top:0">${T('肥尾')}：每周变化的分布</h3><canvas class="hist" id="w2-hist"></canvas><p class="small" id="w2-histtxt"></p>
          <details class="more"><summary>手算核对一周</summary><div class="body"><p class="small">${hc.series}，${hc.week} 这一周 ${hc.today.toFixed(0)}bp，拿之前 ${hc.window_weeks} 周（不含本周）来比。</p>
          <div class="formula">最早 5 周：${hc.first5.map(x => x.toFixed(0)).join('、')}　最近 5 周：${hc.last5.map(x => x.toFixed(0)).join('、')}<br>${hc.window_weeks} 周的平均 = ${hc.mean.toFixed(1)}bp，标准差 = ${hc.sd.toFixed(1)}bp<br>z = (${hc.today.toFixed(0)} − ${hc.mean.toFixed(1)}) ÷ ${hc.sd.toFixed(1)} = <b>${fz(hc.z)}</b></div>
          <p class="small muted" style="margin:0">和图上“3 年窗口”最后一个点一致（数据脚本里有自动核对）。</p></div></details></div>`;
      U.$$('[data-s]', lock).forEach(b => b.onclick = () => { state.key = b.dataset.s; update(); });
      U.$('#w2-win').oninput = () => { state.win = +U.$('#w2-win').value; clearTimeout(drawLocked._t); drawLocked._t = setTimeout(update, 80); };
      update();
    }
    function update(){
      const k = state.key, r = W2[k]; U.$$('[data-s]', lock).forEach(b => b.classList.toggle('on', b.dataset.s === k));
      const x = r.d.map(U.ts);
      U.$('#w2-t1').innerHTML = `${NAMES[k]}<span>周度，单位 bp</span>`;
      Charts.line(U.$('#w2-spread'), { x, ys:[r.v], labels:['利差'], range:'ALL', height:200, colors:[U.css('--ink2')], fmt: v => v == null ? '—' : v.toFixed(0) + 'bp',
        hlines: k === 'HY_OAS' ? [{ y:350, label:'你的预警线 350bp' }] : [] });
      U.$('#w2-win').value = state.win; U.$('#w2-winv').textContent = `${state.win} 周 ≈ ${(state.win/52).toFixed(1)} 年`;
      const cz = rollingZ(r.v, state.win);
      const bands = [{ from:-99, to:-1, color:'rgba(59,110,168,.10)' }, { from:1, to:2, color:U.css('--y-soft') }, { from:2, to:99, color:U.css('--r-soft') }];
      Charts.line(U.$('#w2-z'), { x, ys:[r.z3, r.z10, r.ze, cz.z], labels:['比过去 3 年', '比过去 10 年', '比过去全部', `比过去 ${state.win} 周`], range:'ALL', height:230, bands,
        colors:[U.css('--chart1'), U.css('--chart3'), U.css('--chart4'), U.css('--chart2')], widths:[1.4, 1.4, 1.4, 2.2], fmt: v => fz(v),
        hlines:[{ y:0, color:U.css('--ink3'), dash:false }] });
      const j = r.d.length-1;
      U.$('#w2-winout').innerHTML = cz.z[j] == null ? `数据不够：这条只有 ${r.d.length} 周，${state.win} 周的窗口在最新一周算不出来。` :
        `拿过去 ${state.win} 周来比，最新一周（${r.d[j]}，${r.v[j].toFixed(0)}bp）的 z = <b>${fz(cz.z[j])}</b>，百分位 <b>${fp(cz.pr[j])}</b>，属于“${zone(cz.z[j])}”。`;
      hist(r, k);
    }
    function hist(r, k){
      const cv = U.$('#w2-hist'), { ctx, w:W, h:H } = Cv.setup(cv, 260);
      const ch = []; for (let i = 1; i < r.v.length; i++) ch.push(r.v[i] - r.v[i-1]);
      const m = U.mean(ch), sd = Math.sqrt(U.mean(ch.map(x => (x-m)**2)));
      const lo = -5, hi = 5, nb = 40, bw = (hi-lo)/nb, cnt = new Array(nb).fill(0); let out = 0;
      ch.forEach(x => { const z = (x-m)/sd; if (z < lo || z >= hi) out++; else cnt[Math.floor((z-lo)/bw)]++; });
      const pad = { l:36, r:10, t:10, b:28 }, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
      const pdf = z => Math.exp(-z*z/2)/Math.sqrt(2*Math.PI) * ch.length * bw;
      const ymax = Math.max(...cnt, pdf(0)) * 1.1;
      const X = z => pad.l + (z-lo)/(hi-lo)*pw, Y = c => pad.t + ph - c/ymax*ph;
      ctx.fillStyle = U.css('--chart1'); cnt.forEach((c, i) => { if (c) ctx.fillRect(X(lo + i*bw)+1, Y(c), pw/nb - 2, pad.t + ph - Y(c)); });
      ctx.strokeStyle = U.css('--r'); ctx.lineWidth = 2; ctx.beginPath(); for (let z = lo; z <= hi; z += 0.05){ const px = X(z), py = Y(pdf(z)); z === lo ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.stroke();
      ctx.fillStyle = U.css('--ink3'); ctx.textAlign = 'center';
      for (let z = -4; z <= 4; z += 2) ctx.fillText((z > 0 ? '+' : z < 0 ? '−' : '') + Math.abs(z) + ' 个标准差', X(z), H - 10);
      ctx.textAlign = 'left';
      const b3 = ch.filter(x => Math.abs(x-m) > 3*sd).length, e3 = ch.length * 0.0026998, b4 = ch.filter(x => Math.abs(x-m) > 4*sd).length, e4 = ch.length * 6.334e-5;
      U.$('#w2-histtxt').innerHTML = `蓝柱 = ${SHORT[k]} 每周变化的真实分布（${ch.length} 周）；红线 = 如果是${T('正态分布', '钟形曲线')}应该长什么样。<br>
        超过 3 个标准差的周：实际 <b>${b3}</b> 周，钟形曲线预计约 <b>${e3.toFixed(1)}</b> 周；超过 4 个标准差：实际 <b>${b4}</b> 周，预计约 <b>${e4.toFixed(2)}</b> 周。${out ? `（另有 ${out} 周超过 5 个标准差，图上画不下）` : ''}${k !== 'BAA10Y' ? '<br><span class="muted">这条只有 3 年，样本少，肥尾主要看 BAA10Y。</span>' : ''}`;
    }
    function takeaways(el){
      const h = W2.HY_OAS, b = W2.BAA10Y, i = h.d.length-1, j = b.d.length-1, c = W2.compare, a07 = c.find(x => x.month === '2007-06'), a08 = c.find(x => x.month === '2008-11'), a22 = c.find(x => x.month === '2022-10');
      const ch = []; for (let k = 1; k < b.v.length; k++) ch.push(b.v[k] - b.v[k-1]); const m = U.mean(ch), sd = Math.sqrt(U.mean(ch.map(x => (x-m)**2))), b3 = ch.filter(x => Math.abs(x-m) > 3*sd).length, e3 = ch.length * 0.0026998;
      el.innerHTML = `<ol class="takeaways">
        <li><b>同一个今天，换段过去来比，结论可以相反。</b>HY 利差和过去 3 年比 z ${fz(h.z3[i])}（偏高）；BAA10Y 和 1986 年以来比 z ${fz(b.ze[j])}（偏低）。过去 3 年特别平静，所以显得高；放到 40 年里看，还很低。</li>
        <li><b>利差低不等于安全。</b>2007 年 6 月三个窗口的 z 都是负的（${fz(a07.ze)}），17 个月后冲到 ${fz(a08.ze)}。z 像温度计，告诉你现在多热，但不是天气预报。</li>
        <li><b>2022 年信用没报警。</b>那年标普跌了 25%，BAA10Y 的 z 只有 ${fz(a22.ze)}。加息推动的熊市里企业没出现违约潮，所以你的计划里还需要单独的利率预警。</li>
        <li><b>极端情况比课本多。</b>超过 3 个标准差的周实际有 ${b3} 周，钟形曲线预计只有 ${e3.toFixed(1)} 周。z 只用来说“现在多不寻常”，不能直接换算成“发生概率”。</li></ol>
        <details class="more"><summary>完整解读（投资助手撰写）</summary><div class="body md">${window.INTERP && INTERP.week2 ? U.md(INTERP.week2) : '暂无'}</div></details>`;
    }
    drawLocked();
  }
  return { render, rollingZ };
})();
