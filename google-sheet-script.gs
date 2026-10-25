/* Maloy OS - Google Sheet sync. الصق الكود ده في Extensions > Apps Script جوه الشيت بتاعك */
const KEY = '2007';   // نفس الكلمة لازم تتكتب في التطبيق

const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const san = v => (typeof v === 'string' && /^[=+\-@]/.test(v)) ? "'" + v : v;

function doGet() { return out({ ok: true, msg: 'Maloy OS sync is alive' }); }

function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.key !== KEY) return out({ ok: false, err: 'الكلمة السرية غلط' });
    const ss = SpreadsheetApp.getActive();
    const sh = ss.getSheetByName('_data') || ss.insertSheet('_data');
    const rev = Number(sh.getRange('A1').getValue()) || 0;
    const read = () => {
      const n = sh.getLastRow() - 1; if (n < 1) return null;
      return sh.getRange(2, 1, n, 1).getValues().map(r => r[0]).join('') || null;
    };
    if (b.a === 'get') return out({ ok: true, rev, data: read() });
    if (b.a === 'put') {
      if (rev && b.base !== rev) return out({ ok: false, conflict: true, rev, data: read() });
      const d = String(b.data || ''), ch = [];
      for (let i = 0; i < d.length; i += 40000) ch.push([d.slice(i, i + 40000)]);
      if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, 1).clearContent();
      if (ch.length) sh.getRange(2, 1, ch.length, 1).setValues(ch);
      const nr = Date.now();
      sh.getRange('A1').setValue(nr); sh.getRange('B1').setValue(new Date());
      try { mirror(ss, JSON.parse(d)); } catch (x) {}
      return out({ ok: true, rev: nr });
    }
    return out({ ok: false, err: 'bad action' });
  } catch (err) { return out({ ok: false, err: String(err) }); }
  finally { lock.releaseLock(); }
}

/* نسخة مقروءة من بياناتك في تابات (للعرض بس، المصدر الأساسي هو تاب _data) */
function tab(ss, name, head, rows) {
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
  if (rows.length) sh.getRange(2, 1, rows.length, head.length).setValues(rows.map(r => r.map(san)));
}
function mirror(ss, S) {
  tab(ss, 'الدخل والمصروفات', ['التاريخ', 'النوع', 'التصنيف', 'المبلغ', 'ملاحظة'],
    (S.tx || []).map(x => [x.date, x.type === 'in' ? 'دخل' : 'مصروف', x.cat || '', Number(x.amt) || 0, x.note || '']));
  tab(ss, 'الشغل', ['الشغلانة', 'النوع', 'العميل', 'التسليم', 'السعر', 'الحالة', 'لينكات'],
    (S.tasks || []).map(t => [t.t || '', t.kind || '', t.client || '', t.due || '', Number(t.price) || 0, t.status || '', t.links || '']));
  tab(ss, 'المواعيد', ['التاريخ', 'الوقت', 'الموعد', 'خلص؟'],
    (S.plan || []).map(p => [p.date, p.time, p.t || '', p.done ? 'أيوه' : 'لأ']));
  tab(ss, 'الملاحظات', ['العنوان', 'المحتوى'], (S.notes || []).map(n => [n.t || '', n.b || '']));
}
