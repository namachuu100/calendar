let events = JSON.parse(localStorage.getItem('my_calendar_events')) || {};
let selectedDateKey = null;

let topYear, topMonth;
let bottomYear, bottomMonth;

const container = document.getElementById('scroll-container');

// --- 祝日判定ロジック ---
function getHolidayName(year, month, date, dayOfWeek) {
  const getShunbun = (y) => Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  const getShubun = (y) => Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  const nthWeek = Math.floor((date - 1) / 7) + 1;

  if (month === 1 && date === 1) return "元日";
  if (month === 1 && nthWeek === 2 && dayOfWeek === 1) return "成人の日";
  if (month === 2 && date === 11) return "建国記念の日";
  if (month === 2 && date === 23) return "天皇誕生日";
  if (month === 3 && date === getShunbun(year)) return "春分の日";
  if (month === 4 && date === 29) return "昭和の日";
  if (month === 5 && date === 3) return "憲法記念日";
  if (month === 5 && date === 4) return "みどりの日";
  if (month === 5 && date === 5) return "こどもの日";
  if (month === 7 && nthWeek === 3 && dayOfWeek === 1) return "海の日";
  if (month === 8 && date === 11) return "山の日";
  if (month === 9 && nthWeek === 3 && dayOfWeek === 1) return "敬老の日";
  if (month === 9 && date === getShubun(year)) return "秋分の日";
  if (month === 10 && nthWeek === 2 && dayOfWeek === 1) return "スポーツの日";
  if (month === 11 && date === 3) return "文化の日";
  if (month === 11 && date === 23) return "勤労感謝の日";

  return null;
}

function getHoliday(year, month, date) {
  const m = month + 1;
  const thisDate = new Date(year, month, date);
  const dayOfWeek = thisDate.getDay();

  let name = getHolidayName(year, m, date, dayOfWeek);
  if (name) return name;

  if (dayOfWeek !== 0) {
    for (let i = 1; i <= date; i++) {
      const prevDate = new Date(year, month, date - i);
      const prevDayOfWeek = prevDate.getDay();
      const prevM = prevDate.getMonth() + 1;
      const prevD = prevDate.getDate();

      if (prevDayOfWeek === 0) {
        if (getHolidayName(year, prevM, prevD, 0)) return "振替休日";
        break;
      } else {
        if (!getHolidayName(year, prevM, prevD, prevDayOfWeek)) break;
      }
    }
  }

  if (dayOfWeek !== 0 && dayOfWeek !== 6) {
    const yesterday = new Date(year, month, date - 1);
    const tomorrow = new Date(year, month, date + 1);
    const yName = getHolidayName(year, yesterday.getMonth() + 1, yesterday.getDate(), yesterday.getDay());
    const tName = getHolidayName(year, tomorrow.getMonth() + 1, tomorrow.getDate(), tomorrow.getDay());
    if (yName && tName) return "国民の休日";
  }

  return null;
}

