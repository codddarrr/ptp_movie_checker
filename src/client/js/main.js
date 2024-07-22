import '@popperjs/core';
import 'bootstrap';
import hljs from 'highlight.js';
import ClipboardJS from 'clipboard';

document.addEventListener('DOMContentLoaded', function () {
  new ClipboardJS('.btn-copy');
  hljs.highlightAll();
});
