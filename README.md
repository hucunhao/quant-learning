# 量化学习 · 6 周课程

把 Market Dashboard 里的学习部分单独拿出来做成的学习网站。纯静态（HTML / CSS / JS），不需要编译，GitHub Pages 选 `main` 分支根目录即可。

- 网址（发布后）：https://hucunhao.github.io/quant-learning/
- 每天的市场读数：https://hucunhao.github.io/macro-notebook/

## 页面
- `index.html` 课程首页：每周 5 步流程、6 周课程卡片（第 4–6 周“即将开放”）
- `week1.html` 回撤和分档加仓
- `week2.html` 信用利差的 z 分数
- `week3.html` 信用和 VIX 规则检验
- `notes.html` 我的笔记、我的猜测、试过的所有版本

每一周都是：先猜（提交后才显示答案，两题都提交才解锁数据）→ 看懂概念（canvas 动画 + 滑块）→ 看数据 → 要点和解读 → 要小心。

## 数据
`data/` 里是固定的历史快照，不每天更新：
- `series_lite.js`：标普 500、纳指 100、BAA10Y、HY OAS、IG OAS 日线
- `week1.js` / `week2.js` / `week3.js`：第 1–3 周的计算结果（由 Market Dashboard 仓库里的 `update_data.py` 和 `week3_backtest.py` 生成）
- `interp.js`：`content/` 里的解读和“试过的版本”记录
- `home.js`：首页小图

想刷新快照：在有 macro-site 的机器上运行 `python3 build_data.py /path/to/macro-site`。

## 其他
- 图表库：uPlot 1.6.30（`vendor/`，MIT 许可），不用任何 CDN。
- 猜测和笔记只存在浏览器 localStorage（`ql_predict`、`ql_notes`），笔记页可以导出 / 导入。
- 只用于个人学习，不构成投资建议。
