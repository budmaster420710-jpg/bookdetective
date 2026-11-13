# Work Order: BookDetective Personal Library V2

## Objective

Turn BookDetective into an easy personal reading journal for an Android reader who imports Kindle USB metadata directly to her phone. Preserve the privacy-first model: no DRM, book contents, background collection from third-party apps, or Amazon-account scraping.

## Delivered in this release

1. **Shelves and sorting**
   - Give every book a clear shelf: Want to Read, Reading, Finished, On Device, or Not Seen on Device.
   - Add shelf filtering plus recent, title, author, rating, and shelf sorting.
2. **Personal memory collection**
   - Add a private one-to-five-star rating and a longer personal review for each book.
   - Keep reviews and notes only in the device browser database and include them in export/restore files.
3. **Low-friction intake**
   - Add a prominent title/link paste box for copied Kindle, Audible, Amazon, Goodreads, Libby, or library links.
   - Preserve pasted source links locally for later review; never fetch or scrape third-party account data.
4. **Physical book scanner**
   - Add an Android-camera ISBN scanner using the browser BarcodeDetector API where available, with a manual ISBN fallback.
   - Always include manual ISBN fallback.
5. **Safe phone updates**
   - Version the service-worker cache so installed Android copies receive this release after the next reload/open.

## Not included / future work

- Automatic Kindle, Audible, Amazon, Goodreads, or library-app monitoring.
- Account login, cloud sync, or cross-device sharing.
- Audible listening-history export: Audible does not provide a downloadable export.
- Direct ingestion of a Nook or Kindle Android app’s private storage.
- Android native Share-menu companion and opt-in private device pairing.

## Acceptance checks

- Existing Kindle imports remain readable and retain their records.
- A reader can add, edit, rate, review, filter, sort, export, and restore a book without an account.
- Barcode scanner fails safely to manual ISBN entry when camera or BarcodeDetector is unavailable; it records the ISBN locally and never sends the book contents anywhere.
- Pasted links remain local and do not trigger hidden third-party fetches.
- Public Render deployment serves the updated static site from GitHub `main`.
