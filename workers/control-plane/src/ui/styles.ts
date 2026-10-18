/**
 * Styles for /deploy and /deploy/{id}, on top of the Console shell (views.ts STYLES). Neobrutalist: white surfaces,
 * black chrome, 2px #111 borders, hard offset shadows, #ff5f1f accents. Every keyframe animation has a static
 * fallback under prefers-reduced-motion.
 */
export const DEPLOY_STYLES = `
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.ic{display:inline-block;flex:none}
.btn .ic{width:14px;height:14px}
.btn:focus-visible,.chip:focus-visible,.seg-b:focus-visible,.dt-sort:focus-visible,.card-h-btn:focus-visible,.bf-btn:focus-visible,.bf-open:focus-visible,.lc-arrow:focus-visible,.lc-dot:focus-visible,.nm-btn:focus-visible,.sync-btn:focus-visible,.ov-x:focus-visible,.tl-more:focus-visible,.tl-sum:focus-visible,.term-older:focus-visible,.term-jump:focus-visible,.toast-x:focus-visible,.dp-url:focus-visible,.dt-name:focus-visible,.dt-url:focus-visible,.ms-wrap summary:focus-visible,.crumbs a:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.btn.sm .spin{width:10px;height:10px}
.btn[disabled]{opacity:.5;box-shadow:none;cursor:not-allowed;transform:none}
.btn[aria-busy=true]{opacity:1;background:var(--accent-soft);border-style:dashed}
.btn.dark .ic{color:var(--accent)}
.muted{color:var(--muted)}
.small{font-size:13px;color:var(--muted);line-height:1.5}
.table-scroll{overflow-x:auto}

/* Spinner: a square that turns; static half-filled square under reduced motion. */
.spin{display:inline-block;width:12px;height:12px;border:2px solid currentColor;border-right-color:transparent;border-bottom-color:transparent;animation:spin .7s linear infinite;flex:none;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{50%{opacity:.3}}
@keyframes blink{50%{opacity:0}}

/* Status pill (confirmed state), transition chip (requested), health */
.pill{display:inline-flex;align-items:center;gap:8px;font:700 12px var(--mono);text-transform:uppercase;letter-spacing:.6px;border:2px solid var(--ink);padding:4px 10px 4px 8px;background:#fff;color:var(--ink);white-space:nowrap;box-shadow:2px 2px 0 var(--ink)}
.pill-sm{font-size:10.5px;padding:2px 7px 2px 6px;gap:6px;box-shadow:none;border-width:1.5px}
.pill-dot{width:9px;height:9px;flex:none;border:1.5px solid var(--ink);background:#bbb}
.pill-sm .pill-dot{width:7px;height:7px;border-width:1px}
.pill[data-tone=ok]{background:#dcfce7}.pill[data-tone=ok] .pill-dot{background:#16a34a}
.pill[data-tone=run]{background:var(--accent-soft)}.pill[data-tone=run] .pill-dot{background:var(--accent);animation:pulse 1.2s ease-in-out infinite}
.pill[data-tone=err]{background:#fee2e2;color:#7f1d1d}.pill[data-tone=err] .pill-dot{background:#dc2626}
.pill[data-tone=off]{background:#e9e8e4;color:#333}.pill[data-tone=off] .pill-dot{background:#777}
.pill[data-tone=wait]{background:#fff;color:#555}
.trans{display:inline-flex;align-items:center;gap:7px;font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.4px;border:2px dashed var(--accent);padding:3px 9px;background:#fff;color:#9a3412;white-space:nowrap}
.trans-sub{font:400 11.5px var(--sans);text-transform:none;letter-spacing:0;color:var(--muted)}
.health{display:inline-flex;align-items:center;gap:7px;font-size:13px;color:#333;white-space:nowrap}
.health-dot{width:9px;height:9px;flex:none;border:1.5px solid var(--ink);background:#d4d4d0}
[data-health=healthy] .health-dot{background:#16a34a}
[data-health=starting] .health-dot{background:var(--accent);animation:pulse 1.2s ease-in-out infinite}
[data-health=unhealthy] .health-dot{background:#dc2626}
[data-health=stopped] .health-dot{background:#777}
.env{display:inline-block;background:#111;color:#fff;padding:1px 6px;font:700 10px var(--mono);letter-spacing:.6px;text-transform:uppercase;line-height:1.6}

/* Page header: black chrome bar + white hero */
.dp,.dl{max-width:1380px;margin:0 auto}
.dp-head{background:#fff;border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);margin-bottom:28px}
.dp-bar{display:flex;justify-content:space-between;align-items:center;gap:8px 16px;background:#111;color:#aaa;padding:8px 12px 8px 18px;flex-wrap:wrap;min-height:46px}
.crumbs{display:flex;align-items:center;gap:10px;font:600 11.5px var(--mono);text-transform:uppercase;letter-spacing:.5px;min-width:0}
.crumbs>a{color:#aaa;text-decoration:none}.crumbs>a:hover{color:#fff}
.crumbs>span{color:#555}
.crumb-cur{color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:46vw;text-transform:none;letter-spacing:0;font-weight:500}
.nm{position:relative;min-width:0}
.nm-btn{display:inline-flex;align-items:center;gap:8px;background:#1d1d1d;border:1.5px solid #3a3a3a;color:#fff;font:inherit;padding:4px 8px;cursor:pointer;max-width:100%}
.nm-btn:hover{border-color:var(--accent)}
.nm-pop{position:absolute;left:0;top:calc(100% + 10px);z-index:40;width:min(360px,calc(100vw - 40px));background:#fff;color:var(--ink);border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink)}
.nm-head{font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.5px;color:var(--muted);padding:9px 12px;border-bottom:2px solid var(--ink);background:#f6f5f2}
.nm-list{list-style:none}
.nm-list a{display:flex;align-items:center;gap:10px;padding:10px 12px;text-decoration:none;border-bottom:1px dashed #ddd;text-transform:none;letter-spacing:0;font:500 13px var(--sans);color:var(--ink)}
.nm-list li:last-child a{border-bottom:0}
.nm-list a:hover,.nm-list a:focus-visible{background:var(--accent-soft);outline:none}
.nm-dot{width:9px;height:9px;flex:none;border:1.5px solid var(--ink);background:#bbb}
.nm-dot[data-tone=ok]{background:#16a34a}.nm-dot[data-tone=run]{background:var(--accent)}.nm-dot[data-tone=err]{background:#dc2626}.nm-dot[data-tone=off]{background:#777}
.nm-name{flex:1;min-width:0;font-family:var(--mono);font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nm-st{font:600 10px var(--mono);text-transform:uppercase;color:var(--muted)}
.nm-list a.nm-all{font:700 11px var(--mono);text-transform:uppercase;justify-content:flex-end;background:#111;color:#fff}
.nm-list a.nm-all:hover,.nm-list a.nm-all:focus-visible{background:var(--accent);color:#111}

.sync{display:inline-flex;align-items:center;gap:9px;font:11.5px var(--mono);color:var(--muted);flex-wrap:wrap}
.sync.dark{color:#8a8a8a}
.sync-dot{width:8px;height:8px;flex:none;background:#16a34a;border:1.5px solid currentColor}
.sync .spin{width:10px;height:10px;color:var(--accent)}
.sync.stale{color:#b43c0c}.sync.stale .sync-dot{background:var(--accent);animation:pulse 1s ease-in-out infinite}
.sync.dark.stale{color:#ffb08a}
.sync.stale strong{font-weight:700}
.sync-btn{display:inline-flex;align-items:center;gap:6px;font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;border:1.5px solid currentColor;background:transparent;color:inherit;padding:4px 8px;cursor:pointer}
.sync-btn .ic{width:12px;height:12px}
.sync.dark .sync-btn{color:#fff;border-color:#444}
.sync-btn:hover:not(:disabled){border-color:var(--accent);color:var(--accent)}
.sync-btn:disabled{opacity:.45;cursor:default}
.sync.stale .sync-btn{background:var(--accent);border-color:var(--accent);color:#111}

.dp-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px 28px;padding:24px 24px 24px;flex-wrap:wrap;background-image:linear-gradient(90deg,var(--accent) 0 6px,transparent 6px)}
.dp-title{min-width:0;flex:1 1 440px}
.dp-kicker{display:flex;gap:6px 10px;flex-wrap:wrap;align-items:center;font:12px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.3px;margin-bottom:8px}
.dp-kicker>span:not(.env)+span::before{content:'/';margin-right:10px;color:#c4c4c0}
.dp-title h1{font-size:clamp(26px,3.1vw,42px);line-height:1;overflow-wrap:anywhere}
.dp-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;margin-top:16px}
.dp-url{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--ink);text-decoration:none;border-bottom:2px solid var(--accent);padding-bottom:1px;word-break:break-all}
.dp-url:hover{background:var(--accent-soft)}
.dp-actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center}

/* Layout */
.dp-grid{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:28px;align-items:start}
.dp-col{display:flex;flex-direction:column;gap:28px;min-width:0}
section.card{box-shadow:4px 4px 0 var(--ink)}
.card-h{display:flex;justify-content:space-between;align-items:center;gap:12px;font:700 12px var(--mono);text-transform:uppercase;letter-spacing:.6px;padding:12px 16px;border-bottom:2px solid var(--ink);min-height:48px}
.card-h>span:first-child::before{content:'';display:inline-block;width:9px;height:9px;background:var(--accent);border:1.5px solid var(--ink);margin-right:10px;vertical-align:0}
.card-h-note{font:400 12px var(--mono);color:var(--muted);text-transform:none;letter-spacing:0}
.card-h-accent{color:var(--accent);font-weight:800}
.card-h-btn{display:inline-flex;align-items:center;gap:6px;font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;border:1.5px solid var(--ink);background:#fff;color:var(--ink);padding:5px 8px;cursor:pointer;box-shadow:2px 2px 0 var(--ink)}
.card-h-btn:hover{background:var(--accent-soft)}
.card-h-btn .ic{width:13px;height:13px}
.card-b{padding:16px}

/* Progress: halo + current operation */
.pg-top{display:flex;gap:20px;align-items:center;padding:20px 16px 18px}
.halo{position:relative;flex:none}
.halo svg{display:block;overflow:visible}
.halo-shadow{fill:#111}
.halo-plate,.halo-hole{fill:#fff;stroke:#111;stroke-width:2.5}
.halo-seg{fill:none;stroke-width:13;stroke-dasharray:1 1;stroke-linecap:butt}
.halo-seg[data-tone=done]{stroke:#111}
.halo-seg[data-tone=active]{stroke:var(--accent);stroke-dasharray:.035 .02;animation:march 1s linear infinite}
.halo-seg[data-tone=fail]{stroke:#dc2626}
.halo-seg[data-tone=todo]{stroke:#e6e4de}
.halo-spin{transform-box:view-box;transform-origin:60px 60px;animation:spin 1.3s linear infinite}
.halo-spin .halo-seg{stroke-dasharray:1 1;animation:none}
@keyframes march{to{stroke-dashoffset:-.055}}
.halo-center{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--display);font-weight:800;pointer-events:none}
.halo-count{font-size:22px;line-height:1;color:var(--muted);letter-spacing:-.5px}
.halo-count b{color:var(--ink);font-size:36px}
.halo-done,.halo-fail{width:42px;height:42px;display:grid;place-items:center;border:2px solid var(--ink)}
.halo-done{background:#111;color:#fff}.halo-off{background:#fff;color:#111}.halo-done .ic{width:24px;height:24px}
.halo-fail{background:#dc2626;color:#fff;font-size:28px}
.pg-now{min-width:0}
.pg-head{font-size:24px;line-height:1}
.pg-detail{font-size:13.5px;color:#333;margin-top:7px;line-height:1.45}
.pg-since{font-size:10.5px;color:var(--muted);margin-top:8px;text-transform:uppercase;letter-spacing:.4px}
.pg-actions{margin-top:12px}

/* Marker timeline */
.ms{list-style:none;padding:4px 16px 14px;border-top:2px solid var(--ink)}
.ms-i{position:relative;display:grid;grid-template-columns:26px minmax(0,1fr);gap:12px;padding:11px 0 9px}
.ms-i::before{content:'';position:absolute;left:12px;top:38px;bottom:-12px;width:2px;background:repeating-linear-gradient(#c4c4c0 0 4px,transparent 4px 8px)}
.ms-i[data-state=completed]::before{background:#111}
.ms-i:last-child::before{display:none}
.ms-mark{position:relative;z-index:1;width:26px;height:26px;border:2px solid var(--ink);background:#fff;display:grid;place-items:center;font:700 11px var(--mono)}
.ms-mark .ic{width:14px;height:14px}
.ms-i[data-state=completed] .ms-mark{background:#111;color:#fff}
.ms-i[data-state=active] .ms-mark{background:var(--accent);box-shadow:2px 2px 0 var(--ink)}
.ms-i[data-state=failed] .ms-mark{background:#dc2626;color:#fff;box-shadow:2px 2px 0 var(--ink)}
.ms-i[data-state=pending] .ms-mark{color:#999;border-color:#c4c4c0}
.ms-pulse{width:8px;height:8px;background:#111;animation:pulse .9s ease-in-out infinite}
.ms-bang{font:800 16px var(--display)}
.ms-row{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.ms-label{font-weight:600;font-size:14px}
.ms-i[data-state=pending] .ms-label{color:#8a8a8a;font-weight:500}
.ms-i[data-state=active] .ms-label{font-weight:700}
.ms-time{font:11px var(--mono);color:var(--muted);white-space:nowrap}
.ms-detail{font-size:12.5px;color:var(--muted);margin-top:2px;line-height:1.45}
.ms-i[data-state=failed] .ms-detail{color:#991b1b;font-family:var(--mono);font-size:11.5px;overflow-wrap:anywhere;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.ms-note{font:11px/1.45 var(--mono);color:#7c2d12;background:var(--accent-soft);border-left:3px solid var(--accent);padding:5px 8px;margin-top:6px;overflow-wrap:anywhere}
.ms-wrap{border-top:2px solid var(--ink)}
.ms-wrap summary{cursor:pointer;font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;padding:12px 16px;list-style:none;display:flex;justify-content:space-between;align-items:center}
.ms-wrap summary::-webkit-details-marker{display:none}
.ms-wrap summary::after{content:'+';font:700 16px var(--mono);line-height:1}
.ms-wrap[open] summary::after{content:'−'}
.ms-wrap summary:hover{background:#f6f5f2}
.ms-wrap .ms{border-top:1px dashed #d4d4d0}

/* Failure and next step */
.fail{margin:0 16px 18px;border:2px solid #991b1b;background:#fef2f2;box-shadow:4px 4px 0 #991b1b;padding:13px 14px}
.fail-head{display:flex;align-items:center;gap:8px;font:700 11.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;color:#991b1b}
.fail-msg{margin-top:8px;font:12px/1.5 var(--mono);color:#450a0a;overflow-wrap:anywhere}
.fail-pre{white-space:pre-wrap}
.fail-msg .tl-more{color:#991b1b;margin:4px 0 0}
.fail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.fail-help{font-size:12px;color:#7f1d1d;margin-top:10px;line-height:1.45}
.fail-help .mono{font-size:11px;overflow-wrap:anywhere}
.next{margin:0 16px 18px;border:2px solid var(--ink);border-left:8px solid var(--accent);background:var(--accent-soft);padding:12px 14px}
.next-k{font:700 10px var(--mono);text-transform:uppercase;letter-spacing:.5px;color:#9a3412;margin-bottom:3px}
.next strong{font-size:15px}
.next p{font-size:13px;color:#444;margin:4px 0 10px;line-height:1.45}

/* Overview */
.kv-list{padding:4px 16px 8px}
.kv-list>div{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:9px 0;border-bottom:1px dashed #d4d4d0;font-size:13.5px}
.kv-list>div:last-child{border-bottom:0}
.kv-list dt{color:var(--muted);flex:none}
.kv-list dd{text-align:right;min-width:0;overflow-wrap:anywhere}
.kv-list dd.mono{font-size:12.5px}
.kv-sub{color:var(--muted);font-size:12px}
.kv-wide{padding:0}

/* Plan */
.plan-status{display:inline-block;font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.4px;background:#111;color:#fff;padding:4px 8px;margin-bottom:12px}
.mini-price{width:100%;border-collapse:collapse;border:2px solid var(--ink)}
.mini-price th,.mini-price td{padding:9px 10px;border-bottom:1px dashed #ccc;font-size:13px;text-align:left;vertical-align:baseline}
.mini-price tr:last-child th,.mini-price tr:last-child td{border-bottom:0}
.mini-price th{font-weight:600}
.mini-price td{text-align:right;white-space:nowrap}
.mini-price td b{font:700 14px var(--mono)}
.mini-price td span{font:10px var(--mono);text-transform:uppercase;color:var(--muted)}
.mini-price tr:first-child b{color:var(--accent)}
.plan-usage{font-size:11px;margin-top:10px;padding:8px 10px;border:1.5px dashed #bbb;background:var(--bg);line-height:1.5}
.plan-form{margin-top:12px}

/* Browser frame */
.bf{border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);background:#fff;min-width:0}
.bf-bar{display:flex;align-items:center;gap:10px;background:#111;padding:9px 10px}
.bf-lights{display:flex;gap:6px;padding:0 6px 0 4px}
.bf-lights i{width:11px;height:11px;border:1.5px solid #666}
.bf-lights i:first-child{background:var(--accent);border-color:var(--accent)}
.bf-url{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:#fff;color:var(--ink);padding:6px 10px;font:12.5px var(--mono);white-space:nowrap;overflow:hidden;height:32px}
.bf-url>span{overflow:hidden;text-overflow:ellipsis}
.bf-url .ic{color:#16a34a}
.bf-scheme{color:#8a8a8a}
.bf-none{color:var(--soft)}
.bf-btn{width:32px;height:32px;flex:none;display:grid;place-items:center;background:#111;color:#fff;border:1.5px solid #444;cursor:pointer}
.bf-btn .spin{color:var(--accent)}
.bf-btn:hover:not(:disabled){border-color:var(--accent);color:var(--accent)}
.bf-btn:disabled{opacity:.35;cursor:not-allowed}
.bf-open{display:inline-flex;align-items:center;gap:6px;height:32px;flex:none;padding:0 12px;background:var(--accent);color:#111;border:0;font:700 11.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;text-decoration:none}
.bf-open .ic{width:13px;height:13px}
.bf-open:hover{background:#fff}
.bf-open[aria-disabled=true]{background:#262626;color:#5f5f5f}
.bf-view{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--bg);border-top:2px solid var(--ink)}
.bf-prov{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px;gap:16px}
.bf-state{display:inline-flex;align-items:center;gap:9px;font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.5px;background:#111;color:#fff;padding:6px 11px;box-shadow:3px 3px 0 var(--accent)}
.bf-state .spin{color:var(--accent);width:10px;height:10px}
.bf-hint{font:11px var(--mono);color:var(--muted);text-align:center}
.lc{width:min(540px,100%);background:#fff;border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink)}
.lc-slide{padding:20px 22px 18px;min-height:148px}
.lc-kicker{font:700 10.5px var(--mono);text-transform:uppercase;color:var(--accent);letter-spacing:.6px}
.lc-title{font-size:26px;line-height:1;margin-top:8px}
.lc-body{font-size:14px;color:#333;margin-top:9px;line-height:1.5}
.lc-nav{display:flex;align-items:center;gap:10px;border-top:2px solid var(--ink);padding:8px 10px;background:#f6f5f2}
.lc-arrow{width:30px;height:30px;flex:none;display:grid;place-items:center;border:1.5px solid var(--ink);background:#fff;cursor:pointer}
.lc-arrow:hover{background:var(--accent-soft)}
.lc-dots{flex:1;display:flex;gap:5px}
.lc-dot{flex:1;height:9px;border:1.5px solid var(--ink);background:#fff;padding:0;cursor:pointer;position:relative;overflow:hidden}
.lc-dot:hover{background:var(--accent-soft)}
.lc-dot.on{background:#111}
.lc-fill{position:absolute;inset:0;background:var(--accent);transform-origin:left;animation:fill 6s linear forwards}
@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.bf-loading{position:absolute;inset:0}
.sk{position:absolute;inset:0;display:grid;grid-template-columns:22% 1fr}
.sk-nav{border-right:2px solid #e0dfda}
.sk-panel{padding:7%;display:flex;flex-direction:column;gap:14px}
.sk-line{height:14px}.w60{width:60%}.w40{width:40%}.w30{width:30%}
.sk-box{flex:1}
.sk-nav,.sk-line,.sk-box{background:linear-gradient(90deg,#ebeae6 0,#f7f6f3 50%,#ebeae6 100%);background-size:200% 100%;animation:shimmer 1.4s linear infinite}
@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}
.bf-overlay{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:8px;background:#fff;border:2px solid var(--ink);box-shadow:5px 5px 0 var(--ink);padding:16px 20px;font:700 12px var(--mono);text-transform:uppercase;letter-spacing:.4px;text-align:center;width:max-content;max-width:80%}
.bf-overlay .spin{color:var(--accent)}
.bf-overlay small{font:400 12.5px var(--sans);text-transform:none;letter-spacing:0;color:var(--muted)}
.bf-shot{position:absolute;inset:0;margin:0;background:#fff}
.bf-shot img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}
.bf-shot figcaption{position:absolute;left:14px;bottom:14px;display:flex;align-items:stretch;font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;border:2px solid var(--ink);background:#fff;box-shadow:3px 3px 0 var(--ink)}
.bf-shot figcaption>span{padding:5px 9px}
.bf-tag{background:var(--accent);border-right:2px solid var(--ink)}
.bf-card{position:absolute;inset:0;display:grid;place-items:center;padding:24px}
.bf-card-in{background:#fff;border:2px solid var(--ink);box-shadow:7px 7px 0 var(--ink);padding:24px 26px;max-width:460px;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.bf-card-in h3{font-size:34px;line-height:.95}
.bf-host{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.bf-why{font-size:12px;color:var(--muted);line-height:1.45}
.bf-off{position:absolute;inset:0;display:grid;place-items:center;padding:24px;background:repeating-linear-gradient(-45deg,#1b1b1b 0 16px,#111 16px 32px)}
.bf-off-failed{background:repeating-linear-gradient(-45deg,#3f0e0e 0 16px,#2a0909 16px 32px)}
.bf-off-unavailable{background:repeating-linear-gradient(-45deg,#e6e5e0 0 16px,#f1f0ec 16px 32px)}
.bf-off-in{background:#fff;border:2px solid var(--ink);box-shadow:7px 7px 0 var(--accent);padding:20px 22px;max-width:430px}
.bf-off-failed .bf-off-in{box-shadow:7px 7px 0 #dc2626}
.bf-off-unavailable .bf-off-in{box-shadow:7px 7px 0 var(--ink)}
.bf-off-icon{display:inline-grid;place-items:center;width:36px;height:36px;background:#111;color:#fff;margin-bottom:10px}
.bf-off-failed .bf-off-icon{background:#dc2626}
.bf-off-in h3{font-size:28px;line-height:1}
.bf-off-in p{font-size:13.5px;color:#444;margin-top:8px;line-height:1.5}

/* Activity terminal */
.term{position:relative;background:#0d0d0d;border:2px solid var(--ink);box-shadow:6px 6px 0 var(--accent);color:#d8d8d8;min-width:0}
.term-bar{display:flex;align-items:center;gap:10px 12px;flex-wrap:wrap;padding:10px 12px 10px 16px;border-bottom:2px solid #262626;background:#111}
.term-h{font:700 12px var(--mono);text-transform:uppercase;letter-spacing:.6px;color:#fff;margin-right:auto}
.term-h::before{content:'';display:inline-block;width:9px;height:9px;background:var(--accent);margin-right:10px}
.term-filters{display:flex;gap:6px;flex-wrap:wrap}
.chip{font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;border:1.5px solid #444;padding:3px 8px;background:transparent;color:#aaa;cursor:pointer}
.chip:hover{border-color:#888;color:#fff}
.chip.on{background:#fff;border-color:#fff;color:#111}
.term-live{display:inline-flex;align-items:center;gap:6px;font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;color:#777;min-width:76px;justify-content:flex-end}
.term-live-dot{width:7px;height:7px;background:#555}
.term-live[data-state=live]{color:#4ade80}.term-live[data-state=live] .term-live-dot{background:#4ade80;animation:pulse 1.6s ease-in-out infinite}
.term-live[data-state=polling]{color:#fbbf24}.term-live[data-state=polling] .term-live-dot{background:#fbbf24}
.term-body{height:380px;overflow-y:auto;overscroll-behavior:contain;padding:10px 0 4px;font:12.5px/1.6 var(--mono);scrollbar-color:#3a3a3a #0d0d0d;scrollbar-width:thin}
.term-body:focus-visible{outline:3px solid var(--accent);outline-offset:-3px}
.term-older{display:flex;align-items:center;gap:8px;margin:0 auto 10px;font:700 10px var(--mono);text-transform:uppercase;letter-spacing:.4px;background:transparent;color:#8a8a8a;border:1.5px dashed #3a3a3a;padding:5px 12px;cursor:pointer}
.term-older:hover{color:#fff;border-color:#888}
.term-older .spin{color:var(--accent);width:9px;height:9px}
.term-start{text-align:center;color:#4a4a4a;font-size:10.5px;padding-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
.tl-list{list-style:none}
.tl{display:grid;grid-template-columns:92px 40px 84px minmax(0,1fr);gap:12px;padding:3px 16px;align-items:baseline}
.tl:hover{background:#171717}
.tl-t{color:#5f5f5f;white-space:nowrap;font-size:11.5px}
.tl-lv{font-weight:700;font-size:10.5px;letter-spacing:.4px}
.tl[data-level=ok] .tl-lv{color:#4ade80}.tl[data-level=info] .tl-lv{color:#8b9099}.tl[data-level=wait] .tl-lv{color:#ff8a4c}.tl[data-level=error] .tl-lv{color:#f87171}
.tl-src{color:#7a7a7a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11.5px}
.tl-msg{color:#e7e7e7;overflow-wrap:anywhere;min-width:0}
.tl[data-level=error]{background:linear-gradient(90deg,rgba(248,113,113,.10),transparent 60%)}
.tl[data-level=error] .tl-msg{color:#fecaca}
.tl-pre{white-space:pre-wrap}
.tl-more{display:inline-block;margin-left:8px;font:700 10px var(--mono);text-transform:uppercase;letter-spacing:.4px;background:none;border:0;border-bottom:1.5px solid currentColor;color:#ff8a4c;cursor:pointer;padding:0;line-height:1.3}
.tl-group .tl-msg{border-left:2px solid #2f2f2f;padding-left:9px}
.tl-sum{display:grid;grid-template-columns:14px minmax(0,1fr);column-gap:6px;row-gap:1px;align-items:baseline;background:none;border:0;color:#a8a8a8;font:inherit;text-align:left;cursor:pointer;padding:0}
.tl-sum .ic{width:11px;height:11px;align-self:center;color:#666}
.tl-sum:hover>span:first-of-type{color:#fff}
.tl-range{grid-column:2;color:#555;font-size:11px}
.tl-sub{list-style:none;margin:6px 0 4px;color:#8f8f8f;font-size:11.5px}
.tl-sub time{color:#555;margin-right:6px}
.term-empty{color:#6b6b6b;padding:16px}
.term-cursor{padding:2px 16px 6px;color:var(--accent);font:14px var(--mono)}
.term-cursor span{animation:blink 1.1s steps(1) infinite}
.term-jump{position:absolute;right:18px;bottom:16px;display:inline-flex;align-items:center;gap:6px;font:700 11px var(--mono);text-transform:uppercase;background:var(--accent);color:#111;border:2px solid #111;box-shadow:3px 3px 0 #fff;padding:6px 10px;cursor:pointer}
.term-jump .ic{width:13px;height:13px}

/* Sheet / drawer / dialog (native <dialog>) */
dialog.ov{padding:0;border:0;background:transparent;max-width:none;max-height:none;color:var(--ink);overflow:visible}
dialog.ov::backdrop{background:rgba(17,17,17,.5)}
.ov-panel{position:relative;background:#fff;border:2px solid var(--ink);display:flex;flex-direction:column;max-height:100%;min-height:0}
dialog.ov-sheet{position:fixed;inset:0 0 0 auto;margin:0;height:100vh;height:100dvh;width:min(480px,100vw)}
.ov-sheet .ov-panel{height:100%;border-width:0 0 0 2px;box-shadow:-10px 0 0 rgba(17,17,17,.25)}
.ov-sheet[open]{animation:sheet-in .22s cubic-bezier(.2,.8,.2,1)}
dialog.ov-dialog{margin:auto;width:min(500px,calc(100vw - 32px))}
.ov-dialog .ov-panel{box-shadow:9px 9px 0 var(--ink)}
.ov-dialog[open]{animation:pop-in .16s ease-out}
.ov-grip{display:none}
.ov-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;background:#111;color:#fff;padding:15px 16px 15px 18px;border-bottom:4px solid var(--accent)}
.ov-kicker{font:11px var(--mono);color:#9a9a9a;text-transform:uppercase;overflow-wrap:anywhere;margin-bottom:3px}
.ov-head>div{min-width:0}
.ov-head h2{font-size:24px;line-height:1.05;overflow-wrap:anywhere}
.ov-x{width:34px;height:34px;display:grid;place-items:center;background:#111;color:#fff;border:1.5px solid #444;cursor:pointer;flex:none}
.ov-x:hover{border-color:var(--accent);color:var(--accent)}
.ov-body{padding:18px;overflow-y:auto;min-height:0}
.ov-foot{display:flex;justify-content:flex-end;gap:10px;padding:12px 16px;border-top:2px solid var(--ink);background:#f6f5f2}
.ov-sub{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.5px;margin:22px 0 8px;padding-top:14px;border-top:2px solid var(--ink)}
.confirm-body{font-size:14.5px;line-height:1.55}
@keyframes sheet-in{from{transform:translateX(48px);opacity:0}}
@keyframes pop-in{from{transform:translate(4px,4px);opacity:0}}
@keyframes drawer-in{from{transform:translateY(48px);opacity:0}}

/* Toasts */
.toasts{position:fixed;top:16px;right:16px;z-index:95;width:min(380px,calc(100vw - 32px));pointer-events:none}
.toasts>div{display:flex;flex-direction:column;gap:10px}
.toast{pointer-events:auto;display:grid;grid-template-columns:28px minmax(0,1fr) 28px;gap:10px;align-items:start;background:#fff;border:2px solid var(--ink);box-shadow:5px 5px 0 var(--ink);padding:10px}
.toast-mark{width:28px;height:28px;display:grid;place-items:center;font:800 15px var(--display);border:2px solid var(--ink);background:#fff}
.toast-mark .ic{width:14px;height:14px}
.toast[data-tone=ok] .toast-mark{background:#16a34a;color:#fff}
.toast[data-tone=err]{border-color:#991b1b;box-shadow:5px 5px 0 #991b1b}.toast[data-tone=err] .toast-mark{background:#dc2626;color:#fff;border-color:#991b1b}
.toast[data-tone=info] .toast-mark{background:var(--accent)}
.toast-text{padding-top:3px;min-width:0;overflow-wrap:anywhere}
.toast-text strong{font-size:14px;display:block;line-height:1.3}
.toast-text p{font-size:13px;color:var(--muted);margin-top:3px;line-height:1.4}
.toast-x{width:28px;height:28px;display:grid;place-items:center;background:none;border:0;cursor:pointer;color:var(--muted)}
.toast-x:hover{color:var(--ink)}

/* BYOC cards */
.cleanup{padding-left:20px;font-size:13px}
.cleanup li{padding:7px 0;border-bottom:1px dashed #ddd}
.cleanup li span{display:block;font-size:12px;overflow-wrap:anywhere}
.cleanup small{display:block;color:var(--muted);margin-top:2px}

/* Deployments table */
.dl-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.dl-head h1{font-size:clamp(30px,3.4vw,44px);line-height:.95;margin-top:2px}
.dl-sub{font:12px var(--mono);color:var(--muted);margin-top:8px;text-transform:uppercase;letter-spacing:.3px}
.dl-head-r{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.dl-card{box-shadow:6px 6px 0 var(--ink)}
.dl-tools{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:12px;background:#111}
label.search{display:flex;align-items:center;gap:9px;background:#fff;border:0;padding:0 12px;flex:1 1 280px;max-width:440px;margin:0;font:inherit;text-transform:none;letter-spacing:0;height:38px}
label.search .ic{color:var(--muted)}
label.search input{border:0;padding:0;height:100%;font:14px var(--sans);background:transparent;outline:none;min-width:0}
label.search input:focus{outline:none}
label.search:focus-within{outline:3px solid var(--accent);outline-offset:0}
.seg{display:flex;flex-wrap:wrap;border:1.5px solid #444}
.seg-b{display:inline-flex;align-items:center;gap:7px;font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;background:#111;color:#aaa;border:0;border-right:1.5px solid #444;padding:0 11px;height:35px;cursor:pointer}
.seg-b:last-child{border-right:0}
.seg-b:hover{color:#fff}
.seg-b.on{background:#fff;color:#111}
.seg-n{font-weight:400;color:#777}
.seg-b.on .seg-n{background:var(--accent);color:#111;font-weight:700;padding:0 5px}
.dl-sort{display:none}
.dt{width:100%;border-collapse:collapse;font-size:13.5px}
.dt th{font:700 10.5px var(--mono);text-transform:uppercase;letter-spacing:.5px;text-align:left;color:var(--muted);padding:11px 14px;border-bottom:2px solid var(--ink);white-space:nowrap;background:#f6f5f2}
.dt th[aria-sort]{color:var(--ink);box-shadow:inset 0 -3px 0 var(--accent)}
.dt-sort{display:inline-flex;align-items:center;gap:5px;background:none;border:0;font:inherit;text-transform:inherit;letter-spacing:inherit;color:inherit;cursor:pointer;padding:0}
.dt-sort:hover{color:var(--ink)}
.dt-sort .ic{opacity:.6}
[aria-sort] .dt-sort .ic{opacity:1;color:var(--accent)}
.dt td{padding:15px 14px;border-bottom:1px dashed #d4d4d0;vertical-align:top}
.dt tbody tr{transition:background-color .15s}
.dt tbody tr:hover{background:#fffaf4}
.dt tbody tr:last-child td{border-bottom:0}
.dt tbody tr[data-status=failed]{box-shadow:inset 5px 0 0 #dc2626}
.dt tbody tr[data-status=provisioning],.dt tbody tr[data-status=starting],.dt tbody tr[data-status=deleting]{box-shadow:inset 5px 0 0 var(--accent)}
.dt-name{font:600 14px var(--mono);color:var(--ink);text-decoration:none;white-space:nowrap}
.dt-name wbr{display:none}
.dt th:first-child{min-width:250px}
.dt-where{white-space:nowrap}
@media (max-width:1240px){.dt-name{white-space:normal}.dt-name wbr{display:inline}.dt th:first-child{min-width:0}.dt-where{white-space:normal}}
.dt-region{color:var(--muted);font-size:12px}
.dt-name:hover{text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:2px;text-underline-offset:3px}
.dt-sub{display:flex;flex-wrap:wrap;gap:5px 10px;align-items:center;font-size:12px;color:var(--muted);margin-top:6px}
.dt-sub .mono{font-size:11px}
.dt-num{white-space:nowrap;font:12.5px var(--mono)}
.dt-status{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.dt-status .trans{font-size:10px;padding:2px 7px}
.dt-status .trans-sub{display:none}
.dt-url{display:inline-flex;align-items:center;gap:5px;font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.4px;color:var(--ink);text-decoration:none;border-bottom:2px solid var(--accent);padding-bottom:1px;white-space:nowrap}
.dt-url:hover{background:var(--accent-soft)}
.dt-url .ic{width:12px;height:12px}
.dt-act{text-align:right;width:1%}
.dt-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:nowrap}
.mini-bar{display:inline-block;width:64px;height:8px;border:1.5px solid var(--ink);background:#fff}
.mini-bar span{display:block;height:100%;background:var(--accent)}
.dl-empty{padding:40px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;border-top:2px solid var(--ink)}
.dl-empty strong{font:800 22px var(--display);text-transform:uppercase}
.dl-empty p{color:var(--muted);font-size:14px}
.dl-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:10px 14px;border-top:2px solid var(--ink);font:11.5px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.3px;background:#f6f5f2}
.pager{display:flex;align-items:center;gap:10px}

@media (max-width:1240px){
.dp-grid{grid-template-columns:minmax(0,1fr) 350px;gap:24px}
.dp-col{gap:24px}
}
@media (max-width:1060px){
.dp-grid{display:flex;flex-direction:column;align-items:stretch;gap:24px}
.dp-grid>.dp-col>*{min-width:0;max-width:100%}
.dp-col{display:contents}
.dp-progress{order:1}.bf{order:2}.term{order:3}.dp-overview{order:4}.dp-plan{order:5}
.dt-hide-md{display:none}
}
@media (max-width:900px){
.dt thead{display:none}
.dt,.dt tbody,.dt tr,.dt td{display:block;width:100%}
.dt tbody tr{border-bottom:2px solid var(--ink);padding:12px 14px}
.dt tbody tr:last-child{border-bottom:0}
.dt td{border:0;padding:5px 0;display:grid;grid-template-columns:88px minmax(0,1fr);gap:10px;align-items:baseline}
.dt td::before{content:attr(data-label);font:700 9.5px var(--mono);text-transform:uppercase;letter-spacing:.4px;color:var(--muted)}
.dt td>*{grid-column:2;justify-self:start;max-width:100%}
.dt td[data-label=Deployment]{grid-template-columns:minmax(0,1fr);padding-bottom:8px}
.dt td[data-label=Deployment]>*,.dt td[data-label=Actions]>*{grid-column:1/-1}
.dt-where{white-space:normal}
.dt td[data-label=Deployment]::before{display:none}
.dt td[data-label=Actions]{padding-top:10px}
.dt td[data-label=Actions]::before{display:none}
.dt td[data-label=Actions]{grid-template-columns:minmax(0,1fr)}
.dt-act{text-align:left;width:100%}
.dt-actions{justify-content:flex-start}
.dt-sub{margin-top:4px}
.dl-sort{display:flex;align-items:center;gap:8px;margin:0;color:#aaa;font:700 10.5px var(--mono)}
.dl-sort select{width:auto;padding:0 8px;height:35px;font:600 12px var(--mono);border:1.5px solid #444;background:#111;color:#fff}
}
@media (max-width:720px){
.dp-hero{padding:18px 16px 18px 22px}
.dp-bar{padding:8px 12px}
.sync .sync-text{font-size:10.5px}
.dp-actions{width:100%}
.dp-actions .btn{flex:1 1 auto;justify-content:center}
.pg-top{gap:14px}
.bf[data-state=provisioning] .bf-view,.bf[data-state=loading] .bf-view{aspect-ratio:auto;height:min(520px,72vh)}
.bf-lights{display:none}
.lc-title{font-size:22px}
.tl{grid-template-columns:auto 36px minmax(0,1fr);gap:8px;padding:3px 10px}
.tl-src{display:none}
.term-body{height:340px;font-size:12px}
.term-live{min-width:0}
dialog.ov-sheet,dialog.ov-dialog{position:fixed;inset:auto 0 0 0;margin:0;width:100vw;height:auto;max-height:88dvh}
.ov-sheet .ov-panel,.ov-dialog .ov-panel{border-width:2px 0 0;box-shadow:0 -8px 0 rgba(17,17,17,.25);max-height:88dvh}
.ov-sheet[open],.ov-dialog[open]{animation:drawer-in .24s cubic-bezier(.2,.8,.2,1)}
.ov-grip{display:block;position:absolute;top:6px;left:50%;width:44px;height:4px;margin-left:-22px;background:#555;z-index:1}
.ov-head{padding-top:20px}
.ov-foot .btn{flex:1;justify-content:center}
.dl-tools{flex-direction:column;align-items:stretch}
.dl-tools>*{min-width:0;max-width:100%}
label.search{max-width:none;flex:none}
.seg{overflow-x:auto;flex-wrap:nowrap}
.seg-b{flex:none}
.dl-head-r{width:100%;justify-content:space-between}
.toasts{top:auto;bottom:76px;left:16px;right:16px;width:auto}
}
@media (prefers-reduced-motion:reduce){
.dp *,.dp *::before,.dp *::after,.dl *,.dl *::before,.dl *::after,dialog.ov,dialog.ov *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
.spin{border-color:currentColor;background:linear-gradient(135deg,currentColor 0 50%,transparent 50%)}
.halo-seg[data-tone=active]{stroke-dasharray:1 1}
.lc-fill{display:none}
.term-cursor span{opacity:1}
}
`
