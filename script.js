// ====== Navigation ======
const toolTitles = {
    json: 'JSON Formatter & Validator', regex: 'Regex Tester', password: 'Password Generator',
    base64: 'Base64 Encode / Decode', color: 'Color Tools', markdown: 'Markdown Preview',
    hash: 'Hash Generator', diff: 'Text Diff', lorem: 'Lorem Ipsum Generator', timestamp: 'Timestamp Converter',
    jwt: 'JWT Decoder', url: 'URL Encode / Decode', sql: 'SQL Formatter',
    cron: 'Cron Expression Parser', uuid: 'UUID Generator', qr: 'QR Code Generator',
    cssg: 'CSS Generator', entities: 'HTML Entities', blocker: 'Focus Mode & Site Blocker'
};
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
        const tool = btn.dataset.tool;
        document.getElementById('tool-' + tool).classList.add('active');
        document.getElementById('page-title').textContent = toolTitles[tool];
        document.getElementById('sidebar').classList.remove('open');
        if (tool === 'color') { updateColorConversions(); generatePalette(); }
        if (tool === 'cssg') { updateGradient(); updateShadow(); }
        if (tool === 'cron') { parseCron(); }
        if (tool === 'blocker') { loadSites(); }
    });
});
document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// ====== Utilities ======
function showToast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
}
function copyText(text) { navigator.clipboard.writeText(text).then(() => showToast('Copied!')); }
function copyOutput(id) { copyText(document.getElementById(id).value || document.getElementById(id).textContent); }
async function pasteClipboard(id) { const t = await navigator.clipboard.readText(); document.getElementById(id).value = t; }
function clearField(id) { document.getElementById(id).value = ''; }

// ====== JSON ======
function formatJSON() {
    const s = document.getElementById('json-status');
    try {
        const obj = JSON.parse(document.getElementById('json-input').value);
        document.getElementById('json-output').value = JSON.stringify(obj, null, 2);
        s.className = 'status-bar success'; s.textContent = '✓ Valid JSON — formatted successfully';
    } catch (e) {
        s.className = 'status-bar error'; s.textContent = '✗ ' + e.message;
        document.getElementById('json-output').value = '';
    }
}
function minifyJSON() {
    const s = document.getElementById('json-status');
    try {
        const obj = JSON.parse(document.getElementById('json-input').value);
        document.getElementById('json-output').value = JSON.stringify(obj);
        s.className = 'status-bar success'; s.textContent = '✓ Minified';
    } catch (e) {
        s.className = 'status-bar error'; s.textContent = '✗ ' + e.message;
    }
}

