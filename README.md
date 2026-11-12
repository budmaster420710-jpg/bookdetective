# BookDetective

BookDetective is a privacy-first, installable website for building a reading library from a Kindle USB import. Version one runs entirely in the browser: it never uploads book files, DRM material, Kindle databases, or cover images.

## What it imports

Select the mounted Kindle folder using **Import Kindle USB folder**. The browser reads only file names plus the small `AssetDownloadMetadata.meta` sidecar files under `documents/Downloads/.../*.sdr/`.

- The `.sdr` folder name supplies a readable title and Amazon ID (ASIN).
- The sidecar can contribute a local download timestamp.
- Exact ASINs are merged; otherwise BookDetective uses a normalized title match and flags it for review.
- Previously seen titles absent on a later import become **not seen on this device**. This is not claimed to mean removed from the Amazon account.

The app deliberately does **not** open KFX/AZW/AAX book content, DRM vouchers, or Kindle SQLite databases. The Paperwhite does not expose a dependable finished/completed field in the safely usable USB metadata, so imports begin as **On device**. Readers can set **Reading** or **Finished** themselves.

## Local use

Open `site/index.html` from a static server, or point a Render Static Site at `site/`. On supported browsers, use the install action in the browser menu to add it to the home screen.

No package installation or build is required.

## Optional Cloudflare Worker/D1 foundation

`worker/` is an independent future opt-in service. It contains only a health endpoint and a double-opt-in email-interest flow. It has no endpoint that accepts book files or library records. Before deployment:

1. Create a separate D1 database named `bookdetective` and place its ID in `worker/wrangler.toml`.
2. Set `ALLOWED_ORIGIN` to the final Render URL.
3. Set `PUBLIC_BASE_URL`, `MAILER_URL`, `MAILER_SECRET`, and `TOKEN_SECRET` as Worker secrets/variables. Do not copy secrets from Hollowmouth.
4. Apply `worker/migrations/0001_interest.sql`, test locally, then deploy the Worker.

The verification design is based on the inspected Hollowmouth pattern: email validation, consent, an HMAC-derived confirmation link stored as a hash, scanner-safe GET confirmation pages, POST-only confirmation, expiration, and unsubscribe. This new Worker uses its own database, origin, and secrets.

## Delivery pattern

Create a new GitHub repository for this folder. Connect the `site/` directory to a new Render Static Site using `render.yaml`. Deploy `worker/` separately to Cloudflare after the configuration above is supplied. No existing Hollowmouth or Suno Producer repository is modified by this package.
