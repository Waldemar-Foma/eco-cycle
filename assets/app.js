(function(){
  "use strict";

  /* ---------- scroll progress bar ---------- */
  var scrollbar = document.getElementById('scrollbar');
  function updateScrollbar(){
    if (!scrollbar) return;
    var h = document.documentElement;
    var pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    scrollbar.style.width = (pct || 0) + '%';
  }
  window.addEventListener('scroll', updateScrollbar, {passive:true});
  updateScrollbar();

  /* ---------- toast ---------- */
  var toast = document.getElementById('toast');
  var toastText = document.getElementById('toastText');
  var toastTimer = null;
  function showToast(msg){
    if (!toast || !toastText) return;
    toastText.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2800);
  }

  /* ---------- i18n ---------- */
  var I18N = {
    supported: ['ru','kk','uz','ky','tg','hy'],
    default: 'ru',
    current: 'ru',
    dict: {},
    storageKey: 'ecocycle.lang'
  };

  function getByPath(obj, path){
    return path.split('.').reduce(function(acc, key){
      return (acc && acc[key] !== undefined) ? acc[key] : undefined;
    }, obj);
  }

  function applyTranslations(){
    document.querySelectorAll('[data-i18n]').forEach(function(el){
      var key = el.getAttribute('data-i18n');
      var val = getByPath(I18N.dict, key);
      if (val === undefined) return;
      var attr = el.getAttribute('data-i18n-attr');
      if (attr){
        el.setAttribute(attr, val);
      } else if (el.hasAttribute('data-i18n-html')){
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
      var key = el.getAttribute('data-i18n-placeholder');
      var val = getByPath(I18N.dict, key);
      if (val !== undefined) el.setAttribute('placeholder', val);
    });
    document.documentElement.lang = I18N.current;

    document.querySelectorAll('.lang-menu button, .foot-langs button, .mobile-langs button').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-lang') === I18N.current);
    });
  }

  function loadLang(code, cb){
    if (I18N.dict && I18N.current === code && Object.keys(I18N.dict).length){
      if (cb) cb();
      return;
    }
    fetch('assets/i18n/' + code + '.json', {cache:'no-store'})
      .then(function(r){ return r.ok ? r.json() : Promise.reject(); })
      .then(function(json){
        I18N.dict = json;
        I18N.current = code;
        try { localStorage.setItem(I18N.storageKey, code); } catch(e){}
        applyTranslations();
        document.dispatchEvent(new CustomEvent('i18n:changed', {detail:{lang:code}}));
        if (cb) cb();
      })
      .catch(function(){
        if (code !== I18N.default) loadLang(I18N.default, cb);
        else if (cb) cb();
      });
  }

  function detectLang(){
    try {
      var saved = localStorage.getItem(I18N.storageKey);
      if (saved && I18N.supported.indexOf(saved) !== -1) return saved;
    } catch(e){}
    var nav = (navigator.language || 'ru').toLowerCase().slice(0,2);
    return I18N.supported.indexOf(nav) !== -1 ? nav : I18N.default;
  }

  /* language menus (header dropdown) */
  document.querySelectorAll('.lang').forEach(function(wrap){
    var btn = wrap.querySelector('.lang-btn');
    var menu = wrap.querySelector('.lang-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    });
    document.addEventListener('click', function(){
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    });
    menu.querySelectorAll('button[data-lang]').forEach(function(b){
      b.addEventListener('click', function(){
        loadLang(b.getAttribute('data-lang'));
      });
    });
  });

  /* language switches in footer / mobile panel */
  document.querySelectorAll('[data-lang]').forEach(function(b){
    if (b.closest('.lang-menu')) return;
    b.addEventListener('click', function(){
      loadLang(b.getAttribute('data-lang'));
    });
  });

  loadLang(detectLang());

  /* ---------- coming soon for disabled buttons ---------- */
  document.addEventListener('click', function(e){
    var el = e.target.closest('[data-soon], .btn-disabled, button[aria-disabled="true"]');
    if (!el) return;
    if (el.tagName === 'A' && el.getAttribute('href') && !el.classList.contains('btn-disabled') && !el.hasAttribute('data-soon')) return;
    e.preventDefault();
    var msg = getByPath(I18N.dict, 'common.soon') || 'Функционал появится позже';
    showToast(msg);
  });

  /* ---------- active nav by page ---------- */
  var page = document.body.getAttribute('data-page');
  if (page){
    document.querySelectorAll('[data-page]').forEach(function(link){
      if (link.getAttribute('data-page') === page) link.classList.add('active');
    });
  }

  /* ---------- mobile nav ---------- */
  var burger = document.getElementById('burger');
  var panel = document.getElementById('mobilePanel');

  function closeMenu(){
    if (!burger || !panel) return;
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
    panel.classList.remove('open');
    document.body.style.overflow='';
  }
  function openMenu(){
    if (!burger || !panel) return;
    burger.classList.add('open');
    burger.setAttribute('aria-expanded','true');
    panel.classList.add('open');
    document.body.style.overflow='hidden';
  }

  if (burger && panel){
    burger.addEventListener('click', function(e){
      e.stopPropagation();
      panel.classList.contains('open') ? closeMenu() : openMenu();
    });

    panel.querySelectorAll('a[data-close]').forEach(function(el){
      el.addEventListener('click', function(){ closeMenu(); });
    });

    document.addEventListener('click', function(e){
      if (!panel.classList.contains('open')) return;
      if (panel.contains(e.target) || burger.contains(e.target)) return;
      closeMenu();
    });

    window.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- smooth scroll for anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth'});
        closeMenu();
      }
    });
  });

  /* ---------- reveal ---------- */
  var revealIo = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ e.target.classList.add('in'); revealIo.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function(el){ revealIo.observe(el); });

  /* ---------- legacy data-toast buttons ---------- */
  document.querySelectorAll('[data-toast]').forEach(function(btn){
    btn.addEventListener('click', function(){ showToast(btn.getAttribute('data-toast')); });
  });

  /* ---------- living path demo ---------- */
  var chainChips = document.getElementById('chainChips');
  if (chainChips){
    var chains = {
      pen: {
        result: 'Вторая жизнь: наполнитель для подушек',
        steps: [
          ['Сбор', 'контейнер во дворе'],
          ['Сортировка', 'линия МСК «Круглово»'],
          ['Оператор «Эко-Партнёр»', 'Калининградская область'],
          ['Переработка в гранулы', '0,9 кг вторичного сырья'],
          ['Наполнитель для подушек', 'вторая жизнь предмета'],
        ]
      },
      bottle: {
        result: 'Вторая жизнь: новая стеклотара',
        steps: [
          ['Сбор', 'контейнер для стекла'],
          ['Сортировка', 'по цвету и типу стекла'],
          ['Оператор «СтеклоРесурс»', 'Калининградская область'],
          ['Переплавка в шихту', 'дробление и очистка'],
          ['Новая бутылка', 'вторая жизнь предмета'],
        ]
      },
      paper: {
        result: 'Вторая жизнь: упаковочный картон',
        steps: [
          ['Сбор', 'контейнер для бумаги'],
          ['Сортировка', 'по плотности волокна'],
          ['Оператор «БумПром»', 'целлюлозно-бумажный комбинат'],
          ['Роспуск в массу', 'удаление печати и клея'],
          ['Упаковочный картон', 'вторая жизнь предмета'],
        ]
      },
      phone: {
        result: 'Вторая жизнь: редкоземельные металлы',
        steps: [
          ['Сбор', 'пункт приёма электроники'],
          ['Разбор', 'демонтаж платы и корпуса'],
          ['Оператор «ЭкоМеталл»', 'извлечение металлов'],
          ['Аффинаж', 'золото, медь, кобальт'],
          ['Новые платы', 'вторая жизнь предмета'],
        ]
      }
    };
    var railSteps = document.getElementById('railSteps');
    var railFill = document.getElementById('railFill');
    var resultText = document.getElementById('resultText');
    var currentChain = 'pen';
    var railTimer = null;

    function renderRail(key, animate){
      var data = chains[key];
      railSteps.innerHTML = '';
      data.steps.forEach(function(st){
        var el = document.createElement('div');
        el.className = 's pending';
        el.innerHTML = '<div class="d"></div><b>' + st[0] + '</b><span>' + st[1] + '</span>';
        railSteps.appendChild(el);
      });
      resultText.textContent = data.result;
      var items = railSteps.querySelectorAll('.s');
      clearTimeout(railTimer);
      if (!animate){
        items.forEach(function(it, i){
          it.classList.remove('pending');
          it.classList.add(i === items.length-1 ? 'current' : 'done');
        });
        railFill.style.width = '100%';
        return;
      }
      railFill.style.width = '0%';
      var i = 0;
      function step(){
        items.forEach(function(it, idx){
          it.classList.remove('done','current','pending');
          if (idx < i) it.classList.add('done');
          else if (idx === i) it.classList.add('current');
          else it.classList.add('pending');
        });
        railFill.style.width = (i / (items.length - 1) * 100) + '%';
        if (i < items.length - 1){ i++; railTimer = setTimeout(step, 550); }
      }
      step();
    }

    chainChips.addEventListener('click', function(e){
      var btn = e.target.closest('[data-chain]');
      if (!btn) return;
      chainChips.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
      btn.classList.add('active');
      currentChain = btn.getAttribute('data-chain');
      renderRail(currentChain, true);
    });
    var replayBtn = document.getElementById('replayBtn');
    if (replayBtn) replayBtn.addEventListener('click', function(){ renderRail(currentChain, true); });
    renderRail(currentChain, true);

    var viewfinder = document.getElementById('viewfinder');
    var vfHint = document.getElementById('vfHint');
    var scanResult = document.getElementById('scanResult');
    var scanMaterial = document.getElementById('scanMaterial');
    var fileInput = document.getElementById('fileInput');
    var materials = {
      pen: 'Полипропилен · PP 05',
      bottle: 'Тарное стекло · прозрачное',
      paper: 'Гофрокартон · марка Т22',
      phone: 'Электронный лом · плата + корпус'
    };

    function runScan(imgUrl){
      scanResult.classList.remove('show');
      if (vfHint) vfHint.style.display = 'none';
      var existingImg = viewfinder.querySelector('img');
      if (imgUrl){
        if (!existingImg){ existingImg = document.createElement('img'); viewfinder.appendChild(existingImg); }
        existingImg.src = imgUrl;
      }
      viewfinder.classList.add('scanning');
      setTimeout(function(){
        viewfinder.classList.remove('scanning');
        scanMaterial.textContent = materials[currentChain] || materials.pen;
        scanResult.classList.add('show');
      }, 1500);
    }

    var scanDemoBtn = document.getElementById('scanDemoBtn');
    if (scanDemoBtn) scanDemoBtn.addEventListener('click', function(){ runScan(null); });
    if (fileInput){
      fileInput.addEventListener('change', function(e){
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var url = URL.createObjectURL(file);
        runScan(url);
      });
    }
  }

  /* ---------- marketplace ---------- */
  var marketGrid = document.getElementById('marketGrid');
  if (marketGrid){
    var marketItems = [
      { title:'Диван угловой, 3 места', cat:'Мебель', meta:'Московский район · сегодня до 21:00', kg:45, co2:12 },
      { title:'Стиральная машина Bosch', cat:'Техника', meta:'Центральный район · самовывоз', kg:38, co2:19 },
      { title:'Остатки ламината, 12 м²', cat:'Стройматериалы', meta:'Октябрьский район · есть упаковка', kg:60, co2:9 },
      { title:'Детская коляска-трансформер', cat:'Другое', meta:'Балтийский район · в хорошем состоянии', kg:9, co2:3 },
      { title:'Книжный шкаф из ИКЕА', cat:'Мебель', meta:'Центральный район · разборный', kg:22, co2:6 },
      { title:'Старый системный блок', cat:'Техника', meta:'Московский район · без диска', kg:11, co2:14 },
    ];
    var iconByCat = {
      'Мебель': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18v-6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6"/><path d="M4 18h16v2H4z"/><path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/></svg>',
      'Техника': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/></svg>',
      'Стройматериалы': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="18" height="4" rx="1"/><rect x="3" y="15" width="18" height="4" rx="1"/><rect x="6" y="3" width="6" height="4" rx="1"/></svg>',
      'Другое': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4l3 2"/></svg>'
    };

    function renderMarket(){
      marketGrid.innerHTML = '';
      marketItems.forEach(function(item, idx){
        var card = document.createElement('div');
        card.className = 'market-card';
        card.setAttribute('data-cat', item.cat);
        card.innerHTML =
          '<div class="market-photo"><span class="market-co2">CO₂ −' + item.co2 + ' кг</span>' + (iconByCat[item.cat] || iconByCat['Другое']) + '</div>' +
          '<div class="market-body">' +
            '<span class="cat">' + item.cat + '</span>' +
            '<h4>' + item.title + '</h4>' +
            '<span class="meta">' + item.meta + '</span>' +
            '<button class="btn btn-outline btn-sm" data-take="' + idx + '">' + (getByPath(I18N.dict,'common.take') || 'Забрать') + '</button>' +
          '</div>';
        marketGrid.appendChild(card);
      });
    }
    renderMarket();
    document.addEventListener('i18n:changed', renderMarket);

    var marketFilters = document.getElementById('marketFilters');
    if (marketFilters){
      marketFilters.addEventListener('click', function(e){
        var chip = e.target.closest('[data-cat]');
        if (!chip) return;
        marketFilters.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        var cat = chip.getAttribute('data-cat');
        marketGrid.querySelectorAll('.market-card').forEach(function(card){
          card.classList.toggle('hidden', cat !== 'all' && card.getAttribute('data-cat') !== cat);
        });
      });
    }

    var cntItems = document.getElementById('cnt-items');
    var cntKg = document.getElementById('cnt-kg');
    var cntCo2 = document.getElementById('cnt-co2');
    var totals = { items:0, kg:0, co2:0 };
    marketGrid.addEventListener('click', function(e){
      var btn = e.target.closest('[data-take]');
      if (!btn || btn.disabled) return;
      var idx = Number(btn.getAttribute('data-take'));
      var item = marketItems[idx];
      var card = btn.closest('.market-card');
      card.classList.add('taken');
      btn.textContent = getByPath(I18N.dict,'sharing.taken') || 'Забрали';
      btn.disabled = true;
      totals.items += 1; totals.kg += item.kg; totals.co2 += item.co2;
      if (cntItems) cntItems.textContent = totals.items;
      if (cntKg) cntKg.textContent = totals.kg + ' кг';
      if (cntCo2) cntCo2.textContent = totals.co2 + ' кг';
      showToast(getByPath(I18N.dict,'sharing.toastTaken') || 'Заявка отправлена.');
    });
  }

  /* ---------- community events ---------- */
  var eventList = document.getElementById('eventList');
  if (eventList){
    var events = {
      9: [
        { d:'20', wd:'СБ', title:'Субботник в парке Юность', place:'Парк Юность · 11:00' },
        { d:'27', wd:'СБ', title:'Своп-вечеринка одежды', place:'Арт-пространство «Ворота» · 16:00' },
      ],
      10: [
        { d:'04', wd:'СБ', title:'Фестиваль вторсырья «ЭкоОсень»', place:'Центральная площадь · 12:00' },
        { d:'18', wd:'СБ', title:'Клуб апсайклинга: мебель из паллет', place:'Мастерская «Дерево» · 14:00' },
        { d:'25', wd:'СБ', title:'Акция сбора батареек и техники', place:'ТЦ «Европа» · весь день' },
      ],
      11: [
        { d:'08', wd:'СБ', title:'Эко-квест для школьников', place:'Ботанический сад · 10:00' },
        { d:'22', wd:'СБ', title:'Своп-вечеринка книг и игрушек', place:'Библиотека им. Чехова · 13:00' },
      ]
    };

    function renderEvents(month){
      eventList.innerHTML = '';
      (events[month] || []).forEach(function(ev){
        var row = document.createElement('div');
        row.className = 'event-row';
        row.innerHTML =
          '<div class="event-date"><b>' + ev.d + '</b><span>' + ev.wd + '</span></div>' +
          '<div class="event-info"><h4>' + ev.title + '</h4><p>' + ev.place + '</p></div>' +
          '<button class="btn btn-outline btn-sm" data-join="' + ev.title.replace(/"/g,'') + '">' + (getByPath(I18N.dict,'community.join') || 'Записаться') + '</button>';
        eventList.appendChild(row);
      });
    }

    var monthTabs = document.getElementById('monthTabs');
    if (monthTabs){
      monthTabs.addEventListener('click', function(e){
        var chip = e.target.closest('[data-month]');
        if (!chip) return;
        monthTabs.querySelectorAll('.chip').forEach(function(c){ c.classList.remove('active'); });
        chip.classList.add('active');
        renderEvents(chip.getAttribute('data-month'));
      });
    }
    eventList.addEventListener('click', function(e){
      var btn = e.target.closest('[data-join]');
      if (!btn) return;
      showToast(getByPath(I18N.dict,'community.toastJoined') || 'Вы записаны!');
      btn.textContent = getByPath(I18N.dict,'community.joined') || 'Вы записаны';
      btn.disabled = true;
    });
    renderEvents('9');
    document.addEventListener('i18n:changed', function(){ renderEvents('9'); });
  }

  /* ---------- waitlist form ---------- */
  var wlForm = document.getElementById('wlForm');
  if (wlForm){
    var wlMsg = document.getElementById('wlMsg');
    wlForm.addEventListener('submit', function(e){
      e.preventDefault();
      var email = document.getElementById('wlEmail').value.trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!ok){
        wlMsg.textContent = getByPath(I18N.dict,'waitlist.err') || 'Проверьте формат почты';
        wlMsg.className = 'wl-msg err';
        return;
      }
      wlMsg.textContent = getByPath(I18N.dict,'waitlist.ok') || 'Готово!';
      wlMsg.className = 'wl-msg ok';
      wlForm.reset();
    });
  }

})();