/**
 * YSK Analytics Tracking Script
 *
 * 사용법:
 * <script src="/js/ysk-analytics.js" data-site-code="YOUR_SITE_CODE" data-api-url="https://api.example.com"></script>
 *
 * 또는 수동 초기화:
 * <script>
 *   window.YSKAnalytics.init({
 *     siteCode: 'YOUR_SITE_CODE',
 *     apiUrl: 'https://api.example.com'
 *   });
 * </script>
 */
(function() {
  'use strict';

  // UUID v4 생성
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 쿠키 관리
  var Cookie = {
    set: function(name, value, days) {
      var expires = '';
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    },
    get: function(name) {
      var nameEQ = name + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(nameEQ) === 0) {
          return decodeURIComponent(c.substring(nameEQ.length));
        }
      }
      return null;
    }
  };

  // localStorage 래퍼 (fallback 포함)
  var Storage = {
    set: function(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        Cookie.set(key, value, 365);
      }
    },
    get: function(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return Cookie.get(key);
      }
    }
  };

  // 세션 스토리지 래퍼
  var Session = {
    set: function(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch (e) {
        Cookie.set(key, value);
      }
    },
    get: function(key) {
      try {
        return sessionStorage.getItem(key);
      } catch (e) {
        return Cookie.get(key);
      }
    }
  };

  // Analytics 메인 객체
  var YSKAnalytics = {
    config: {
      siteCode: null,
      apiUrl: null,
      debug: false
    },

    state: {
      visitorId: null,
      sessionId: null,
      pageLoadTime: null,
      initialized: false
    },

    // 초기화
    init: function(options) {
      if (this.state.initialized) {
        this.log('Already initialized');
        return;
      }

      // 설정 적용
      this.config.siteCode = options.siteCode;
      this.config.apiUrl = options.apiUrl || '';
      this.config.debug = options.debug || false;

      if (!this.config.siteCode) {
        console.error('[YSKAnalytics] siteCode is required');
        return;
      }

      // 방문자 ID 설정 (영구)
      this.state.visitorId = Storage.get('_ysk_vid');
      if (!this.state.visitorId) {
        this.state.visitorId = generateUUID();
        Storage.set('_ysk_vid', this.state.visitorId);
      }

      // 세션 ID 설정 (브라우저 세션)
      this.state.sessionId = Session.get('_ysk_sid');
      if (!this.state.sessionId) {
        this.state.sessionId = generateUUID();
        Session.set('_ysk_sid', this.state.sessionId);
      }

      // 페이지 로드 시간 기록
      this.state.pageLoadTime = Date.now();

      // 이벤트 리스너 등록
      this.setupEventListeners();

      // 페이지뷰 추적
      this.trackPageView();

      this.state.initialized = true;
      this.log('Initialized', this.config);
    },

    // 이벤트 리스너 설정
    setupEventListeners: function() {
      var self = this;

      // 페이지 이탈 추적 (beforeunload)
      window.addEventListener('beforeunload', function() {
        self.trackPageLeave();
      });

      // SPA 히스토리 변경 감지
      if (window.history && window.history.pushState) {
        var originalPushState = history.pushState;
        history.pushState = function() {
          originalPushState.apply(history, arguments);
          self.onRouteChange();
        };

        window.addEventListener('popstate', function() {
          self.onRouteChange();
        });
      }

      // 해시 변경 감지
      window.addEventListener('hashchange', function() {
        self.onRouteChange();
      });
    },

    // 라우트 변경 시 (SPA)
    onRouteChange: function() {
      // 이전 페이지 이탈 기록
      this.trackPageLeave();

      // 새 페이지뷰 기록
      this.state.pageLoadTime = Date.now();
      this.trackPageView();
    },

    // 페이지뷰 추적
    trackPageView: function() {
      var data = {
        eventType: 'pageview',
        visitorId: this.state.visitorId,
        sessionId: this.state.sessionId,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        pageUrl: window.location.href,
        referrer: document.referrer || null,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        language: navigator.language || navigator.userLanguage,
        timestamp: new Date().toISOString()
      };

      this.sendEvent(data);
    },

    // 페이지 이탈 추적
    trackPageLeave: function() {
      if (!this.state.pageLoadTime) return;

      var timeOnPage = Math.round((Date.now() - this.state.pageLoadTime) / 1000);

      var data = {
        eventType: 'pageleave',
        visitorId: this.state.visitorId,
        sessionId: this.state.sessionId,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        timeOnPage: timeOnPage,
        timestamp: new Date().toISOString()
      };

      // Beacon API 사용 (브라우저 종료 시에도 전송 보장)
      this.sendBeacon(data);
    },

    // 커스텀 이벤트 추적
    trackEvent: function(eventName, properties) {
      var data = {
        eventType: 'event',
        eventName: eventName,
        visitorId: this.state.visitorId,
        sessionId: this.state.sessionId,
        pagePath: window.location.pathname,
        properties: properties || {},
        timestamp: new Date().toISOString()
      };

      this.sendEvent(data);
    },

    // 이벤트 전송 (XHR)
    sendEvent: function(data) {
      var self = this;
      var url = this.config.apiUrl + '/api/analytics/track/' + this.config.siteCode;

      this.log('Sending event:', data);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            self.log('Event sent successfully');
          } else {
            self.log('Event send failed:', xhr.status);
          }
        }
      };
      xhr.send(JSON.stringify(data));
    },

    // Beacon API로 전송 (페이지 이탈 시)
    sendBeacon: function(data) {
      var url = this.config.apiUrl + '/api/analytics/track/' + this.config.siteCode;

      this.log('Sending beacon:', data);

      if (navigator.sendBeacon) {
        // Beacon API 사용 가능
        var blob = new Blob([JSON.stringify(data)], { type: 'text/plain' });
        navigator.sendBeacon(url, blob);
      } else {
        // Fallback: 동기 XHR
        var xhr = new XMLHttpRequest();
        xhr.open('POST', url, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        try {
          xhr.send(JSON.stringify(data));
        } catch (e) {
          this.log('Beacon fallback failed:', e);
        }
      }
    },

    // 디버그 로그
    log: function() {
      if (this.config.debug) {
        var args = ['[YSKAnalytics]'].concat(Array.prototype.slice.call(arguments));
        console.log.apply(console, args);
      }
    }
  };

  // 전역 객체에 등록
  window.YSKAnalytics = YSKAnalytics;

  // 자동 초기화 (스크립트 태그에서 data 속성으로 설정된 경우)
  document.addEventListener('DOMContentLoaded', function() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.src && script.src.indexOf('ysk-analytics.js') > -1) {
        var siteCode = script.getAttribute('data-site-code');
        var apiUrl = script.getAttribute('data-api-url');
        var debug = script.getAttribute('data-debug') === 'true';

        if (siteCode) {
          YSKAnalytics.init({
            siteCode: siteCode,
            apiUrl: apiUrl || '',
            debug: debug
          });
        }
        break;
      }
    }
  });
})();
