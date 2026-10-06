function initializeFortunes({ randomInteger, reduceMotion, onEnter }) {
  const $ = (id) => document.getElementById(id);
  const page = $('fortunePage');
  const lottery = $('lotteryPage');
  const choices = $('fortuneChoices');
  const stage = $('fortuneStage');
  const art = $('ritualArt');
  const result = $('fortuneResult');
  const again = $('chooseAgain');
  let busy = false;
  const fortunes = [
    { title: '작은 시작의 행운', message: '완벽한 준비보다 가벼운 첫걸음이 어울리는 날이에요. 미뤄둔 작은 일 하나를 시작해보세요.' },
    { title: '뜻밖의 반가움', message: '익숙한 하루에도 새로운 장면이 숨어 있어요. 평소 지나치던 풍경을 천천히 바라보세요.' },
    { title: '마음에 여백을', message: '잠깐 쉬는 시간도 오늘의 좋은 선택이에요. 따뜻한 한 잔과 함께 나만의 속도를 찾아보세요.' },
    { title: '다정함이 돌아오는 날', message: '작은 인사 한마디가 하루의 표정을 바꿀 수 있어요. 떠오르는 사람에게 안부를 건네보세요.' },
    { title: '차분한 자신감', message: '지금까지 쌓아온 시간이 당신의 편이에요. 남의 속도보다 내가 해낸 작은 변화에 눈을 돌려보세요.' },
    { title: '새로운 바람', message: '조금 다른 선택이 재미있는 발견을 가져올지도 몰라요. 오늘은 익숙한 길에서 한 걸음만 벗어나보세요.' },
    { title: '빛나는 호기심', message: '마음에 걸린 궁금증을 그냥 넘기지 마세요. 가볍게 찾아본 하나가 다음 아이디어의 씨앗이 될 수 있어요.' },
    { title: '고요한 균형', message: '서두르지 않아도 괜찮아요. 꼭 해야 할 일 하나와 나를 기쁘게 할 일 하나를 나란히 놓아보세요.' },
    { title: '작은 기쁨 수집', message: '좋아하는 음악, 맛있는 한입, 기분 좋은 햇빛. 오늘의 행운은 그런 작은 순간에 머물러 있을지도 몰라요.' },
    { title: '용기를 위한 한 장', message: '머뭇거리던 마음에 작은 응원을 보내요. 부담 없는 크기로 줄여서, 하고 싶은 일을 한 번 시도해보세요.' },
    { title: '함께하는 온기', message: '혼자 다 해내지 않아도 괜찮아요. 필요한 도움을 나누고, 함께 웃을 수 있는 순간을 찾아보세요.' },
    { title: '나를 믿는 시간', message: '오늘은 내 마음이 편안해지는 쪽을 골라보세요. 작은 선택 하나에도 당신의 취향이 담겨 있어요.' },
  ];
  const rituals = {
    tarot: { title: '타로 카드', hint: '세 장 중 마음이 끌리는 한 장을 골라주세요.', wait: 1000,
      markup: '<div class="tarot-deck">' + [1, 2, 3].map(n => `<button type="button" class="tarot-card" aria-label="${n}번째 타로 카드 뽑기"><span class="tarot-inner"><span class="tarot-back">✦<small>YOUR MOMENT</small></span><span class="tarot-front">☀<small>작은 빛</small></span></span></button>`).join('') + '</div>' },
    cookie: { title: '포춘 쿠키', hint: '쿠키를 눌러 안에 담긴 메시지를 열어보세요.', wait: 1100,
      markup: '<button type="button" class="cookie-draw ritual-trigger" aria-label="포춘 쿠키 열기"><span class="cookie-paper">작은 행운이 도착했어요</span><span class="cookie-half cookie-left"></span><span class="cookie-half cookie-right"></span><span class="cookie-crumb crumb-one"></span><span class="cookie-crumb crumb-two"></span></button>' },
    water: { title: '물에 드러나는 운세', hint: '빈 종이를 눌러 잔잔한 물 위에 띄워주세요.', wait: 1900,
      markup: '<button type="button" class="water-draw ritual-trigger" aria-label="운세 종이를 물에 띄우기"><span class="water-ripple"></span><span class="water-paper"><span class="water-ink">오늘의 작은<br>행운이 스며들어요</span></span></button>' },
    sticks: { title: '산통 제비 뽑기', hint: '산통을 눌러 흔들면, 하나의 제비가 올라와요.', wait: 1600,
      markup: '<button type="button" class="sticks-draw ritual-trigger" aria-label="산통 흔들어 제비 뽑기"><span class="fortune-stick stick-one"></span><span class="fortune-stick stick-two"></span><span class="fortune-stick stick-three"></span><span class="chosen-stick">吉</span><span class="canister"><span>福</span></span></button>' },
  };

  function showChoices() {
    if (busy) return;
    onEnter();
    lottery.hidden = true;
    page.hidden = false;
    choices.hidden = false;
    stage.hidden = true;
    document.body.classList.remove('fortune-active');
    $('fortuneHeading').focus({ preventScroll: true });
  }

  function chooseRitual(type) {
    if (busy) return;
    const ritual = rituals[type];
    choices.hidden = true;
    stage.hidden = false;
    result.hidden = true;
    $('ritualHeading').textContent = ritual.title;
    $('ritualHint').textContent = ritual.hint;
    $('fortuneStatus').textContent = '';
    art.className = `ritual-art ${type}`;
    art.innerHTML = ritual.markup;
    again.disabled = false;
    art.querySelectorAll('button').forEach(button => button.addEventListener('click', () => reveal(type, button)));
    $('ritualHeading').focus({ preventScroll: true });
  }

  async function reveal(type, selected) {
    if (busy || !result.hidden) return;
    busy = true;
    again.disabled = true;
    art.querySelectorAll('button').forEach(button => { button.disabled = true; });
    const fortuneIndex = randomInteger(fortunes.length);
    const fortune = fortunes[fortuneIndex];
    if (type === 'tarot') {
      const front = selected.querySelector('.tarot-front');
      front.firstChild.textContent = ['☀', '☽', '✧'][fortuneIndex % 3];
      front.querySelector('small').textContent = fortune.title;
    } else if (type === 'cookie') {
      selected.querySelector('.cookie-paper').textContent = fortune.title;
    } else if (type === 'water') {
      selected.querySelector('.water-ink').textContent = fortune.title;
    } else {
      selected.querySelector('.chosen-stick').textContent = String(fortuneIndex + 1).padStart(2, '0');
    }
    selected.classList.add('selected');
    art.classList.add('revealing');
    document.body.classList.add('fortune-active');
    $('fortuneStatus').textContent = '오늘의 메시지를 펼치고 있어요…';
    if (!reduceMotion) await new Promise(resolve => setTimeout(resolve, rituals[type].wait));
    $('fortuneTitle').textContent = fortune.title;
    $('fortuneMessage').textContent = fortune.message;
    $('fortuneStatus').textContent = '오늘의 운세를 만났어요.';
    result.hidden = false;
    art.classList.add('revealed');
    document.body.classList.remove('fortune-active');
    busy = false;
    again.disabled = false;
    $('enterLottery').focus({ preventScroll: true });
    result.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'nearest' });
  }

  choices.querySelectorAll('button').forEach(button => button.addEventListener('click', () => chooseRitual(button.dataset.fortune)));
  again.addEventListener('click', showChoices);
  $('backToFortune').addEventListener('click', showChoices);
  $('enterLottery').addEventListener('click', () => {
    if (busy || result.hidden) return;
    onEnter();
    page.hidden = true;
    lottery.hidden = false;
    $('drawButton').focus({ preventScroll: true });
    lottery.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' });
  });
}