// ====== Regex ======
document.getElementById('regex-pattern').addEventListener('input', testRegex);
document.getElementById('regex-flags').addEventListener('input', testRegex);
function testRegex() {
    const pat = document.getElementById('regex-pattern').value;
    const flags = document.getElementById('regex-flags').value;
    const test = document.getElementById('regex-test').value;
    const out = document.getElementById('regex-matches');
    if (!pat || !test) { out.innerHTML = 'No matches yet'; return; }
    try {
        const re = new RegExp(pat, flags);
        let html = '', match, count = 0, lastIndex = 0;
        if (flags.includes('g')) {
            while ((match = re.exec(test)) !== null) {
                html += escapeHtml(test.slice(lastIndex, match.index));
                html += `<span class="match-highlight">${escapeHtml(match[0])}</span>`;
                lastIndex = match.index + match[0].length; count++;
                if (match[0].length === 0) { re.lastIndex++; }
            }
            html += escapeHtml(test.slice(lastIndex));
        } else {
            match = re.exec(test);
            if (match) { count = 1; html = escapeHtml(test.slice(0,match.index))+`<span class="match-highlight">${escapeHtml(match[0])}</span>`+escapeHtml(test.slice(match.index+match[0].length)); }
            else html = escapeHtml(test);
        }
        out.innerHTML = count ? `<div style="margin-bottom:8px;color:var(--green);font-size:.8rem">${count} match(es) found</div>${html}` : '<span style="color:var(--red)">No matches</span>';
    } catch(e) { out.innerHTML = `<span style="color:var(--red)">${e.message}</span>`; }
}
function escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ====== Password ======
function updatePwLength() { document.getElementById('pw-length-val').textContent = document.getElementById('pw-length').value; }
function generatePassword() {
    const len = +document.getElementById('pw-length').value;
    let chars = '';
    if (document.getElementById('pw-upper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (document.getElementById('pw-lower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (document.getElementById('pw-numbers').checked) chars += '0123456789';
    if (document.getElementById('pw-symbols').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) { showToast('Select at least one option'); return; }
    const arr = new Uint32Array(len); crypto.getRandomValues(arr);
    let pw = ''; for (let i = 0; i < len; i++) pw += chars[arr[i] % chars.length];
    document.getElementById('password-display').textContent = pw;
    const str = document.getElementById('password-strength');
    const score = (len >= 16 ? 2 : len >= 10 ? 1 : 0) + (chars.length > 60 ? 2 : chars.length > 30 ? 1 : 0);
    str.className = 'password-strength ' + ['weak','fair','good','strong'][Math.min(score,3)];
}
function bulkGenerate() {
    const n = +document.getElementById('pw-bulk-count').value;
    const out = document.getElementById('bulk-output'); out.style.display = 'block';
    let lines = [];
    for (let i = 0; i < n; i++) { generatePassword(); lines.push(document.getElementById('password-display').textContent); }
    out.textContent = lines.join('\n');
}

// ====== Base64 ======
function encodeBase64() {
    try {
        const t = document.getElementById('b64-text').value;
        const bytes = new TextEncoder().encode(t);
        let b = '';
        for(let i=0; i<bytes.length; i++) b += String.fromCharCode(bytes[i]);
        document.getElementById('b64-encoded').value = btoa(b);
        showToast('Encoded!');
    } catch(e) { showToast('Error: ' + e.message); }
}
function decodeBase64() {
    try {
        const e = document.getElementById('b64-encoded').value;
        const b = atob(e);
        const bytes = new Uint8Array(b.length);
        for(let i=0; i<b.length; i++) bytes[i] = b.charCodeAt(i);
        document.getElementById('b64-text').value = new TextDecoder().decode(bytes);
        showToast('Decoded!');
    } catch(e) { showToast('Error: Invalid Base64'); }
}

// ====== Color ======
const cp = document.getElementById('color-picker');
cp.addEventListener('input', () => { updateColorConversions(); generatePalette(); });
function updateColorConversions() {
    const hex = cp.value;
    document.getElementById('color-hex-label').textContent = hex;
    document.getElementById('conv-hex').textContent = hex;
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    document.getElementById('conv-rgb').textContent = `rgb(${r}, ${g}, ${b})`;
    const [h,s,l] = rgbToHsl(r,g,b);
    document.getElementById('conv-hsl').textContent = `hsl(${h}, ${s}%, ${l}%)`;
}
function rgbToHsl(r,g,b) {
    r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b);
    let h,s,l=(max+min)/2;
    if(max===min){h=s=0}else{const d=max-min;s=l>.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break}}
    return[Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}
function hslToHex(h,s,l) {
    s/=100;l/=100;const a=s*Math.min(l,1-l);
    const f=n=>{const k=(n+h/30)%12;const c=l-a*Math.max(Math.min(k-3,9-k,1),-1);return Math.round(255*c).toString(16).padStart(2,'0');};
    return `#${f(0)}${f(8)}${f(4)}`;
}
function generatePalette() {
    const hex = cp.value;
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    const [h,s,l] = rgbToHsl(r,g,b);
    const angles = [0,30,60,180,210,330];
    const row = document.getElementById('palette-row'); row.innerHTML = '';
    angles.forEach(a => {
        const nh = (h + a) % 360;
        const hx = hslToHex(nh, s, l);
        const sw = document.createElement('div');
        sw.className = 'palette-swatch'; sw.style.background = hx;
        sw.innerHTML = `<span>${hx}</span>`;
        sw.onclick = () => copyText(hx);
        row.appendChild(sw);
    });
}
function randomColor() { cp.value = '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0'); updateColorConversions(); generatePalette(); }

