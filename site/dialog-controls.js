const bookDialog = document.querySelector('#book-dialog');
document.querySelector('#close-book-dialog').addEventListener('click', () => bookDialog.close());
document.querySelector('#cancel-book-dialog').addEventListener('click', () => bookDialog.close());
bookDialog.addEventListener('cancel', event => { event.preventDefault(); bookDialog.close(); });
