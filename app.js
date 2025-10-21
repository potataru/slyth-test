const DEFAULT_SCREEN_ID = 's0';
const TRANSITION_MS = 240;
let isTransitioning = false;
let currentScreen = null;

/* Утиль ой то есть утилиты */
function hideScreen(el) {
  if (!el) return;
  el.classList.remove('active', 'out');
  el.style.display = 'none';
}
function revealScreen(el) {
  el.style.display = 'block';
  requestAnimationFrame(() => el.classList.add('active'));
}
function hideOthers(except) {
  document.querySelectorAll('.screen.active').forEach(s => {
    if (s !== except) {
      s.classList.remove('active', 'out');
      s.style.display = 'none';
    }
  });
}

/* Переключалка */
function show(targetId) {
  const next = document.getElementById(targetId);
  if (!next) return;
  if (isTransitioning || currentScreen === next) return;

  hideOthers(next);
  isTransitioning = true;

  if (currentScreen) {
    currentScreen.classList.add('out');
    const onEnd = e => {
      if (e && e.target !== currentScreen) return;
      currentScreen.removeEventListener('transitionend', onEnd);
      hideScreen(currentScreen);
      revealNext();
    };
    currentScreen.addEventListener('transitionend', onEnd);
    setTimeout(() => onEnd(), TRANSITION_MS + 30);
  } else {
    revealNext();
  }

  function revealNext() {
    revealScreen(next);
    currentScreen = next;
    if (next.id === 's0') emptyClicks.clear();
    window.scrollTo({ top: 0, behavior: 'instant' });
    setTimeout(() => { isTransitioning = false; }, TRANSITION_MS);
   }
}

/* Обр */
function handleClicks(e) {
  const el = e.target.closest('[data-go]');
  if (!el) return;
  if (el.tagName === 'A' && el.hasAttribute('href')) return;
  e.preventDefault();
  const id = el.getAttribute('data-go');
  if (id) show(id);
}
function enableKeyboardAccess() {
  document.querySelectorAll('[data-go]').forEach(el => {
    if (!/^(A|BUTTON)$/i.test(el.tagName)) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest('[data-go]');
    if (!el) return;
    e.preventDefault();
    const id = el.getAttribute('data-go');
    if (id) show(id);
  });
}

/* Иниц */
function init() {
  document.querySelectorAll('.screen').forEach(s => {
    if (!s.classList.contains('active')) s.style.display = 'none';
    else currentScreen = s;
  });

  const initialId = location.hash.slice(1) || DEFAULT_SCREEN_ID;
  if (!currentScreen || currentScreen.id !== initialId) {
    currentScreen = null;
    show(initialId);
  } else if (location.hash !== '#' + currentScreen.id) {
    history.replaceState(null, '', '#' + currentScreen.id);
  }

  document.addEventListener('click', handleClicks);
  enableKeyboardAccess();
}

window.addEventListener('load', init);
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (id) show(id);
});

// Ошибка выжившего

const emptyClicks = new Map();

function openEmptyPopup(locked, opts = {}) {
  const pop = document.getElementById('popup-empty');
  if (!pop) return;
  const textEl = pop.querySelector('.popup-text');
  const btnsEl = pop.querySelector('.btns');

  const normalText = opts.text || '🙈 Здесь тыквы нет. Ваше чутьё вас подвело.';
  const lockedText = opts.lockedText || '😵 Вы обыскались до изнеможения. Отдыхайте.';
  const lockedGo   = opts.lockedGo || 's0';

  if (locked) {
    textEl.innerHTML = lockedText;
    btnsEl.innerHTML = `<a class="btn" data-go="${lockedGo}">На главный экран</a>`;
    pop.dataset.locked = '1';
  } else {
    textEl.innerHTML = normalText;
    btnsEl.innerHTML = `<button class="btn" data-close="popup-empty">Понятно</button>`;
    delete pop.dataset.locked;
  }
  pop.classList.add('active');
}

// «Искать здесь» (фейк) 
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="empty-search"]');
  if (!btn) return;
  e.preventDefault();

  const sid = (window.currentScreen && window.currentScreen.id) || 'unknown';
  const n = (emptyClicks.get(sid) || 0) + 1;
  emptyClicks.set(sid, n);

  openEmptyPopup(n >= 4, {
    text:       btn.getAttribute('data-empty-text'),
    lockedText: btn.getAttribute('data-locked-text'),
    lockedGo:   btn.getAttribute('data-locked-go')
  });
});

// закрыть попап
document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('[data-close]');
  if (!closeBtn) return;
  const id = closeBtn.getAttribute('data-close');
  const pop = document.getElementById(id);
  if (!pop) return;
  if (pop.dataset.locked === '1') return;
  pop.classList.remove('active');
});

// клик по фону
document.addEventListener('click', (e) => {
  if (!e.target.classList || !e.target.classList.contains('popup')) return;
  if (e.target.dataset.locked === '1') return;
  e.target.classList.remove('active');
});

// закрывать попап, если внутри него нажали data-go
document.addEventListener('click', (e) => {
  const link = e.target.closest('.popup [data-go]');
  if (!link) return;
  const pop = link.closest('.popup');
  if (pop) {
    pop.classList.remove('active');
    delete pop.dataset.locked;
  }
});



// кнопка рандомной тыквы

document.addEventListener('click', (e) => {
  if (!e.target.matches('[data-action="search-pumpkin"]')) return;

  const roll = Math.floor(Math.random() * 15) + 1;
  const popup = document.getElementById('popup');
  const popupText = popup.querySelector('.popup-text');

  popupText.textContent = `Поздравляем! Вы нашли тыкву №${roll}! Сделайте скриншот и покажите Всаднику Тыквовина`;
  popup.classList.add('active');
});

// Закрытие окна
document.querySelector('.popup-close').addEventListener('click', () => {
  document.getElementById('popup').classList.remove('active');
});

// текст 

function setRealVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('load', setRealVh);
window.addEventListener('resize', setRealVh);