// ====== Markdown ======
function renderMarkdown() {
    let md = document.getElementById('md-input').value;
    // Simple markdown parser
    md = md.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    md = md.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    md = md.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/\*(.+?)\*/g, '<em>$1</em>');
    md = md.replace(/`(.+?)`/g, '<code>$1</code>');
    md = md.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    md = md.replace(/^- (.+)$/gm, '<li>$1</li>');
    md = md.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    md = md.replace(/^---$/gm, '<hr>');
    md = md.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    md = md.replace(/\n\n/g, '</p><p>');
    md = '<p>' + md + '</p>';
    md = md.replace(/<p><h/g,'<h').replace(/<\/h(\d)><\/p>/g,'</h$1>');
    md = md.replace(/<p><hr><\/p>/g,'<hr>');
    md = md.replace(/<p><blockquote>/g,'<blockquote>').replace(/<\/blockquote><\/p>/g,'</blockquote>');
    md = md.replace(/<p><ul>/g,'<ul>').replace(/<\/ul><\/p>/g,'</ul>');
    document.getElementById('md-preview').innerHTML = md;
}

// ====== Hash ======
async function generateHashes() {
    const text = document.getElementById('hash-input').value;
    if (!text) {
        document.getElementById('hash-sha256').textContent = '—';
        document.getElementById('hash-sha384').textContent = '—';
        document.getElementById('hash-sha512').textContent = '—';
        return;
    }
    const enc = new TextEncoder().encode(text);
    for (const algo of ['SHA-256','SHA-384','SHA-512']) {
        const buf = await crypto.subtle.digest(algo, enc);
        const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
        document.getElementById('hash-' + algo.replace('-','').toLowerCase()).textContent = hex;
    }
}

// ====== Diff ======
function computeDiff() {
    const a = document.getElementById('diff-original').value.split('\n');
    const b = document.getElementById('diff-modified').value.split('\n');
    const out = document.getElementById('diff-output');
    let html = '';
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
        if (i >= a.length) html += `<span class="diff-add">+ ${escapeHtml(b[i])}</span>`;
        else if (i >= b.length) html += `<span class="diff-remove">- ${escapeHtml(a[i])}</span>`;
        else if (a[i] !== b[i]) { html += `<span class="diff-remove">- ${escapeHtml(a[i])}</span><span class="diff-add">+ ${escapeHtml(b[i])}</span>`; }
        else html += `<span class="diff-same">  ${escapeHtml(a[i])}</span>`;
    }
    out.innerHTML = html || '<span style="color:var(--text-muted)">No differences found</span>';
}

// ====== Lorem ======
const LOREM_SENTENCES = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit.",
    "Curabitur pretium tincidunt lacus, nec interdum lectus feugiat et.",
    "Proin sapien ipsum, porta a auctor quis, euismod ut nisl.",
    "Nulla facilisi. Etiam non diam ante. Duis mattis varius ligula.",
    "Suspendisse potenti. In feugiat velit lacus, a interdum orci aliquam vel.",
    "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices.",
    "Pellentesque habitant morbi tristique senectus et netus et malesuada fames.",
    "Maecenas a velit lacinia, vehicula felis a, efficitur lorem."
];
function generateLorem() {
    const count = +document.getElementById('lorem-count').value;
    const useHtml = document.getElementById('lorem-html').checked;
    let result = '';
    for (let i = 0; i < count; i++) {
        const numSentences = 3 + Math.floor(Math.random() * 4);
        let para = '';
        for (let j = 0; j < numSentences; j++) para += LOREM_SENTENCES[Math.floor(Math.random()*LOREM_SENTENCES.length)] + ' ';
        result += useHtml ? `<p>${para.trim()}</p>\n\n` : para.trim() + '\n\n';
    }
    document.getElementById('lorem-output').value = result.trim();
}

// ====== Timestamp ======
function updateLiveTimestamp() { document.getElementById('live-timestamp').textContent = Math.floor(Date.now() / 1000); }
setInterval(updateLiveTimestamp, 1000); updateLiveTimestamp();
function unixToDate() {
    const ts = +document.getElementById('ts-unix-input').value;
    if (isNaN(ts)) { document.getElementById('ts-date-result').textContent = 'Invalid timestamp'; return; }
    const d = new Date(ts * 1000);
    document.getElementById('ts-date-result').innerHTML =
        `<strong>${d.toLocaleString()}</strong><br>UTC: ${d.toUTCString()}<br>ISO: ${d.toISOString()}`;
}
function dateToUnix() {
    const val = document.getElementById('ts-date-input').value;
    if (!val) { document.getElementById('ts-unix-result').textContent = 'Pick a date above'; return; }
    const ts = Math.floor(new Date(val).getTime() / 1000);
    document.getElementById('ts-unix-result').innerHTML = `<strong>${ts}</strong><br>Milliseconds: ${ts * 1000}`;
}

