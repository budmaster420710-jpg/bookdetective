const DB_NAME = 'bookdetective';
const STORE = 'books';
const $ = selector => document.querySelector(selector);
let books = [];

function openDB() { return new Promise((resolve, reject) => { const request = indexedDB.open(DB_NAME, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, {keyPath:'id'}); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function loadBooks() { const db = await openDB(); return new Promise((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function saveBook(book) { const db = await openDB(); return new Promise((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(book); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); }
async function removeAll() { const db = await openDB(); return new Promise((resolve, reject) => { const request = db.transaction(STORE, 'readwrite').objectStore(STORE).clear(); request.onsuccess = resolve; request.onerror = () => reject(request.error); }); }
const clean = value => (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const idFor = (asin, title) => asin ? `asin:${asin.toUpperCase()}` : `title:${clean(title)}`;
function parseFolder(relativePath) {
  const match = relativePath.match(/(?:^|\/)([^/]+?)_([A-Z0-9]{10})(?:\.sdr)(?:\/|$)/i);
  if (!match) return null;
  return {title:match[1].replace(/_/g, ' ').trim(), asin:match[2].toUpperCase()};
}
async function importKindle(files) {
  const candidates = [...files].filter(file => /\/(?:AssetDownloadMetadata\.meta|[A-Z0-9]{10}\.mf)$/i.test(file.webkitRelativePath));
  const found = new Map();
  for (const file of candidates) {
    const parsed = parseFolder(file.webkitRelativePath);
    if (!parsed) continue;
    const key = idFor(parsed.asin, parsed.title);
    let downloadedAt = null;
    if (/AssetDownloadMetadata\.meta$/i.test(file.name)) {
      try { const data = JSON.parse(await file.text()); const values = Object.values(data).flatMap(value => Object.values(value || {})); downloadedAt = values.find(value => typeof value === 'string' && /\d{4}/.test(value)) || null; } catch { /* sidecar was skipped if unreadable */ }
    }
    found.set(key, {...parsed, downloadedAt});
  }
  const seen = new Set(found.keys()); const now = new Date().toISOString(); let added = 0, updated = 0;
  for (const [key, item] of found) {
    const existing = books.find(book => book.id === key || (item.asin && book.asin === item.asin) || (!book.asin && clean(book.title) === clean(item.title)));
    const book = existing || {id:key, title:item.title, author:'', status:'on-device', notes:'', createdAt:now};
    if (existing) updated++; else added++;
    await saveBook({...book, id:book.id || key, title:book.title || item.title, asin:item.asin || book.asin || '', lastSeenOnDevice:now, source:'Kindle USB sidecar', downloadedAt:item.downloadedAt || book.downloadedAt || null, needsReview:!book.author});
  }
  for (const book of books.filter(book => book.source === 'Kindle USB sidecar' && !seen.has(book.id))) await saveBook({...book, status: book.status === 'finished' ? 'finished' : 'not-seen', lastDeviceMissedAt:now});
  books = await loadBooks(); render();
  $('#import-result').textContent = found.size ? `Imported ${added} new and refreshed ${updated} existing title${found.size === 1 ? '' : 's'}. Titles missing from this scan are marked “not seen on device,” not deleted.` : 'No supported Kindle sidecar folders were found. Choose the Kindle’s top-level folder.';
}
function statusLabel(status) { return ({'on-device':'On device',reading:'Reading',finished:'Finished','not-seen':'Not seen',review:'Needs review'})[status] || 'Needs review'; }
function render() {
  const filter = $('#filter').value, q = clean($('#search').value);
  const visible = books.filter(book => (filter === 'all' || book.status === filter || (filter === 'review' && book.needsReview)) && (!q || clean(`${book.title} ${book.author}`).includes(q))).sort((a,b) => a.title.localeCompare(b.title));
  $('#total-count').textContent = books.length; $('#reading-count').textContent = books.filter(book => book.status === 'reading').length; $('#finished-count').textContent = books.filter(book => book.status === 'finished').length; $('#review-count').textContent = books.filter(book => book.needsReview).length;
  $('#empty-state').hidden = books.length > 0;
  $('#book-list').innerHTML = visible.map(book => `<article class="book"><div class="book-top"><span class="badge ${book.needsReview ? 'review' : book.status}">${book.needsReview ? 'Review author' : statusLabel(book.status)}</span>${book.asin ? '<span class="hint">ASIN saved</span>' : ''}</div><h3>${escapeHTML(book.title)}</h3><p>${book.author ? escapeHTML(book.author) : 'Author not available in safe Kindle USB metadata.'}</p><p class="evidence">${escapeHTML(evidence(book))}</p><button type="button" data-edit="${escapeHTML(book.id)}">Review case →</button></article>`).join('');
}
function evidence(book) { if (book.source === 'Kindle USB sidecar') return book.lastDeviceMissedAt ? 'Previously found on Kindle; not seen in the latest USB scan.' : 'Kindle USB sidecar found locally.'; return 'Added manually in this browser.'; }
function escapeHTML(value) { return String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function openEditor(book = {}) { $('#dialog-title').textContent = book.id ? 'Review book' : 'Add a book'; $('#book-id').value = book.id || ''; $('#book-title').value = book.title || ''; $('#book-author').value = book.author || ''; $('#book-status').value = book.status || 'on-device'; $('#book-asin').value = book.asin || ''; $('#book-notes').value = book.notes || ''; $('#book-dialog').showModal(); }
$('#kindle-folder').addEventListener('change', event => importKindle(event.target.files));
$('#manual-add').addEventListener('click', () => openEditor()); $('#search').addEventListener('input', render); $('#filter').addEventListener('change', render);
$('#book-list').addEventListener('click', event => { const id = event.target.dataset.edit; if (id) openEditor(books.find(book => book.id === id)); });
$('#book-form').addEventListener('submit', async event => { if (event.submitter?.value === 'cancel') return; event.preventDefault(); const old = books.find(book => book.id === $('#book-id').value) || {}; const asin = $('#book-asin').value.trim().toUpperCase(); const title = $('#book-title').value.trim(); await saveBook({...old,id:old.id || idFor(asin,title),title,author:$('#book-author').value.trim(),status:$('#book-status').value,asin,notes:$('#book-notes').value.trim(),needsReview:!$('#book-author').value.trim(),source:old.source || 'Manual entry',createdAt:old.createdAt || new Date().toISOString()}); books = await loadBooks(); $('#book-dialog').close(); render(); });
$('#export-library').addEventListener('click', () => { const blob = new Blob([JSON.stringify({format:'bookdetective-library-v1', exportedAt:new Date().toISOString(), books}, null, 2)], {type:'application/json'}); const link = Object.assign(document.createElement('a'), {href:URL.createObjectURL(blob),download:`bookdetective-library-${new Date().toISOString().slice(0,10)}.json`}); link.click(); URL.revokeObjectURL(link.href); });
$('#restore-library').addEventListener('change', async event => { try { const data = JSON.parse(await event.target.files[0].text()); if (data.format !== 'bookdetective-library-v1' || !Array.isArray(data.books)) throw Error(); for (const book of data.books) if (book?.id && book?.title) await saveBook(book); books = await loadBooks(); render(); $('#import-result').textContent = 'Library export restored locally.'; } catch { $('#import-result').textContent = 'That file is not a BookDetective library export.'; } });
$('#clear-library').addEventListener('click', async () => { if (confirm('Clear every BookDetective record stored in this browser? This does not affect Kindle files.')) { await removeAll(); books = []; render(); } });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
books = await loadBooks(); render();
