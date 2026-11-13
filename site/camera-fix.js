(() => {
  const scanButton = document.querySelector('#scan-barcode');
  const dialog = document.querySelector('#scanner-dialog');
  const video = document.querySelector('#barcode-video');
  const status = document.querySelector('#scanner-status');
  const isbnField = document.querySelector('#isbn-value');
  let stream = null;
  let scanTimer = null;

  const stop = () => {
    if (scanTimer) clearInterval(scanTimer);
    scanTimer = null;
    if (stream) stream.getTracks().forEach(track => track.stop());
    stream = null;
    video.srcObject = null;
  };

  async function requestCamera() {
    const attempts = [
      { video: { facingMode: { ideal: 'environment' } }, audio: false },
      { video: true, audio: false }
    ];
    let lastError;
    for (const constraints of attempts) {
      try { return await navigator.mediaDevices.getUserMedia(constraints); }
      catch (error) { lastError = error; }
    }
    throw lastError;
  }

  async function begin() {
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent = 'This browser does not provide camera access here. Type the ISBN below instead.';
      return;
    }
    status.textContent = 'Opening the camera…';
    try {
      stream = await requestCamera();
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await new Promise(resolve => video.readyState >= 2 ? resolve() : video.addEventListener('loadeddata', resolve, { once: true }));
      try { await video.play(); } catch { /* Frame still commonly arrives on mobile after permission. */ }
      if (!('BarcodeDetector' in window)) {
        status.textContent = 'Camera is ready. This browser cannot read the barcode automatically, so type the ISBN below.';
        return;
      }
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'isbn_10', 'isbn_13', 'upc_a'] });
      status.textContent = 'Camera is ready. Point it at the ISBN barcode.';
      scanTimer = setInterval(async () => {
        try {
          const codes = await detector.detect(video);
          if (!codes[0]?.rawValue) return;
          isbnField.value = codes[0].rawValue;
          document.querySelector('#isbn-form').requestSubmit();
        } catch { /* Try the next frame. */ }
      }, 500);
    } catch (error) {
      const name = error?.name || '';
      status.textContent = name === 'NotAllowedError'
        ? 'Camera permission is blocked for this site. Use the browser’s site settings to allow Camera, then try again—or type the ISBN below.'
        : name === 'NotFoundError'
          ? 'No camera was found on this device. Type the ISBN below.'
          : 'The camera could not start here. Type the ISBN below, or close any other app using the camera and try again.';
    }
  }

  scanButton.addEventListener('click', event => {
    event.stopImmediatePropagation();
    dialog.showModal();
    begin();
  }, true);
  dialog.addEventListener('close', stop);
})();
