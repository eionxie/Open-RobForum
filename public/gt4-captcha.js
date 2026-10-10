(function () {
  'use strict';

  function post(type, value) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, value: value || '' }));
    }
  }

  function getConfig() {
    return fetch('/api/v1/captcha/config', { headers: { 'Cache-Control': 'no-cache' } })
      .then(function (r) { return r.json(); })
      .then(function (body) { return body && body.data ? body.data : null; })
      .catch(function () { return null; });
  }

  function loadGt4() {
    return new Promise(function (resolve, reject) {
      if (window.initGeetest4) { resolve(); return; }
      var script = document.createElement('script');
      script.src = 'https://static.geetest.com/v4/gt4.js';
      script.async = true;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('gt4 sdk load failed')); };
      document.head.appendChild(script);
    });
  }

  function start() {
    getConfig().then(function (config) {
      if (!config || !config.enabled || config.provider !== 'gt4' || config.adapter_status !== 'ready' || !config.site_key) {
        post('error', 'captcha not configured');
        return;
      }
      loadGt4().then(function () {
        try {
          window.initGeetest4({
            captchaId: config.site_key,
            product: 'float',
            language: 'zho',
            hideBar: true
          }, function (captcha) {
            captcha.appendTo(document.getElementById('captcha'));
            captcha.onSuccess(function () {
              post('success', JSON.stringify(captcha.getValidate() || {}));
            });
            captcha.onError(function () {
              post('error', '');
            });
            captcha.onClose(function () {
              post('close', '');
            });
          });
        } catch (e) {
          post('error', String((e && e.message) || 'init failed'));
        }
      }).catch(function (e) {
        post('error', String((e && e.message) || 'sdk load failed'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
