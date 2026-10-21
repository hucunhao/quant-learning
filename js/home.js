// 课程首页
const Home = (() => {
  const WEEKS = [
    { n:1, href:'week1.html', title:'回撤：分档加仓多久触发一次', q:'你的每一档加仓，1990 年以来触发过几次？买完一年后怎么样？', spark:'dd', ids:['w1q1','w1q2'] },
    { n:2, href:'week2.html', title:'信用利差的 z 分数', q:'今天的信用利差和它自己的过去比，算紧还是松？换个比法会怎样？', spark:'z', ids:['w2q1','w2q2'] },
    { n:3, href:'week3.html', title:'信用和 VIX 规则检验', q:'信号一坏就卖、好了再买，真的能躲开熊市吗？加上 QDII 成本呢？', spark:'eq', ids:['w3q1','w3q2'] },
    { n:4, title:'你的分档加仓有没有用', q:'按你的规则（定投 + 三档加仓）从 1990 年跑到今天，和“只定投”“一次买完”比，最终结果、最大亏损、最难熬的时间各差多少？', plan:'工具：调月定投金额、档位和每档比例，看资产曲线和最大亏损。先猜：加仓规则能多赚多少，还是反而更少？' },
    { n:5, title:'市场阶段分类器', q:'把 Market Dashboard 上的“市场阶段”放回过去每一天去算：各阶段出现过多少天？之后股市的表现有没有明显不同？', plan:'只用当天之前能拿到的数据。工具：时间轴上给每个阶段涂色，点某一天看当时每个条件的结果。' },
    { n:6, title:'拆穿过度拟合', q:'为什么在历史里挑出“最好的参数”，以后多半失灵？', plan:'前一半历史里挑参数，后一半里检验；再把信号日期随机打乱，看靠运气能不能拿到同样的成绩。' },
  ];
  function spark(cv, kind){
    const { ctx, w, h } = Cv.setup(cv, 70), H = window.HOME; if (!H) return;
    const draw = (a, col, lo, hi, fill) => { const X = i => i/(a.length-1)*w, Y = v => 4 + (hi - v)/(hi - lo)*(h - 8);
      ctx.beginPath(); a.forEach((v, i) => i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v)));
      if (fill){ ctx.lineTo(w, Y(0)); ctx.lineTo(0, Y(0)); ctx.fillStyle = fill; ctx.fill(); } else { ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.stroke(); } };
    if (kind === 'dd'){ draw(H.dd, null, -0.6, 0, 'rgba(224,138,46,.35)'); ctx.fillStyle = '#8b939b'; ctx.fillText('标普 1990 年以来的回撤', 4, h - 8); }
    if (kind === 'z'){ ctx.fillStyle = 'rgba(196,85,63,.10)'; const Y = v => 4 + (7 - v)/9*(h - 8); ctx.fillRect(0, Y(7), w, Y(2) - Y(7)); draw(H.z, '#3b6ea8', -2, 7); ctx.fillStyle = '#8b939b'; ctx.fillText('BAA10Y 的 z 分数', 4, 10); }
    if (kind === 'eq'){ const lg = a => a.map(Math.log); const all = [...lg(H.eq), ...lg(H.bh)], lo = Math.min(...all), hi = Math.max(...all); draw(lg(H.bh), '#b9b3a8', lo, hi); draw(lg(H.eq), '#3b6ea8', lo, hi); ctx.fillStyle = '#8b939b'; ctx.fillText('规则（蓝） vs 一直拿着（灰）', 4, 10); }
  }
  function render(app){
    const P = Predict.all();
    app.innerHTML = `
      <div class="hero"><div class="muted small">6 周课程 · 已开放 3 周</div>
        <h1>用数据检验你自己的投资计划</h1>
        <p class="lead">每周只回答一个关于你自己计划的问题。先凭直觉猜，再用动画弄懂要用到的概念，最后看 1986 年以来的真实数据。不用会写代码，也不用先懂数学。</p></div>
      <h2>每一周都是这 5 步</h2>
      <div class="flow" id="flow">
        <div class="f"><b>① 先猜</b>写下直觉，答案先藏着</div>
        <div class="f"><b>② 看懂概念</b>动画和滑块，先看数字再看式子</div>
        <div class="f"><b>③ 看数据</b>提交猜测后才解锁</div>
        <div class="f"><b>④ 要点</b>几句话总结，完整解读可展开</div>
        <div class="f"><b>⑤ 要小心</b>这份结果不能说明什么</div>
      </div>
      <h2>课程</h2>
      <div class="weeks">${WEEKS.map(w => w.href ? `
        <a class="week" href="${w.href}"><span class="st">${w.ids.every(id => P[id]) ? '<span class="tag g">已猜过</span>' : '<span class="tag">开始</span>'}</span>
          <div class="wk">第 ${w.n} 周</div><h3>${w.title}</h3><canvas data-spark="${w.spark}"></canvas><p>${w.q}</p></a>` : `
        <div class="week soon" id="${w.n === 4 ? 'later' : ''}"><span class="st"><span class="tag">即将开放</span></span>
          <div class="wk">第 ${w.n} 周</div><h3>${w.title}</h3><p>${w.q}</p>
          <details class="small" style="margin-top:8px"><summary style="cursor:pointer;color:var(--accent)">计划怎么做</summary><p style="margin-top:6px;color:var(--ink2)">${w.plan}</p></details></div>`).join('')}</div>
      <div class="card" style="margin-top:28px;display:flex;align-items:center;gap:18px;flex-wrap:wrap">
        <div style="flex:1;min-width:260px"><b>每天的市场读数在 Market Dashboard</b><p class="small muted" style="margin:4px 0 0">这里的数据是固定的历史快照，用来学习；今天的利差、回撤、VIX 等读数每天在 Market Dashboard 更新。</p></div>
        <a class="btn primary" href="${DASHBOARD}" target="_blank" rel="noopener">打开 Market Dashboard ↗</a></div>`;
    U.$$('canvas[data-spark]').forEach(c => spark(c, c.dataset.spark));
    window.addEventListener('resize', () => U.$$('canvas[data-spark]').forEach(c => spark(c, c.dataset.spark)));
    const fs = U.$$('#flow .f'); let k = 0;
    const tick = () => { fs.forEach((f, i) => f.classList.toggle('on', i <= k)); k = (k + 1) % (fs.length + 2); };
    tick(); setInterval(tick, 900);
  }
  return { render };
})();