// ====== JWT Decoder ======
function decodeJWT() {
    const token = document.getElementById('jwt-input').value.trim();
    const hEl = document.getElementById('jwt-header');
    const pEl = document.getElementById('jwt-payload');
    const sEl = document.getElementById('jwt-signature');
    const eEl = document.getElementById('jwt-expiry');
    if (!token) { hEl.textContent = 'Paste a JWT above'; pEl.textContent = '—'; sEl.textContent = '—'; eEl.className='status-bar'; eEl.textContent=''; return; }
    const parts = token.split('.');
    if (parts.length !== 3) { hEl.textContent = 'Invalid JWT format (need 3 parts)'; pEl.textContent='—'; sEl.textContent='—'; return; }
    const pad = s => s + '='.repeat((4 - s.length % 4) % 4);
    const b64DecodeUnicode = str => new TextDecoder().decode(Uint8Array.from(atob(str), c => c.charCodeAt(0)));
    try {
        const hdStr = pad(parts[0].replace(/-/g,'+').replace(/_/g,'/'));
        const header = JSON.parse(b64DecodeUnicode(hdStr));
        hEl.textContent = JSON.stringify(header, null, 2);
    } catch(e) { hEl.textContent = 'Error decoding header'; }
    try {
        const plStr = pad(parts[1].replace(/-/g,'+').replace(/_/g,'/'));
        const payload = JSON.parse(b64DecodeUnicode(plStr));
        pEl.textContent = JSON.stringify(payload, null, 2);
        if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            const now = new Date();
            if (expDate < now) { eEl.className='status-bar error'; eEl.textContent = '✗ Token EXPIRED on ' + expDate.toLocaleString(); }
            else { eEl.className='status-bar success'; eEl.textContent = '✓ Token valid until ' + expDate.toLocaleString(); }
        } else { eEl.className='status-bar'; eEl.textContent='No expiry claim found'; }
    } catch(e) { pEl.textContent = 'Error decoding payload'; }
    sEl.textContent = parts[2];
}

// ====== URL Codec ======
function encodeURL() { document.getElementById('url-encoded').value = encodeURIComponent(document.getElementById('url-decoded').value); showToast('Encoded!'); }
function decodeURL() { try { document.getElementById('url-decoded').value = decodeURIComponent(document.getElementById('url-encoded').value); showToast('Decoded!'); } catch(e) { showToast('Invalid encoded URL'); } }
function parseURL() {
    const raw = document.getElementById('url-parse-input').value;
    const out = document.getElementById('url-parts'); out.innerHTML = '';
    if (!raw) return;
    try {
        const u = new URL(raw);
        const fields = { Protocol: u.protocol, Host: u.hostname, Port: u.port || '(default)', Path: u.pathname, Search: u.search || '(none)', Hash: u.hash || '(none)' };
        for (const [k,v] of Object.entries(fields)) {
            out.innerHTML += `<div class="hash-item"><span class="hash-label">${k}</span><span class="hash-value">${escapeHtml(v)}</span></div>`;
        }
        if (u.searchParams.toString()) {
            let paramsHtml = '';
            u.searchParams.forEach((val,key) => { paramsHtml += `<strong>${escapeHtml(key)}</strong> = ${escapeHtml(val)}<br>`; });
            out.innerHTML += `<div class="hash-item"><span class="hash-label">Params</span><span class="hash-value">${paramsHtml}</span></div>`;
        }
    } catch(e) { out.innerHTML = '<div class="hash-item"><span class="hash-value" style="color:var(--red)">Invalid URL</span></div>'; }
}

