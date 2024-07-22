import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

document.addEventListener('DOMContentLoaded', function () {
  try {
    console.log('Hello from the index page!');

    const copyButton = document.getElementById('copyScriptButton');
    if (copyButton) {
      copyButton.addEventListener('click', function () {
        copyToClipboard('scriptContent', 'Script');
      });
    }
    function showToast(type, message) {
      if (typeof iziToast !== 'undefined') {
        iziToast[type]({
          message: message,
          position: 'bottomRight',
        });
      } else {
        alert(message);
      }
    }

    function copyToClipboard(elementId, contentName) {
      const content = elementId
        ? document.getElementById(elementId).textContent
        : contentName;

      if (navigator.clipboard && window.isSecureContext) {
        // Use the Clipboard API if available and in a secure context
        navigator.clipboard
          .writeText(content)
          .then(() => {
            showToast('success', `${contentName} copied to clipboard!`);
          })
          .catch(err => {
            showToast(
              'error',
              `Failed to copy ${contentName.toLowerCase()}: ${err}`
            );
          });
      } else {
        // Fallback to using a temporary textarea element
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed'; // Avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          showToast('success', `${contentName} copied to clipboard!`);
        } catch (err) {
          showToast(
            'error',
            `Failed to copy ${contentName.toLowerCase()}: ${err}`
          );
        }

        document.body.removeChild(textArea);
      }
    }

    const toggleButton = document.getElementById('toggleCredentials');
    const obfuscatedElements = document.querySelectorAll('.obfuscated');
    let credentialsVisible = false;

    if (toggleButton) {
      toggleButton.addEventListener('click', function () {
        credentialsVisible = !credentialsVisible;
        obfuscatedElements.forEach(element => {
          if (credentialsVisible) {
            element.textContent = element.dataset.content;
          } else {
            element.textContent = '••••••••';
          }
        });
        toggleButton.textContent = credentialsVisible ? 'Hide' : 'Show';
      });
    }

    document.querySelectorAll('.credential-value').forEach(element => {
      element.addEventListener('click', function () {
        const credentialName = this.previousElementSibling.textContent
          .trim()
          .slice(0, -1);
        const credentialValue = this.dataset.content;
        copyToClipboard(null, credentialName, credentialValue);
      });
    });
  } catch (error) {
    console.error('An error occurred:', error);
  }
});