// 月ブロック生成
function createMonthBlock(year, month) {
  const block = document.createElement('div');
  block.className = 'month-block';
  block.dataset.year = year;
  block.dataset.month = month;

  const title = document.createElement('div');
  title.className = 'month-title';
  title.textContent = `${year}年 ${month + 1}月`;
  block.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'calendar-grid';

  const days = [
    { name: '日', class: 'sun' },
    { name: '月', class: '' },
    { name: '火', class: '' },
    { name: '水', class: '' },
    { name: '木', class: '' },
    { name: '金', class: '' },
    { name: '土', class: 'sat' }
  ];
  days.forEach(d => {
    const dayEl = document.createElement('div');
    dayEl.className = `day-header ${d.class}`;
    dayEl.textContent = d.name;
    grid.appendChild(dayEl);
  });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'date-cell empty';
    grid.appendChild(emptyCell);
  }

  const today = new Date();

  for (let date = 1; date <= lastDate; date++) {
    const dateCell = document.createElement('div');
    dateCell.className = 'date-cell';

    const thisDate = new Date(year, month, date);
    const dayOfWeek = thisDate.getDay();

    if (dayOfWeek === 6) dateCell.classList.add('sat');
    if (dayOfWeek === 0) dateCell.classList.add('sun');

    const holidayName = getHoliday(year, month, date);
    if (holidayName) dateCell.classList.add('holiday');

    if (year === today.getFullYear() && month === today.getMonth() && date === today.getDate()) {
      dateCell.classList.add('today');
    }

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    dateCell.dataset.dateKey = dateKey;

    if (selectedDateKey === dateKey) {
      dateCell.classList.add('selected');
    }

    const dateNum = document.createElement('span');
    dateNum.className = 'date-number';
    dateNum.textContent = date;
    dateCell.appendChild(dateNum);

    if (holidayName) {
      const holidayEl = document.createElement('span');
      holidayEl.className = 'holiday-name';
      holidayEl.textContent = holidayName;
      dateCell.appendChild(holidayEl);
    }

    if (events[dateKey]) {
      const badge = document.createElement('div');
      badge.className = 'memo-badge';
      badge.textContent = events[dateKey];
      dateCell.appendChild(badge);
    }

    // タップ時イベント
    dateCell.addEventListener('click', () => {
      document.querySelectorAll('.date-cell.selected').forEach(el => el.classList.remove('selected'));
      dateCell.classList.add('selected');
      selectedDateKey = dateKey;

      document.getElementById('selected-date-label').textContent = `${year}年${month + 1}月${date}日の予定`;
      document.getElementById('memo-input').value = events[dateKey] || "";
      document.getElementById('memo-form-container').classList.remove('hidden');
    });

    grid.appendChild(dateCell);
  }

  block.appendChild(grid);
  return block;
}

// 未来の月を下に追加
function appendNextMonth() {
  bottomMonth++;
  if (bottomMonth > 11) {
    bottomMonth = 0;
    bottomYear++;
  }
  container.appendChild(createMonthBlock(bottomYear, bottomMonth));
}

// 過去の月を上に追加
function prependPrevMonth() {
  topMonth--;
  if (topMonth < 0) {
    topMonth = 11;
    topYear--;
  }
  const newBlock = createMonthBlock(topYear, topMonth);
  const oldScrollHeight = container.scrollHeight;
  
  container.insertBefore(newBlock, container.firstChild);
  
  // スクロール位置が跳ねないよう調整
  const newScrollHeight = container.scrollHeight;
  container.scrollTop += (newScrollHeight - oldScrollHeight);
}

// 初期描画
function initCalendar() {
  const today = new Date();
  const currentY = today.getFullYear();
  const currentM = today.getMonth();

  topYear = currentY;
  topMonth = currentM - 1;
  if (topMonth < 0) { topMonth = 11; topYear--; }

  bottomYear = currentY;
  bottomMonth = currentM + 1;
  if (bottomMonth > 11) { bottomMonth = 0; bottomYear++; }

  container.appendChild(createMonthBlock(topYear, topMonth));
  const currentBlock = createMonthBlock(currentY, currentM);
  container.appendChild(currentBlock);
  container.appendChild(createMonthBlock(bottomYear, bottomMonth));

  setTimeout(() => {
    currentBlock.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, 50);
}

// --- 無限スクロール検知 ---
container.addEventListener('scroll', () => {
  // 下方向にスクロールして端に近づいた時
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 300) {
    appendNextMonth();
  }
  // 上方向にスクロールして端に近づいた時
  if (container.scrollTop <= 100) {
    prependPrevMonth();
  }
});

// フォーム操作イベント設定
document.getElementById('save-btn').addEventListener('click', () => {
  if (!selectedDateKey) return;
  const val = document.getElementById('memo-input').value.trim();
  if (val) {
    events[selectedDateKey] = val;
  } else {
    delete events[selectedDateKey];
  }
  localStorage.setItem('my_calendar_events', JSON.stringify(events));
  refreshCalendar();
  document.getElementById('memo-form-container').classList.add('hidden');
});

document.getElementById('delete-btn').addEventListener('click', () => {
  if (!selectedDateKey) return;
  delete events[selectedDateKey];
  localStorage.setItem('my_calendar_events', JSON.stringify(events));
  refreshCalendar();
  document.getElementById('memo-form-container').classList.add('hidden');
});

document.getElementById('cancel-btn').addEventListener('click', () => {
  document.getElementById('memo-form-container').classList.add('hidden');
});

function refreshCalendar() {
  container.innerHTML = '';
  initCalendar();
}

window.addEventListener('DOMContentLoaded', initCalendar);