// ====== SQL Formatter ======
function formatSQL() {
    const input = document.getElementById('sql-input').value.trim();
    if (!input) return;
    const keywords = ['SELECT','FROM','WHERE','AND','OR','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','FULL JOIN','CROSS JOIN','ON','ORDER BY','GROUP BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','ALTER TABLE','DROP TABLE','UNION','UNION ALL','AS','IN','NOT','NULL','IS','BETWEEN','LIKE','EXISTS','CASE','WHEN','THEN','ELSE','END','DISTINCT','COUNT','SUM','AVG','MIN','MAX','INTO','DESC','ASC'];
    let sql = input.replace(/\s+/g,' ').trim();
    keywords.forEach(kw => {
        const re = new RegExp('\\b' + kw.replace(/ /g,'\\s+') + '\\b', 'gi');
        sql = sql.replace(re, '\n' + kw.toUpperCase());
    });
    sql = sql.replace(/,/g, ',\n   ');
    sql = sql.trim();
    let indent = 0; const lines = sql.split('\n');
    const formatted = lines.map(line => {
        line = line.trim();
        if (!line) return '';
        if (/^(FROM|WHERE|ORDER BY|GROUP BY|HAVING|LIMIT|JOIN|LEFT|RIGHT|INNER|ON)/.test(line)) indent = 1;
        else if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|UNION)/.test(line)) indent = 0;
        else if (indent > 0 && !/^(AND|OR)/.test(line)) indent = 2;
        if (/^(AND|OR)/.test(line)) indent = 2;
        return '  '.repeat(indent) + line;
    }).join('\n');
    document.getElementById('sql-output').value = formatted;
}

// ====== Cron Parser ======
function parseCron() {
    const input = document.getElementById('cron-input').value.trim();
    const out = document.getElementById('cron-result');
    const parts = input.split(/\s+/);
    if (parts.length !== 5) { out.innerHTML = '<span style="color:var(--red)">Expected 5 fields: minute hour day month weekday</span>'; return; }
    const [min,hour,dom,month,dow] = parts;
    const explain = (val, unit, range) => {
        if (val === '*') return `every ${unit}`;
        if (val.startsWith('*/')) return `every ${val.slice(2)} ${unit}(s)`;
        if (val.includes(',')) return `${unit} ${val}`;
        if (val.includes('-')) return `${unit} ${val.split('-')[0]} through ${val.split('-')[1]}`;
        return `${unit} ${val}`;
    };
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let desc = `<strong>"${input}"</strong><br>`;
    desc += `⏱ ${explain(min,'minute','0-59')}, ${explain(hour,'hour','0-23')}<br>`;
    desc += `📅 ${explain(dom,'day-of-month','1-31')}, ${explain(month,'month','1-12')}<br>`;
    const dowDesc = dow === '*' ? 'every day of the week' : dow.split(',').map(d => days[+d] || d).join(', ');
    desc += `📆 ${dowDesc}`;
    out.innerHTML = desc;
}
function setCron(val) { document.getElementById('cron-input').value = val; parseCron(); }

// ====== UUID Generator ======
function generateUUID() {
    const uuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16);
    });
    document.getElementById('uuid-display').textContent = uuid;
    return uuid;
}
function bulkUUID() {
    const n = +document.getElementById('uuid-bulk-count').value;
    const out = document.getElementById('uuid-bulk-output'); out.style.display = 'block';
    let lines = []; for (let i = 0; i < n; i++) lines.push(generateUUID());
    out.value = lines.join('\n');
}
function validateUUID() {
    const input = document.getElementById('uuid-validate-input').value.trim();
    const res = document.getElementById('uuid-validate-result');
    if (!input) { res.className='status-bar'; res.textContent=''; return; }
    const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (re.test(input)) { res.className='status-bar success'; res.textContent='✓ Valid UUID'; }
    else { res.className='status-bar error'; res.textContent='✗ Invalid UUID format'; }
}

// ====== QR Code Generator ======
function generateQR() {
    const text = document.getElementById('qr-input').value.trim();
    const size = +document.getElementById('qr-size').value;
    const out = document.getElementById('qr-output');
    if (!text) { showToast('Enter text or URL first'); return; }
    if (typeof qrcode === 'undefined') { out.innerHTML='<p style="color:var(--red)">QR library not loaded</p>'; return; }
    try {
        const qr = qrcode(0, 'M'); qr.addData(text); qr.make();
        const cellSize = Math.max(1, Math.floor(size / qr.getModuleCount()));
        out.innerHTML = qr.createSvgTag(cellSize, 0);
        const svg = out.querySelector('svg');
        if (svg) { svg.style.maxWidth = size+'px'; svg.style.borderRadius = '12px'; svg.style.background = '#fff'; svg.style.padding = '12px'; }
    } catch(e) { out.innerHTML = `<p style="color:var(--red)">${e.message}</p>`; }
}

