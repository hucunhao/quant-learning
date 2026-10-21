// 我的笔记：只存在这台设备的浏览器里，可以导出 / 导入
const Notes = (() => {
  const K = 'ql_notes';
  const QT = { w1q1:'第 1 周 · 标普跌 20%、纳指跌 25% 以上发生过几轮', w1q2:'第 1 周 · −10% 触发后一年 vs 随便哪天买', w2q1:'第 2 周 · 今天的 HY 利差算高还是低', w2q2:'第 2 周 · 偷看未来会让 2008 年更吓人还是更不吓人',
    w3q1:'第 3 周 · 2008 年哪条规则躲得最多', w3q2:'第 3 周 · 加上 QDII 成本后几条规则过线' };
  const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10); };
  function render(app){
    const list = U.store.get(K, []), P = Predict.all();
    app.innerHTML = `<h1>我的笔记</h1><p class="lead">记下每周学到的东西和自己的想法。只保存在这台设备的浏览器里，换设备或清理浏览器会丢，记得定期导出备份。</p>
      <div class="card noteform">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:10px"><label>日期 <input type="date" id="n-date" value="${today()}" class="inline-in" style="width:160px"></label></div>
        <textarea id="n-text" placeholder="这周最意外的是什么？哪个概念还没想通？打算做什么、不做什么？"></textarea>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" id="n-save">保存</button>
        <span style="flex:1"></span><button class="btn" id="n-export">导出备份</button><label class="btn">导入备份<input type="file" id="n-import" accept=".json,application/json" style="display:none"></label></div>
      </div>
      <h2>记录（${list.length} 条）</h2><div class="card" id="n-list"></div>
      <h2>我的猜测</h2><div class="card" id="n-pred">${Object.keys(QT).map(id => `<div class="note-item"><span class="d">${QT[id]}</span><p style="margin:4px 0 0">${P[id] ? U.esc(P[id]) : '<span class="muted">还没猜</span>'}</p></div>`).join('')}
        <button class="btn small" id="n-reset" style="margin-top:12px">清空所有猜测，重新体验一遍</button></div>
      <details class="more" style="margin-top:24px"><summary>试过的所有版本（每一周的完整记录）</summary><div class="body md">${window.INTERP && INTERP.tried ? U.md(INTERP.tried) : '暂无'}</div></details>`;
    const draw = () => { const l = U.store.get(K, []).sort((a, b) => b.date.localeCompare(a.date) || b.t - a.t);
      U.$('#n-list').innerHTML = l.length ? l.map(x => `<div class="note-item"><span class="d">${x.date}</span> <button class="btn small" data-del="${x.t}" style="float:right">删除</button><p style="margin:4px 0 0;white-space:pre-wrap">${U.esc(x.text)}</p></div>`).join('') : '<p class="muted" style="margin:0">还没有笔记。</p>';
      U.$$('[data-del]').forEach(b => b.onclick = () => { if (!confirm('删除这条笔记？')) return; U.store.set(K, U.store.get(K, []).filter(x => String(x.t) !== b.dataset.del)); render(app); }); };
    draw();
    U.$('#n-save').onclick = () => { const text = U.$('#n-text').value.trim(); if (!text) return; const l = U.store.get(K, []); l.push({ date: U.$('#n-date').value || today(), text, t: Date.now() }); U.store.set(K, l); render(app); };
    U.$('#n-reset').onclick = () => { if (!confirm('清空所有猜测？各周的数据会重新锁上。')) return; U.store.set(Predict.K, {}); render(app); };
    U.$('#n-export').onclick = () => { const blob = new Blob([JSON.stringify({ notes: U.store.get(K, []), predictions: Predict.all() }, null, 2)], { type:'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `量化学习-笔记-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
    U.$('#n-import').onchange = e => { const f = e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { try { const o = JSON.parse(rd.result); const inc = Array.isArray(o) ? o : o.notes || [];
      const l = U.store.get(K, []), seen = new Set(l.map(x => x.t)); inc.forEach(x => { if (x && x.date && x.text && !seen.has(x.t)) l.push({ date:x.date, text:x.text, t:x.t || Date.now() + Math.random() }); });
      U.store.set(K, l); if (o.predictions) U.store.set(Predict.K, Object.assign(Predict.all(), o.predictions)); render(app); } catch(err){ alert('文件格式不对：' + err.message); } }; rd.readAsText(f); };
  }
  return { render };
})();
