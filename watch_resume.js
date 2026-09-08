(function (exports) {
    'use strict';

    var strings = {
      watch_resume_title: {
        ru: 'Продолжить просмотр',
        en: 'Continue watching'
      },
      watch_resume_online: {
        ru: 'Онлайн',
        en: 'Online'
      },
      watch_resume_torrent: {
        ru: 'Торрент',
        en: 'Torrent'
      },
      watch_resume_continue: {
        ru: 'Продолжить',
        en: 'Continue'
      },
      watch_resume_loading: {
        ru: 'Восстанавливаем просмотр',
        en: 'Restoring playback'
      },
      watch_resume_failed: {
        ru: 'Не удалось восстановить просмотр',
        en: 'Could not restore playback'
      },
      watch_resume_empty: {
        ru: 'Нет сохранённого просмотра',
        en: 'No saved progress'
      },
      watch_resume_sync: {
        ru: 'Синхронизация просмотра',
        en: 'Watch progress sync'
      }
    };
    function registerLanguage(Lampa) {
      if (Lampa && Lampa.Lang && typeof Lampa.Lang.add === 'function') Lampa.Lang.add(strings);
    }

    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    function _arrayWithHoles(r) {
      if (Array.isArray(r)) return r;
    }
    function _arrayWithoutHoles(r) {
      if (Array.isArray(r)) return _arrayLikeToArray(r);
    }
    function asyncGeneratorStep(n, t, e, r, o, a, c) {
      try {
        var i = n[a](c),
          u = i.value;
      } catch (n) {
        return void e(n);
      }
      i.done ? t(u) : Promise.resolve(u).then(r, o);
    }
    function _asyncToGenerator(n) {
      return function () {
        var t = this,
          e = arguments;
        return new Promise(function (r, o) {
          var a = n.apply(t, e);
          function _next(n) {
            asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
          }
          function _throw(n) {
            asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
          }
          _next(void 0);
        });
      };
    }
    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }) : e[r] = t, e;
    }
    function _iterableToArray(r) {
      if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
    }
    function _iterableToArrayLimit(r, l) {
      var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (null != t) {
        var e,
          n,
          i,
          u,
          a = [],
          f = !0,
          o = !1;
        try {
          if (i = (t = t.call(r)).next, 0 === l) {
            if (Object(t) !== t) return;
            f = !1;
          } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
        } catch (r) {
          o = !0, n = r;
        } finally {
          try {
            if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
          } finally {
            if (o) throw n;
          }
        }
        return a;
      }
    }
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function (r) {
          return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
      }
      return e;
    }
    function _regenerator() {
      /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */
      var e,
        t,
        r = "function" == typeof Symbol ? Symbol : {},
        n = r.iterator || "@@iterator",
        o = r.toStringTag || "@@toStringTag";
      function i(r, n, o, i) {
        var c = n && n.prototype instanceof Generator ? n : Generator,
          u = Object.create(c.prototype);
        return _regeneratorDefine(u, "_invoke", function (r, n, o) {
          var i,
            c,
            u,
            f = 0,
            p = o || [],
            y = !1,
            G = {
              p: 0,
              n: 0,
              v: e,
              a: d,
              f: d.bind(e, 4),
              d: function (t, r) {
                return i = t, c = 0, u = e, G.n = r, a;
              }
            };
          function d(r, n) {
            for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) {
              var o,
                i = p[t],
                d = G.p,
                l = i[2];
              r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0));
            }
            if (o || r > 1) return a;
            throw y = !0, n;
          }
          return function (o, p, l) {
            if (f > 1) throw TypeError("Generator is already running");
            for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) {
              i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u);
              try {
                if (f = 2, i) {
                  if (c || (o = "next"), t = i[o]) {
                    if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object");
                    if (!t.done) return t;
                    u = t.value, c < 2 && (c = 0);
                  } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1);
                  i = e;
                } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break;
              } catch (t) {
                i = e, c = 1, u = t;
              } finally {
                f = 1;
              }
            }
            return {
              value: t,
              done: y
            };
          };
        }(r, o, i), !0), u;
      }
      var a = {};
      function Generator() {}
      function GeneratorFunction() {}
      function GeneratorFunctionPrototype() {}
      t = Object.getPrototypeOf;
      var c = [][n] ? t(t([][n]())) : (_regeneratorDefine(t = {}, n, function () {
          return this;
        }), t),
        u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c);
      function f(e) {
        return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e;
      }
      return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine(u), _regeneratorDefine(u, o, "Generator"), _regeneratorDefine(u, n, function () {
        return this;
      }), _regeneratorDefine(u, "toString", function () {
        return "[object Generator]";
      }), (_regenerator = function () {
        return {
          w: i,
          m: f
        };
      })();
    }
    function _regeneratorDefine(e, r, n, t) {
      var i = Object.defineProperty;
      try {
        i({}, "", {});
      } catch (e) {
        i = 0;
      }
      _regeneratorDefine = function (e, r, n, t) {
        function o(r, n) {
          _regeneratorDefine(e, r, function (e) {
            return this._invoke(r, n, e);
          });
        }
        r ? i ? i(e, r, {
          value: n,
          enumerable: !t,
          configurable: !t,
          writable: !t
        }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2));
      }, _regeneratorDefine(e, r, n, t);
    }
    function _slicedToArray(r, e) {
      return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
    }
    function _toConsumableArray(r) {
      return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
    }
    function _toPrimitive(t, r) {
      if ("object" != typeof t || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == typeof i ? i : i + "";
    }
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
      }
    }

    var SYNC_KEY = 'lampac_resume_history_v1';
    var CACHE_KEY = 'lampac_resume_history_cache_v1';
    var SCHEMA_VERSION = 1;
    var WRITE_INTERVAL_MS = 15000;
    var TORRSERVER_WRITE_INTERVAL_MS = 30000;

    var text$2 = function text(value) {
      return typeof value === 'string' ? value.trim() : '';
    };
    var number$1 = function number(value) {
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    };
    var validAlias = function validAlias(value) {
      return /^(?:source:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+|tmdb:\d+|imdb:tt\d+|kinopoisk:\d+)$/.test(value);
    };
    var canonicalAlias = function canonicalAlias(aliases) {
      return aliases.find(function (value) {
        return value.indexOf('tmdb:') === 0;
      }) || aliases.find(function (value) {
        return value.indexOf('source:') === 0;
      }) || aliases.find(function (value) {
        return value.indexOf('imdb:') === 0;
      }) || aliases.find(function (value) {
        return value.indexOf('kinopoisk:') === 0;
      });
    };
    function cardIdentity() {
      var card = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var source = text$2(card.source) || 'tmdb';
      var id = card.id;
      var tmdb = card.tmdb_id || (source === 'tmdb' ? id : 0);
      var imdb = text$2(card.imdb_id);
      var kinopoisk = card.kinopoisk_id || 0;
      var aliases = [];
      if (id !== undefined && id !== null) aliases.push('source:' + source + ':' + id);
      if (tmdb) aliases.push('tmdb:' + tmdb);
      if (imdb) aliases.push('imdb:' + imdb);
      if (kinopoisk) aliases.push('kinopoisk:' + kinopoisk);
      return {
        key: aliases.find(function (value) {
          return value.indexOf('tmdb:') === 0;
        }) || aliases[0] || '',
        aliases: Array.from(new Set(aliases)),
        card: {
          source: source,
          id: id,
          tmdb: tmdb || 0,
          imdb: imdb,
          kinopoisk: kinopoisk || 0
        }
      };
    }
    function sanitizeProgress() {
      var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var duration = Math.max(0, number$1(input.duration));
      var time = Math.max(0, number$1(input.time));
      var calculated = duration ? time / duration * 100 : 0;
      var percent = Math.max(0, Math.min(100, number$1(input.percent) || calculated));
      return {
        time: time,
        duration: duration,
        percent: percent
      };
    }
    function emptyHistory() {
      return {
        schema: SCHEMA_VERSION,
        cards: {}
      };
    }
    function sanitizeModeRecord() {
      var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var mode = input.mode === 'torrent' ? 'torrent' : input.mode === 'online' ? 'online' : '';
      if (!mode) return null;
      var episode = input.episode || {};
      var base = {
        mode: mode,
        updated_at: Math.max(0, number$1(input.updated_at)),
        episode: {
          season: Math.max(0, number$1(episode.season)),
          episode: Math.max(0, number$1(episode.episode)),
          timeline_hash: text$2(episode.timeline_hash)
        },
        progress: sanitizeProgress(input.progress),
        playlist: {
          kind: 'season',
          selected_season: Math.max(0, number$1(episode.season)),
          selected_episode: Math.max(0, number$1(episode.episode))
        }
      };
      if (mode === 'online') {
        var source = input.online || {};
        var search = source.search || {};
        base.online = {
          component: text$2(source.component) || 'lampac',
          balanser: text$2(source.balanser),
          voice_id: text$2(source.voice_id),
          voice_name: text$2(source.voice_name),
          clarification: text$2(source.clarification),
          search: {
            title: text$2(search.title),
            original_title: text$2(search.original_title),
            year: Math.max(0, number$1(search.year))
          }
        };
        if (!base.online.balanser) return null;
      } else {
        var _source = input.torrent || {};
        base.torrent = {
          infohash: text$2(_source.infohash).toUpperCase(),
          magnet: text$2(_source.magnet).indexOf('magnet:') === 0 ? text$2(_source.magnet) : '',
          file_index: Math.max(0, number$1(_source.file_index)),
          file_path: text$2(_source.file_path),
          torrent_title: text$2(_source.torrent_title)
        };
        if (!base.torrent.infohash || !base.torrent.file_path) return null;
      }
      return base;
    }
    function sanitizeHistory(input) {
      var root = emptyHistory();
      if (!input || Number(input.schema) !== SCHEMA_VERSION || !input.cards) return root;
      Object.keys(input.cards).forEach(function (key) {
        var source = input.cards[key] || {};
        var modes = {};
        ['online', 'torrent'].forEach(function (mode) {
          var clean = sanitizeModeRecord(source.modes && source.modes[mode]);
          if (clean) modes[mode] = clean;
        });
        if (Object.keys(modes).length) {
          var newest = Object.values(modes).sort(function (a, b) {
            return b.updated_at - a.updated_at;
          })[0];
          var aliases = Array.from(new Set((source.aliases || []).filter(function (value) {
            return typeof value === 'string';
          }).map(function (value) {
            return value.trim();
          }).filter(validAlias)));
          var safeKey = canonicalAlias(aliases);
          if (!safeKey) return;
          root.cards[safeKey] = {
            aliases: aliases,
            last_mode: newest.mode,
            modes: modes
          };
        }
      });
      return root;
    }

    var text$1 = function text(value) {
      return typeof value === 'string' ? value.trim() : '';
    };
    var number = function number(value) {
      return Number.isFinite(Number(value)) ? Number(value) : 0;
    };
    var timelineHash = function timelineHash(item) {
      return text$1(item && (item.timeline_hash || item.timeline && item.timeline.hash || item.hash));
    };
    var sameProgress = function sameProgress(left, right) {
      return left.time === right.time && left.duration === right.duration && left.percent === right.percent;
    };
    function onlineRecipe() {
      var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var search = input.search || {};
      return {
        component: text$1(input.component) || 'lampac',
        balanser: text$1(input.balanser),
        voice_id: text$1(input.voice_id),
        voice_name: text$1(input.voice_name),
        clarification: text$1(input.clarification),
        search: {
          title: text$1(search.title),
          original_title: text$1(search.original_title),
          year: number(search.year)
        }
      };
    }
    function torrentRecipe() {
      var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var magnet = text$1(input.magnet || input.torrent_magnet);
      return {
        infohash: text$1(input.infohash || input.torrent_hash),
        magnet: magnet.indexOf('magnet:') === 0 ? magnet : '',
        file_index: number(input.file_index === undefined ? input.id : input.file_index),
        file_path: text$1(input.file_path || input.path),
        torrent_title: text$1(input.torrent_title || input.path_human || input.title)
      };
    }
    function usableTorrent(input) {
      if (!input) return null;
      var recipe = torrentRecipe(input);
      return recipe.infohash && recipe.file_path ? recipe : null;
    }
    function torrentForItem(item, fallback) {
      var metadata = resumeMetadata$1(item);
      var source = metadata.mode === 'torrent' && metadata.torrent ? _objectSpread2(_objectSpread2({}, item), metadata.torrent) : item;
      var active = usableTorrent(source);
      if (!active) return fallback;
      return _objectSpread2(_objectSpread2(_objectSpread2({}, fallback), active), {}, {
        magnet: active.magnet || fallback.magnet,
        torrent_title: active.torrent_title || fallback.torrent_title
      });
    }
    function resumeMetadata$1() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var resume = data.lampac_resume || {};
      return resume.recipe || resume;
    }
    function itemMatch(items, data) {
      var hash = timelineHash(data);
      return items.find(function (item) {
        return timelineHash(item) === hash;
      }) || items.find(function (item) {
        return number(item.season) === number(data.season) && number(item.episode) === number(data.episode);
      }) || data;
    }
    function sameCard(left, right) {
      var leftAliases = cardIdentity(left).aliases;
      var rightAliases = cardIdentity(right).aliases;
      return leftAliases.some(function (alias) {
        return rightAliases.indexOf(alias) >= 0;
      });
    }
    function sameItem(left, right) {
      var leftHash = timelineHash(left);
      var rightHash = timelineHash(right);
      if (leftHash && rightHash) return leftHash === rightHash;
      if (left && right && text$1(left.torrent_hash) && text$1(right.torrent_hash)) {
        return text$1(left.torrent_hash) === text$1(right.torrent_hash) && number(left.id) === number(right.id);
      }
      return Boolean(left && right && (number(left.season) || number(left.episode)) && number(left.season) === number(right.season) && number(left.episode) === number(right.episode));
    }
    function createCapture(Lampa, store) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      var session = null;
      var lastWrite = 0;
      function stagePlayback(data) {
        if (!data) return null;
        var metadata = resumeMetadata$1(data);
        var card = data.card;
        var playlist = Array.isArray(data.playlist) ? data.playlist.slice() : [];
        var selected = itemMatch(playlist, data);
        var items = playlist.length ? playlist : [selected];
        var byHash = {};
        items.forEach(function (item) {
          var hash = timelineHash(item);
          if (hash) byHash[hash] = item;
        });
        if (metadata.mode === 'online' && metadata.online && card) {
          return {
            card: card,
            mode: 'online',
            online: onlineRecipe(metadata.online),
            item: selected,
            byHash: byHash,
            progress: sanitizeProgress(selected.timeline || {})
          };
        }
        var source = metadata.mode === 'torrent' && metadata.torrent ? _objectSpread2(_objectSpread2({}, data), metadata.torrent) : data;
        var torrent = usableTorrent(source);
        if (!torrent || !card) return null;
        if (!timelineHash(selected) && source && source.timeline_hash) selected.timeline_hash = source.timeline_hash;
        if (timelineHash(selected)) byHash[timelineHash(selected)] = selected;
        return {
          card: card,
          mode: 'torrent',
          torrent: torrent,
          item: selected,
          byHash: byHash,
          progress: sanitizeProgress(selected.timeline || {})
        };
      }
      function recordFromSession(current) {
        var item = current.item || {};
        return _defineProperty({
          mode: current.mode,
          updated_at: Date.now(),
          episode: {
            season: number(item.season),
            episode: number(item.episode),
            timeline_hash: timelineHash(item)
          },
          progress: sanitizeProgress(current.progress)
        }, current.mode, current.mode === 'online' ? current.online : current.torrent);
      }
      function commit() {
        var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        var now = Date.now();
        if (!session || !session.confirmed || !force && now - lastWrite < WRITE_INTERVAL_MS) return;
        lastWrite = now;
        store.upsert(session.card, recordFromSession(session));
      }
      function writeTorrentTimecode(force) {
        if (!session || !session.external || session.mode !== 'torrent' || !options.writeTorrentTimecode) return;
        options.writeTorrentTimecode(session.torrent.infohash, session.torrent.file_index, session.progress.time, force);
      }
      function onCreate(event) {
        var data = event && event.data;
        session = stagePlayback(data);
        if (session) {
          session.launchedHash = timelineHash(session.item);
          session.launchedProgress = _objectSpread2({}, session.progress);
        }
      }
      function confirm(data, external) {
        if (!session) session = stagePlayback(data);
        if (!session) return;
        session.confirmed = true;
        session.external = external;
        commit(true);
      }
      function onStart(data) {
        confirm(data, false);
      }
      function onExternal(data) {
        confirm(data, true);
      }
      function onTimeline(event) {
        if (!session || !session.confirmed || !event || !event.data) return;
        var hash = text$1(event.data.hash);
        var item = session.byHash[hash];
        if (!item) return;
        var progress = sanitizeProgress(event.data.road);
        if (session.external && session.externalProgressSeen && hash === session.launchedHash && sameProgress(progress, session.launchedProgress)) return;
        if (session.external) session.externalProgressSeen = true;
        session.item = item;
        session.torrent = torrentForItem(item, session.torrent);
        session.progress = progress;
        commit(session.external);
        writeTorrentTimecode(session.external);
      }
      function setPlaylist(playlist, position) {
        if (!session || !Array.isArray(playlist)) return;
        session.byHash = {};
        playlist.forEach(function (item) {
          var hash = timelineHash(item);
          if (hash) session.byHash[hash] = item;
        });
        if (playlist[position]) {
          session.item = playlist[position];
          if (session.mode === 'torrent') session.torrent = torrentForItem(session.item, session.torrent);
        }
      }
      function onPlaylistSet(event) {
        if (!event) return;
        setPlaylist(event.playlist, event.position);
      }
      function onPlaylistSelect(event) {
        if (!session || !session.confirmed || !event || !event.item) return;
        commit(true);
        setPlaylist(event.playlist, event.position);
        session.item = event.item;
        var hash = timelineHash(event.item);
        if (hash) session.byHash[hash] = event.item;
        session.progress = sanitizeProgress(event.item.timeline || {});
        commit(true);
      }
      function onTorrentFile(event) {
        if (!session || session.mode !== 'torrent' || !event || event.type !== 'onenter' || !event.element) return;
        var source = _objectSpread2(_objectSpread2({}, event.element), {}, {
          card: event.element.card || event.params && event.params.movie
        });
        var torrent = usableTorrent(source);
        if (!torrent || !source.card || !sameCard(session.card, source.card) || !sameItem(session.item, source)) return;
        session.torrent = torrentForItem(source, session.torrent);
        session.item = source;
        var hash = timelineHash(source);
        if (hash) session.byHash[hash] = source;
        if (session.confirmed) commit(true);
      }
      function onDestroy() {
        if (!session) return;
        commit(true);
        writeTorrentTimecode(true);
        session = null;
      }
      function start() {
        Lampa.Player.listener.follow('create', onCreate);
        Lampa.Player.listener.follow('start', onStart);
        Lampa.Player.listener.follow('external', onExternal);
        Lampa.Player.listener.follow('destroy', onDestroy);
        Lampa.PlayerPlaylist.listener.follow('set', onPlaylistSet);
        Lampa.PlayerPlaylist.listener.follow('select', onPlaylistSelect);
        Lampa.Timeline.listener.follow('update', onTimeline);
        Lampa.Listener.follow('torrent_file', onTorrentFile);
      }
      function stop() {
        Lampa.Player.listener.remove('create', onCreate);
        Lampa.Player.listener.remove('start', onStart);
        Lampa.Player.listener.remove('external', onExternal);
        Lampa.Player.listener.remove('destroy', onDestroy);
        Lampa.PlayerPlaylist.listener.remove('set', onPlaylistSet);
        Lampa.PlayerPlaylist.listener.remove('select', onPlaylistSelect);
        Lampa.Timeline.listener.remove('update', onTimeline);
        Lampa.Listener.remove('torrent_file', onTorrentFile);
      }
      return {
        start: start,
        stop: stop,
        currentSession: function currentSession() {
          return session;
        }
      };
    }

    var modesOf = function modesOf(entry) {
      return entry && entry.modes ? entry.modes : {};
    };
    var newestMode = function newestMode(modes) {
      return Object.values(modes).sort(function (left, right) {
        return right.updated_at - left.updated_at;
      })[0];
    };
    function mergeHistory(leftInput, rightInput) {
      var left = sanitizeHistory(leftInput);
      var right = sanitizeHistory(rightInput);
      var result = emptyHistory();
      var incoming = [].concat(_toConsumableArray(Object.entries(left.cards)), _toConsumableArray(Object.entries(right.cards)));
      incoming.forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2),
          sourceKey = _ref2[0],
          source = _ref2[1];
        var aliases = Array.from(new Set([sourceKey].concat(_toConsumableArray(source.aliases || []))));
        var matches = Object.entries(result.cards).filter(function (_ref3) {
          var _ref4 = _slicedToArray(_ref3, 2),
            key = _ref4[0],
            entry = _ref4[1];
          var known = [key].concat(_toConsumableArray(entry.aliases || []));
          return aliases.some(function (alias) {
            return known.indexOf(alias) >= 0;
          });
        });
        var existingKey = matches.length ? matches[0][0] : '';
        var knownAliases = matches.flatMap(function (_ref5) {
          var _ref6 = _slicedToArray(_ref5, 2),
            key = _ref6[0],
            entry = _ref6[1];
          return [key].concat(_toConsumableArray(entry.aliases || []));
        });
        var allAliases = Array.from(new Set([].concat(_toConsumableArray(knownAliases), aliases)));
        var preferredKey = allAliases.find(function (alias) {
          return alias.indexOf('tmdb:') === 0;
        }) || existingKey || sourceKey;
        var modes = {};
        matches.forEach(function (_ref7) {
          var _ref8 = _slicedToArray(_ref7, 2),
            entry = _ref8[1];
          ['online', 'torrent'].forEach(function (mode) {
            var candidate = modesOf(entry)[mode];
            if (candidate && (!modes[mode] || candidate.updated_at > modes[mode].updated_at)) {
              modes[mode] = candidate;
            }
          });
        });
        ['online', 'torrent'].forEach(function (mode) {
          var candidate = modesOf(source)[mode];
          if (candidate && (!modes[mode] || candidate.updated_at > modes[mode].updated_at)) {
            modes[mode] = candidate;
          }
        });
        matches.forEach(function (_ref9) {
          var _ref0 = _slicedToArray(_ref9, 1),
            key = _ref0[0];
          return delete result.cards[key];
        });
        var newest = newestMode(modes);
        result.cards[preferredKey] = {
          aliases: allAliases,
          last_mode: newest ? newest.mode : '',
          modes: modes
        };
      });
      return result;
    }
    function createRecipeStore(Lampa) {
      var value = mergeHistory(Lampa.Storage.get(SYNC_KEY, emptyHistory()), Lampa.Storage.get(CACHE_KEY, emptyHistory()));
      var listeners = [];
      function persist(next) {
        var clean = sanitizeHistory(next);
        var syncBefore = JSON.stringify(Lampa.Storage.get(SYNC_KEY, emptyHistory()));
        value = clean;
        Lampa.Storage.set(CACHE_KEY, clean, true);
        if (syncBefore !== JSON.stringify(clean)) Lampa.Storage.set(SYNC_KEY, clean);
        listeners.slice().forEach(function (listener) {
          return listener(clean);
        });
      }
      function find(card) {
        var identity = cardIdentity(card);
        var direct = value.cards[identity.key];
        if (direct) return direct;
        return Object.values(value.cards).find(function (entry) {
          return entry.aliases.some(function (alias) {
            return identity.aliases.indexOf(alias) >= 0;
          });
        }) || null;
      }
      function upsert(card, input) {
        var record = sanitizeModeRecord(input);
        var identity = cardIdentity(card);
        if (!record || !identity.key) return null;
        var next = mergeHistory(value, emptyHistory());
        var previousKey = Object.keys(next.cards).find(function (key) {
          return key === identity.key || next.cards[key].aliases.some(function (alias) {
            return identity.aliases.indexOf(alias) >= 0;
          });
        });
        var previous = previousKey ? next.cards[previousKey] : {
          aliases: [],
          modes: {}
        };
        var modes = _objectSpread2(_objectSpread2({}, previous.modes), {}, _defineProperty({}, record.mode, record));
        var newest = newestMode(modes);
        if (previousKey && previousKey !== identity.key) delete next.cards[previousKey];
        next.cards[identity.key] = {
          aliases: Array.from(new Set([].concat(_toConsumableArray(previous.aliases), _toConsumableArray(identity.aliases)))),
          last_mode: newest.mode,
          modes: modes
        };
        persist(next);
        return next.cards[identity.key];
      }
      function mergeSynced() {
        persist(mergeHistory(value, Lampa.Storage.get(SYNC_KEY, emptyHistory())));
      }
      return {
        read: function read() {
          return value;
        },
        find: find,
        upsert: upsert,
        mergeSynced: mergeSynced,
        subscribe: function subscribe(listener) {
          listeners.push(listener);
          var active = true;
          return function () {
            if (!active) return;
            active = false;
            var index = listeners.indexOf(listener);
            if (index >= 0) listeners.splice(index, 1);
          };
        }
      };
    }

    var SEEN_PERCENT = 90;
    function selectLastMode(history) {
      if (!history || !history.modes) return null;
      return Object.values(history.modes).filter(function (record) {
        return record && (record.mode === 'online' || record.mode === 'torrent');
      }).sort(function (left, right) {
        return Number(right.updated_at) - Number(left.updated_at);
      })[0] || null;
    }
    function chooseResumeTarget(record, playlist) {
      var episode = record && record.episode ? record.episode : {};
      var items = Array.isArray(playlist) ? playlist : [];
      var hash = episode.timeline_hash;
      var index = hash ? items.findIndex(function (item) {
        return item && item.timeline && item.timeline.hash === hash;
      }) : -1;
      if (index < 0) index = items.findIndex(function (item) {
        return item && Number(item.season) === Number(episode.season) && Number(item.episode) === Number(episode.episode);
      });
      if (index < 0) throw new Error('resume-episode-missing');
      var progress = record && record.progress ? record.progress : {};
      if (Number(progress.percent) >= SEEN_PERCENT) {
        var nextIndex = index + 1 < items.length ? index + 1 : index;
        var item = items[nextIndex];
        var duration = Number(item && item.timeline && item.timeline.duration);
        return {
          item: item,
          index: nextIndex,
          time: 0,
          progress: _objectSpread2(_objectSpread2({
            time: 0
          }, duration > 0 ? {
            duration: duration
          } : {}), {}, {
            percent: 0
          })
        };
      }
      return {
        item: items[index],
        index: index,
        time: Number(progress.time) || 0,
        progress: _objectSpread2(_objectSpread2({}, progress), {}, {
          time: Number(progress.time) || 0
        })
      };
    }
    function createResumeOrchestrator(_ref) {
      var store = _ref.store,
        online = _ref.online,
        torrent = _ref.torrent,
        launcher = _ref.launcher;
      return {
        resume: function resume(card, fallback, beforeLaunch) {
          return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
            var history, record, adapter, resolved, target, opened, _t;
            return _regenerator().w(function (_context) {
              while (1) switch (_context.p = _context.n) {
                case 0:
                  history = store.find(card);
                  record = selectLastMode(history);
                  if (record) {
                    _context.n = 1;
                    break;
                  }
                  throw new Error('resume-history-missing');
                case 1:
                  adapter = record.mode === 'online' ? online : torrent;
                  _context.p = 2;
                  _context.n = 3;
                  return adapter.resolve(card, record);
                case 3:
                  resolved = _context.v;
                  target = chooseResumeTarget(record, resolved.playlist);
                  if (typeof beforeLaunch === 'function') beforeLaunch();
                  _context.n = 4;
                  return launcher.launch({
                    item: target.item,
                    playlist: resolved.playlist,
                    progress: target.progress,
                    mode: record.mode
                  });
                case 4:
                  _context.n = 7;
                  break;
                case 5:
                  _context.p = 5;
                  _t = _context.v;
                  _context.n = 6;
                  return fallback(record.mode, _t);
                case 6:
                  opened = _context.v;
                  if (!(opened === false)) {
                    _context.n = 7;
                    break;
                  }
                  throw new Error('resume-fallback-unavailable');
                case 7:
                  return _context.a(2);
              }
            }, _callee, null, [[2, 5]]);
          }))();
        }
      };
    }

    function normalizePlaylist(playlist, selected, progress, Lampa) {
      if (!Array.isArray(playlist)) throw new Error('resume-playlist');
      var index = playlist.indexOf(selected);
      if (index < 0) throw new Error('resume-selected-item');
      var normalized = playlist.map(function (item, itemIndex) {
        if (!item || typeof item.url !== 'string' || !item.url) throw new Error('resume-playlist-url');
        var copy = _objectSpread2({}, item);
        var current = item.timeline || {};
        var hash = current.hash || item.timeline_hash;
        if (!hash) throw new Error('resume-playlist-timeline');
        var fresh = typeof current.handler === 'function' ? {} : Lampa.Timeline.view(hash);
        copy.timeline = _objectSpread2(_objectSpread2(_objectSpread2({}, fresh || {}), current), {}, {
          hash: hash,
          handler: current.handler || fresh && fresh.handler
        });
        if (typeof copy.timeline.handler !== 'function') throw new Error('resume-playlist-timeline');
        if (itemIndex === index) {
          copy.timeline = _objectSpread2(_objectSpread2({}, copy.timeline), {}, {
            time: Number(progress && progress.time) || 0,
            duration: Number(progress && progress.duration) > 0 ? Number(progress.duration) : copy.timeline.duration,
            percent: Number.isFinite(Number(progress && progress.percent)) ? Number(progress.percent) : copy.timeline.percent
          });
        }
        return copy;
      });
      return {
        item: normalized[index],
        playlist: normalized,
        index: index
      };
    }
    function createPlayerLauncher(Lampa) {
      return {
        launch: function launch(payload) {
          var result = normalizePlaylist(payload.playlist, payload.item, payload.progress, Lampa);
          var data = _objectSpread2(_objectSpread2({}, result.item), {}, {
            playlist: result.playlist,
            return_result: true
          });
          var android = Lampa.Platform.is('android') && ['android'].indexOf(Lampa.Storage.field(payload.mode === 'torrent' ? 'player_torrent' : 'player')) >= 0;
          var previous = Lampa.Storage.get('playlist_next', true);
          return new Promise(function (resolve, reject) {
            var timer;
            var finished = false;
            var cleanup = function cleanup() {
              if (finished) return false;
              finished = true;
              clearTimeout(timer);
              Lampa.Player.listener.remove('start', complete);
              Lampa.Player.listener.remove('external', complete);
              Lampa.Player.listener.remove('destroy', complete);
              if (android) Lampa.Storage.set('playlist_next', previous, true);
              return true;
            };
            var complete = function complete() {
              if (!cleanup()) return;
              resolve();
            };
            if (android) Lampa.Storage.set('playlist_next', true, true);
            Lampa.Player.listener.follow('start', complete);
            Lampa.Player.listener.follow('external', complete);
            Lampa.Player.listener.follow('destroy', complete);
            timer = setTimeout(complete, 10000);
            try {
              Lampa.Player.play(data);
              Lampa.Player.playlist(result.playlist);
            } catch (error) {
              cleanup();
              reject(error);
            }
          });
        }
      };
    }

    var translation = function translation(Lampa, key, fallback) {
      return Lampa && Lampa.Lang && typeof Lampa.Lang.translate === 'function' ? Lampa.Lang.translate(key) : fallback;
    };
    var rootFor = function rootFor(event) {
      if (event && event.body && typeof event.body.find === 'function') return event.body;
      var activity = event && event.object && event.object.activity;
      if (!activity || typeof activity.render !== 'function') return null;
      var rendered = activity.render();
      if (rendered && typeof rendered.find === 'function') return rendered;
      return typeof $ === 'function' ? $(rendered) : null;
    };
    var latestRecord = function latestRecord(history) {
      if (!history || !history.modes) return null;
      return Object.values(history.modes).filter(function (record) {
        return record && (record.mode === 'online' || record.mode === 'torrent');
      }).filter(function (record) {
        return record.episode && Number(record.episode.season) > 0 && Number(record.episode.episode) > 0;
      }).sort(function (left, right) {
        return Number(right.updated_at) - Number(left.updated_at);
      })[0] || null;
    };
    var isSeries = function isSeries(card) {
      return card && Number(card.number_of_seasons) > 0;
    };
    var labelFor = function labelFor(record) {
      return 'S' + String(Number(record.episode.season)).padStart(2, '0') + 'E' + String(Number(record.episode.episode)).padStart(2, '0');
    };
    var renderButton = function renderButton(Lampa, label) {
      return "<div class=\"full-start__button selector view--watch-resume\">\n    <svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path fill=\"currentColor\" d=\"M8 5v14l11-7z\"/><path fill=\"currentColor\" d=\"M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8z\"/></svg>\n    <span>".concat(translation(Lampa, 'watch_resume_continue', 'Continue'), " \xB7 ").concat(label, "</span>\n</div>");
    };
    function openSameMode(event, mode) {
      if (mode !== 'online' && mode !== 'torrent') return false;
      try {
        var root = rootFor(event);
        var action = root && root.find('.view--' + mode).last();
        if (!action || !action.length) return false;
        action.trigger('hover:enter');
        return true;
      } catch (error) {
        return false;
      }
    }
    function createResumeButton(Lampa, store, orchestrator) {
      var started = false;
      var unsubscribe = null;
      var currentEvent = null;
      var pending = false;
      function showFailure() {
        if (Lampa.Noty && typeof Lampa.Noty.show === 'function') {
          Lampa.Noty.show(translation(Lampa, 'watch_resume_failed', 'Could not restore playback'));
        }
      }
      function onFull(event) {
        if (!event || event.type !== 'complite') return;
        currentEvent = event;
        var card = event.data && event.data.movie;
        var root = rootFor(event);
        if (!root) return;
        root.find('.view--watch-resume').remove();
        if (!isSeries(card)) return;
        var record = latestRecord(store.find(card));
        if (!record) return;
        var button = $(renderButton(Lampa, labelFor(record)));
        button.on('hover:enter', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
          var loading, stopLoading;
          return _regenerator().w(function (_context) {
            while (1) switch (_context.p = _context.n) {
              case 0:
                if (!pending) {
                  _context.n = 1;
                  break;
                }
                return _context.a(2);
              case 1:
                pending = true;
                loading = true;
                stopLoading = function stopLoading() {
                  if (!loading) return;
                  loading = false;
                  if (Lampa.Loading && typeof Lampa.Loading.stop === 'function') Lampa.Loading.stop();
                };
                if (Lampa.Loading && typeof Lampa.Loading.start === 'function') Lampa.Loading.start();
                _context.p = 2;
                _context.n = 3;
                return orchestrator.resume(card, function (mode) {
                  stopLoading();
                  return openSameMode(event, mode);
                }, stopLoading);
              case 3:
                _context.n = 5;
                break;
              case 4:
                _context.p = 4;
                stopLoading();
                showFailure();
              case 5:
                _context.p = 5;
                stopLoading();
                pending = false;
                return _context.f(5);
              case 6:
                return _context.a(2);
            }
          }, _callee, null, [[2, 4, 5, 6]]);
        })));
        var online = root.find('.view--online').last();
        var torrent = root.find('.view--torrent').last();
        var container = root.find('.full-start-new__buttons, .full-start__buttons').last();
        if (online.length) online.after(button);else if (torrent.length) torrent.after(button);else if (container.length) container.append(button);
      }
      return {
        start: function start() {
          if (started) return this;
          started = true;
          Lampa.Listener.follow('full', onFull);
          if (store && typeof store.subscribe === 'function') {
            unsubscribe = store.subscribe(function () {
              if (currentEvent) onFull(currentEvent);
            });
          }
          return this;
        },
        stop: function stop() {
          if (!started) return this;
          started = false;
          Lampa.Listener.remove('full', onFull);
          if (typeof unsubscribe === 'function') unsubscribe();
          unsubscribe = null;
          currentEvent = null;
          return this;
        }
      };
    }

    function createOnlineAdapter(Lampa) {
      var globalObject = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;
      return {
        resolve: function resolve(card, record) {
          return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
            var bridge, result;
            return _regenerator().w(function (_context) {
              while (1) switch (_context.n) {
                case 0:
                  bridge = globalObject.LampacOnlineResume;
                  if (!(!bridge || typeof bridge.resolve !== 'function')) {
                    _context.n = 1;
                    break;
                  }
                  throw new Error('resume-online-bridge');
                case 1:
                  _context.n = 2;
                  return bridge.resolve({
                    card: card,
                    recipe: record,
                    progress: record.progress
                  });
                case 2:
                  result = _context.v;
                  if (!(!result || !Array.isArray(result.playlist) || !result.playlist.length || result.playlist.some(function (item) {
                    return !item || typeof item.url !== 'string' || !item.url;
                  }) || result.playlist.indexOf(result.item) < 0)) {
                    _context.n = 3;
                    break;
                  }
                  throw new Error('resume-online-playlist');
                case 3:
                  return _context.a(2, result);
              }
            }, _callee);
          }))();
        }
      };
    }

    var VIDEO_EXTENSIONS = ['asf', 'wmv', 'divx', 'avi', 'mp4', 'm4v', 'mov', '3gp', '3g2', 'mkv', 'trp', 'tp', 'mts', 'mpg', 'mpeg', 'dat', 'vob', 'rm', 'rmvb', 'm2ts', 'ts'];
    var SUBTITLE_EXTENSIONS = ['srt', 'vtt', 'ass', 'ssa'];
    var extension = function extension(path) {
      return String(path || '').split('.').pop().toLowerCase();
    };
    var normalizePath = function normalizePath(path) {
      return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '').toLowerCase();
    };
    var naturalPath = function naturalPath(path) {
      return normalizePath(path).replace(/\d+/g, function (value) {
        return value.length > 3 ? value : ('000' + value).slice(-4);
      });
    };
    var callbackPromise = function callbackPromise(executor) {
      return new Promise(function (resolve, reject) {
        return executor(resolve, reject);
      });
    };
    var text = function text(value) {
      return typeof value === 'string' ? value.trim() : '';
    };
    var magnet = function magnet(value) {
      return text(value).indexOf('magnet:') === 0 ? text(value) : '';
    };
    function createViewedApi(Lampa) {
      var network;
      var request = function request(payload, success, fail) {
        try {
          if (typeof Lampa.Reguest !== 'function' || typeof Lampa.Torserver.url !== 'function') {
            throw new Error('resume-torrent-viewed-api');
          }
          if (!network) network = new Lampa.Reguest();
          network.timeout(5000);
          network.silent(Lampa.Torserver.url() + '/viewed', success, fail, JSON.stringify(payload));
        } catch (error) {
          if (fail) fail(error);
        }
      };
      return {
        list: function list(hash, success, fail) {
          if (typeof Lampa.Torserver.viewed === 'function') {
            return Lampa.Torserver.viewed(hash, success, fail);
          }
          request({
            action: 'list',
            hash: hash
          }, success, fail);
        },
        set: function set(hash, fileIndex, timecode, success, fail) {
          if (typeof Lampa.Torserver.viewedSet === 'function') {
            return Lampa.Torserver.viewedSet(hash, fileIndex, timecode);
          }
          request({
            action: 'set',
            hash: hash,
            file_index: fileIndex,
            timecode: timecode
          }, success, fail);
        }
      };
    }
    function loadFiles(Lampa, recipe) {
      return callbackPromise(function (resolve, reject) {
        var complete = function complete(hash) {
          return function (response) {
            return resolve({
              response: response,
              hash: response.hash || hash
            });
          };
        };
        Lampa.Torserver.files(recipe.infohash, complete(recipe.infohash), function (error) {
          if (!recipe.magnet) return reject(error);
          Lampa.Torserver.hash({
            title: recipe.torrent_title,
            link: recipe.magnet,
            poster: '',
            data: {
              lampa: true
            }
          }, function (added) {
            return Lampa.Torserver.files(added.hash, complete(added.hash), reject);
          }, reject);
        });
      });
    }
    function buildTorrentSubtitles(Lampa, hash, file, allFiles) {
      var name = String(file.path || '').split(/[/\\]/).pop().split('.').slice(0, -1).join('.');
      var index = -1;
      var subtitles = allFiles.filter(function (candidate) {
        var _short = String(candidate.path || '').split(/[/\\]/).pop();
        return _short.indexOf(name) >= 0 && SUBTITLE_EXTENSIONS.indexOf(extension(candidate.path)) >= 0;
      }).map(function (candidate) {
        index++;
        var segments = String(candidate.path || '').split(/[/\\]/);
        segments.pop();
        return {
          label: segments.slice(1).join(' - '),
          url: Lampa.Torserver.stream(candidate.path, hash, candidate.id).replace('&preload', '&play'),
          index: index
        };
      });
      return subtitles.length ? subtitles : false;
    }
    function resumeMetadata(hash, file, recipe) {
      return {
        mode: 'torrent',
        torrent: {
          infohash: hash,
          magnet: magnet(recipe.magnet),
          file_index: Number(file.id),
          file_path: String(file.path || ''),
          torrent_title: text(recipe.torrent_title)
        }
      };
    }
    function buildTorrentItem(Lampa, card, hash, file, allFiles, viewedEntries, recipe, viewedApi) {
      var parsed = Lampa.Torserver.parse({
        movie: card,
        files: allFiles,
        filename: file.path_human,
        path: file.path
      });
      var timeline = Lampa.Timeline.view(parsed.hash);
      var serverRoad = viewedEntries.find(function (item) {
        return Number(item.file_index) === Number(file.id);
      });
      if (!timeline.time && serverRoad && serverRoad.timecode > 0) {
        timeline.time = serverRoad.timecode;
        timeline.percent = timeline.duration ? Math.min(100, timeline.time / timeline.duration * 100) : 0;
      }
      return _objectSpread2(_objectSpread2({}, file), {}, {
        card: card,
        season: parsed.season,
        episode: parsed.episode,
        torrent_hash: hash,
        url: Lampa.Torserver.stream(file.path, hash, file.id),
        timeline: timeline,
        subtitles: buildTorrentSubtitles(Lampa, hash, file, allFiles),
        viewed: function viewed(seconds) {
          if (Lampa.Storage.field('torrserver_tracktimecode') === true) {
            viewedApi.set(hash, file.id, seconds);
          }
        },
        lampac_resume: resumeMetadata(hash, file, recipe)
      });
    }
    function createTorrentAdapter(Lampa) {
      var viewedApi = createViewedApi(Lampa);
      return {
        resolve: function resolve(card, record) {
          return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
            var recipe, loaded, response, hash, allFiles, viewed, videos, playlist, item, _t;
            return _regenerator().w(function (_context) {
              while (1) switch (_context.n) {
                case 0:
                  recipe = record.torrent;
                  _context.n = 1;
                  return loadFiles(Lampa, recipe);
                case 1:
                  loaded = _context.v;
                  response = loaded.response;
                  hash = loaded.hash;
                  allFiles = (response.file_stats || response.files || []).slice().sort(function (left, right) {
                    return naturalPath(left.path).localeCompare(naturalPath(right.path));
                  });
                  if (!(Lampa.Storage.field('torrserver_tracktimecode') === true)) {
                    _context.n = 3;
                    break;
                  }
                  _context.n = 2;
                  return callbackPromise(function (resolve) {
                    return viewedApi.list(hash, resolve, function () {
                      return resolve([]);
                    });
                  });
                case 2:
                  _t = _context.v;
                  _context.n = 4;
                  break;
                case 3:
                  _t = [];
                case 4:
                  viewed = _t;
                  videos = Lampa.Torserver.clearFileName(allFiles.filter(function (file) {
                    return VIDEO_EXTENSIONS.indexOf(extension(file.path)) >= 0;
                  }));
                  playlist = videos.map(function (file) {
                    return buildTorrentItem(Lampa, card, hash, file, allFiles, viewed || [], recipe, viewedApi);
                  }).sort(function (left, right) {
                    return Number(left.season) - Number(right.season) || Number(left.episode) - Number(right.episode) || naturalPath(left.path).localeCompare(naturalPath(right.path));
                  });
                  item = playlist.find(function (file) {
                    return Number(file.id) === Number(recipe.file_index);
                  });
                  if (!item) item = playlist.find(function (file) {
                    return normalizePath(file.path) === normalizePath(recipe.file_path);
                  });
                  if (!item) item = playlist.find(function (file) {
                    return Number(file.season) === Number(record.episode.season) && Number(file.episode) === Number(record.episode.episode);
                  });
                  if (!(!item || !playlist.length)) {
                    _context.n = 5;
                    break;
                  }
                  throw new Error('resume-torrent-file');
                case 5:
                  return _context.a(2, {
                    item: item,
                    playlist: playlist
                  });
              }
            }, _callee);
          }))();
        }
      };
    }
    function createTorrentTimecodeWriter(Lampa) {
      var writtenAt = new Map();
      var viewedApi = createViewedApi(Lampa);
      return {
        write: function write(hash, fileIndex, seconds) {
          var force = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
          if (Lampa.Storage.field('torrserver_tracktimecode') !== true) return;
          var key = hash + ':' + fileIndex;
          var now = Date.now();
          if (!force && now - (writtenAt.get(key) || 0) < TORRSERVER_WRITE_INTERVAL_MS) return;
          writtenAt.set(key, now);
          viewedApi.set(hash, fileIndex, Math.round(seconds));
        }
      };
    }

    function createWatchResumeRuntime(Lampa) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var store = createRecipeStore(Lampa);
      var torrentTimecodes = createTorrentTimecodeWriter(Lampa);
      var capture = createCapture(Lampa, store, {
        writeTorrentTimecode: torrentTimecodes.write
      });
      var launcher = createPlayerLauncher(Lampa);
      var adapterGlobal = options.onlineBridge ? {
        LampacOnlineResume: options.onlineBridge
      } : options.globalObject || (typeof window !== 'undefined' ? window : {});
      var orchestrator = createResumeOrchestrator({
        store: store,
        online: createOnlineAdapter(Lampa, adapterGlobal),
        torrent: createTorrentAdapter(Lampa),
        launcher: launcher
      });
      var button = createResumeButton(Lampa, store, orchestrator);
      var canCapture = Lampa.Player && Lampa.Player.listener && Lampa.PlayerPlaylist && Lampa.PlayerPlaylist.listener && Lampa.Timeline && Lampa.Timeline.listener;
      var started = false;
      function onSyncImport(event) {
        if (event && event.name === 'storage_importСompleted' && event.value === 'sync_view') {
          store.mergeSynced();
        }
      }
      return {
        start: function start() {
          if (started) return this;
          started = true;
          registerLanguage(Lampa);
          if (canCapture) capture.start();
          button.start();
          Lampa.Listener.follow('lampac', onSyncImport);
          return this;
        },
        stop: function stop() {
          if (!started) return this;
          started = false;
          if (canCapture) capture.stop();
          button.stop();
          Lampa.Listener.remove('lampac', onSyncImport);
          return this;
        }
      };
    }
    var productionRuntime = null;
    function startWatchResumePlugin() {
      if (productionRuntime) return;
      productionRuntime = createWatchResumeRuntime(Lampa, {
        globalObject: window
      });
      productionRuntime.start();
    }
    if (typeof window !== 'undefined') {
      if (!window.plugin_watch_resume_ready) {
        window.plugin_watch_resume_ready = true;
        if (window.appready) startWatchResumePlugin();else Lampa.Listener.follow('app', function (event) {
          if (event.type === 'ready') startWatchResumePlugin();
        });
      }
    }

    exports.createOnlineAdapter = createOnlineAdapter;
    exports.createPlayerLauncher = createPlayerLauncher;
    exports.createResumeButton = createResumeButton;
    exports.createResumeOrchestrator = createResumeOrchestrator;
    exports.createTorrentAdapter = createTorrentAdapter;
    exports.createTorrentTimecodeWriter = createTorrentTimecodeWriter;
    exports.createWatchResumeRuntime = createWatchResumeRuntime;
    exports.normalizePlaylist = normalizePlaylist;
    exports.openSameMode = openSameMode;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