// ====== CSS Generator ======
function updateGradient() {
    const c1 = document.getElementById('cssg-c1').value;
    const c2 = document.getElementById('cssg-c2').value;
    const angle = document.getElementById('cssg-angle').value;
    const css = `background: linear-gradient(${angle}deg, ${c1}, ${c2});`;
    document.getElementById('cssg-gradient-preview').style.background = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
    document.getElementById('cssg-gradient-code').textContent = css;
}
function updateShadow() {
    const x = document.getElementById('cssg-sx').value;
    const y = document.getElementById('cssg-sy').value;
    const b = document.getElementById('cssg-sb').value;
    const s = document.getElementById('cssg-ss').value;
    const c = document.getElementById('cssg-sc').value;
    const o = document.getElementById('cssg-so').value;
    const r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), bl = parseInt(c.slice(5,7),16);
    const rgba = `rgba(${r},${g},${bl},${(o/100).toFixed(2)})`;
    const css = `box-shadow: ${x}px ${y}px ${b}px ${s}px ${rgba};`;
    document.getElementById('shadow-box').style.boxShadow = `${x}px ${y}px ${b}px ${s}px ${rgba}`;
    document.getElementById('cssg-shadow-code').textContent = css;
}

// ====== HTML Entities ======
function encodeEntities() {
    const t = document.getElementById('ent-decoded').value;
    const encoded = t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
    document.getElementById('ent-encoded').value = encoded;
    showToast('Encoded!');
}
function decodeEntities() {
    const t = document.getElementById('ent-encoded').value;
    const ta = document.createElement('textarea'); ta.innerHTML = t;
    document.getElementById('ent-decoded').value = ta.value;
    showToast('Decoded!');
}

// ====== Site Blocker ======
let blockedSites = [];

function loadSites() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['blockedSites', 'focusMode'], (data) => {
            blockedSites = data.blockedSites || [];
            document.getElementById('focus-toggle').checked = !!data.focusMode;
            renderBlockedSites();
        });
    }
}

function saveSites() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ blockedSites });
    }
}

function renderBlockedSites() {
    const list = document.getElementById('blocked-sites-list');
    list.innerHTML = '';
    blockedSites.forEach((site, index) => {
        const li = document.createElement('li');
        li.className = 'blocked-item';
        li.innerHTML = `
            <span class="blocked-url">${site}</span>
            <button class="remove-btn" onclick="removeBlockedSite(${index})">×</button>
        `;
        list.appendChild(li);
    });
}

function addBlockedSite() {
    const input = document.getElementById('site-input');
    const url = input.value.trim().toLowerCase();
    if (!url) return;
    if (!blockedSites.includes(url)) {
        blockedSites.push(url);
        saveSites();
        renderBlockedSites();
        input.value = '';
        showToast('Site added!');
    } else {
        showToast('Already in list');
    }
}

function removeBlockedSite(index) {
    blockedSites.splice(index, 1);
    saveSites();
    renderBlockedSites();
    showToast('Site removed');
}

function toggleFocusMode() {
    const isEnabled = document.getElementById('focus-toggle').checked;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.storage.local.set({ focusMode: isEnabled }, () => {
            chrome.runtime.sendMessage({ action: isEnabled ? 'startFocus' : 'stopFocus' }, (response) => {
                const status = document.getElementById('blocker-status');
                if (isEnabled) {
                    status.className = 'status-bar success';
                    status.textContent = '✓ Focus Mode Active — Selected sites are now blocked.';
                    showToast('Focus Mode ON');
                } else {
                    status.className = 'status-bar';
                    status.textContent = 'Add websites and enable Focus Mode to block them.';
                    showToast('Focus Mode OFF');
                }
            });
        });
    } else {
        showToast('Extension context required');
    }
}

// Init
updateColorConversions(); generatePalette();
parseCron();
updateGradient(); updateShadow();
loadSites();
