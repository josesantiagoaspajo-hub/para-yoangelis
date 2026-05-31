const app = document.querySelector('#app');
const screen = document.querySelector('#screen');
const progressBar = document.querySelector('#progressBar');
const backBtn = document.querySelector('#backBtn');
const homeBtn = document.querySelector('#homeBtn');
const emergencyBtn = document.querySelector('#emergencyBtn');
const soundBtn = document.querySelector('#soundBtn');
const canvas = document.querySelector('#sparkleCanvas');
const ctx = canvas.getContext('2d');

let current = 0;
let audioCtx = null;
let musicOn = false;
let audioNodes = [];
let noteTimer = null;
const progress = JSON.parse(localStorage.getItem('yoangelis-progress') || '{}');

const haptic = (pattern = 18) => {
  if ('vibrate' in navigator) navigator.vibrate(pattern);
};

const saveProgress = () => localStorage.setItem('yoangelis-progress', JSON.stringify(progress));

const showNote = (message, title = 'Guárdalo en tu corazón') => {
  clearTimeout(noteTimer);
  const old = document.querySelector('.floating-note');
  if (old) old.remove();
  const note = document.createElement('aside');
  note.className = 'floating-note';
  note.innerHTML = `<strong>${title}</strong><p class="small" style="margin:8px 0 0">${message}</p>`;
  document.body.appendChild(note);
  haptic([18, 28, 18]);
  noteTimer = setTimeout(() => note.remove(), 5200);
};

const openModal = (title, message, button = 'Lo guardo en mi corazón') => {
  const modal = document.createElement('div');
  modal.className = 'modal-card';
  modal.innerHTML = `
    <div class="modal-inner" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <p class="eyebrow">Mensaje para Yoangelis</p>
      <h3 id="modalTitle">${title}</h3>
      <p>${message}</p>
      <button class="primary-action" type="button">${button}</button>
    </div>`;
  modal.querySelector('button').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.remove(); });
  document.body.appendChild(modal);
  haptic([12, 26, 12]);
};

const confetti = (count = 65) => {
  const pieces = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.18,
      r: 4 + Math.random() * 7,
      vy: 2 + Math.random() * 4,
      vx: -1.4 + Math.random() * 2.8,
      rot: Math.random() * Math.PI,
      life: 90 + Math.random() * 50
    });
  }
  const colors = ['#fff3a5', '#ff91c7', '#7d4bff', '#b7f7ff', '#ffffff'];
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += 0.08;
      p.life -= 1;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = colors[index % colors.length];
      ctx.globalAlpha = Math.max(p.life / 110, 0);
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.7);
      ctx.restore();
    });
    for (let i = pieces.length - 1; i >= 0; i--) if (pieces[i].life <= 0) pieces.splice(i, 1);
    if (pieces.length) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
};

const resizeCanvas = () => {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
};
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const createMusic = async () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();
  const master = audioCtx.createGain();
  master.gain.value = 0.035;
  master.connect(audioCtx.destination);
  const freqs = [261.63, 329.63, 392.00, 523.25];
  audioNodes = freqs.map((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = i % 2 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.18 / freqs.length;
    osc.connect(gain).connect(master);
    osc.start();
    return { osc, gain, master };
  });
};

const stopMusic = () => {
  audioNodes.forEach(({ osc }) => { try { osc.stop(); } catch {} });
  audioNodes = [];
};

soundBtn.addEventListener('click', async () => {
  musicOn = !musicOn;
  if (musicOn) {
    await createMusic();
    soundBtn.textContent = '♪';
    soundBtn.setAttribute('aria-label', 'Desactivar música suave');
    showNote('La música suave está activada. Si quieres silencio, toca otra vez el botón de música.', 'Música activada');
  } else {
    stopMusic();
    soundBtn.textContent = '♫';
    soundBtn.setAttribute('aria-label', 'Activar música suave');
  }
});

const screens = [
  { id: 'intro', render: renderIntro },
  { id: 'breath', render: renderBreath },
  { id: 'truth', render: renderTruth },
  { id: 'backpack', render: renderBackpack },
  { id: 'alcides', render: renderAlcides },
  { id: 'juana', render: renderJuana },
  { id: 'victory', render: renderVictory },
  { id: 'salon', render: renderSalon },
  { id: 'limits', render: renderLimits },
  { id: 'cycle', render: renderCycle },
  { id: 'letter', render: renderLetter },
  { id: 'prayer', render: renderPrayer },
  { id: 'emergency', render: renderEmergency },
  { id: 'promise', render: renderPromise }
];

function baseCard({ eyebrow, title, lead, body = '', action = 'Continuar', next = true }) {
  return `
    <article class="card">
      <p class="eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      ${lead ? `<p class="lead">${lead}</p>` : ''}
      ${body}
      ${next ? `<button class="primary-action" data-next type="button">${action}</button>` : ''}
    </article>`;
}

function renderIntro() {
  screen.innerHTML = document.querySelector('#introTemplate').innerHTML;
  screen.querySelector('[data-next]').addEventListener('click', nextScreen);
}

function renderBreath() {
  let count = progress.breathCount || 0;
  const phrases = [
    'Inhala: Dios está conmigo. Exhala: no tengo que cargar con todo.',
    'Inhala: mi vida también importa. Exhala: poner límites no me hace mala.',
    'Inhala: Dios me sostiene. Exhala: la culpa no decide por mí.'
  ];
  screen.innerHTML = baseCard({
    eyebrow: 'Primero, respira',
    title: 'Antes de decidir con el corazón pesado, vuelve a tu paz.',
    lead: 'Toca el círculo tres veces. Cada toque es una respiración para recordarte que Dios no te está soltando.',
    body: `
      <div class="breath-wrap">
        <button class="breath-orb" type="button" aria-label="Respirar"><span>${phrases[count % phrases.length]}</span></button>
        <p class="counter-line">Respiraciones guardadas: <strong id="breathCount">${count}</strong>/3</p>
      </div>
      <p class="instruction">Cuando llegues a tres, se desbloquea la siguiente parte.</p>`,
    next: false
  });
  const orb = screen.querySelector('.breath-orb');
  orb.addEventListener('click', () => {
    count = Math.min(3, count + 1);
    progress.breathCount = count;
    saveProgress();
    screen.querySelector('#breathCount').textContent = count;
    orb.querySelector('span').textContent = phrases[(count - 1) % phrases.length];
    haptic(18);
    if (count >= 3) {
      showNote('Respiraste. Ahora recuerda: una decisión tomada desde la paz pesa menos que una decisión tomada desde la culpa.', 'Bien, mi amor');
      const btn = document.createElement('button');
      btn.className = 'primary-action';
      btn.type = 'button';
      btn.textContent = 'Estoy lista para recordar la verdad';
      btn.addEventListener('click', nextScreen);
      screen.querySelector('.card').appendChild(btn);
    }
  });
}

function renderTruth() {
  const truths = [
    '<strong>Yoangelis, tú no eres tu pasado.</strong> Eres la mujer que decidió levantarse.',
    '<strong>Cinco meses sin caer</strong> no son poca cosa. Son cinco meses de guerra interna, oración y valentía.',
    '<strong>Dios no te trajo hasta aquí para dejarte caer.</strong> Él también cuida lo que está restaurando en ti.',
    '<strong>No estás sola.</strong> Juana dejó todo en Venezuela por venir a cuidarte y salvarte: eso también es amor de madre.',
    '<strong>Alcides te amó demasiado.</strong> Y ese amor sigue vivo cada vez que eliges hacer algo bueno con tu vida.'
  ];
  screen.innerHTML = baseCard({
    eyebrow: 'La verdad que necesitas',
    title: 'Toca para abrir cada verdad.',
    lead: 'No corras. Lee cada tarjeta como si fuera una mano en tu hombro.',
    body: `<div class="truth-stack" id="truthStack"></div><button class="soft-action" id="truthBtn" type="button">Abrir una verdad</button>`,
    next: false
  });
  let index = progress.truthIndex || 0;
  const stack = screen.querySelector('#truthStack');
  const btn = screen.querySelector('#truthBtn');
  const drawTruths = () => {
    stack.innerHTML = truths.slice(0, index).map((truth, i) => `<div class="truth-card" style="animation-delay:${i * 55}ms">${truth}</div>`).join('');
    if (index >= truths.length) {
      btn.textContent = 'Ahora sí, quiero soltar la carga';
      btn.onclick = nextScreen;
      confetti(42);
    }
  };
  btn.addEventListener('click', () => {
    if (index < truths.length) {
      index++;
      progress.truthIndex = index;
      saveProgress();
      haptic(14);
      drawTruths();
    }
  });
  drawTruths();
}

function renderBackpack() {
  const stones = [
    ['culpa', 'Culpa', 'La culpa no siempre dice la verdad. A veces aparece cuando por fin empiezas a poner límites.'],
    ['miedo', 'Miedo', 'No necesitas resolver toda tu vida hoy. Solo necesitas dar el siguiente paso correcto con Dios.'],
    ['adultos', 'Cargas de adultos', 'Hay responsabilidades que pertenecen a los adultos que tomaron decisiones, no a una joven que está reconstruyéndose.'],
    ['opinion', 'Opinión ajena', 'Que otros no entiendan tu proceso no significa que tu decisión sea incorrecta.'],
    ['promesas', 'Promesas rotas', 'No puedes construir tu vida sobre promesas que muchas veces no se cumplen.'],
    ['hermanos', 'Ser madre de todos', 'Puedes amar a tus hermanos sin convertirte en su madre. Amar no siempre significa cargar.']
  ];
  const done = progress.stones || [];
  screen.innerHTML = baseCard({
    eyebrow: 'Juego 1: la mochila',
    title: 'Suelta lo que nunca debió pesar sobre tus hombros.',
    lead: 'Toca cada piedra para quitar peso. Cuando desaparezcan todas, se abrirá un mensaje para ti.',
    body: `<div class="backpack-area" id="backpackArea"><div class="backpack" aria-hidden="true"></div></div><p class="counter-line"><strong id="stoneCount">${done.length}</strong>/${stones.length} cargas soltadas</p>`,
    next: false
  });
  const area = screen.querySelector('#backpackArea');
  const positions = [
    ['8%', '20%'], ['55%', '12%'], ['18%', '42%'], ['55%', '38%'], ['6%', '65%'], ['60%', '66%']
  ];
  stones.forEach(([id, label, msg], i) => {
    const stone = document.createElement('button');
    stone.className = `stone ${done.includes(id) ? 'done' : ''}`;
    stone.style.left = positions[i][0];
    stone.style.top = positions[i][1];
    stone.type = 'button';
    stone.textContent = label;
    stone.addEventListener('click', () => {
      if (!progress.stones) progress.stones = [];
      if (!progress.stones.includes(id)) progress.stones.push(id);
      stone.classList.add('done');
      saveProgress();
      screen.querySelector('#stoneCount').textContent = progress.stones.length;
      showNote(msg, 'Una carga menos');
      if (progress.stones.length === stones.length) {
        setTimeout(() => {
          openModal('No estás abandonando', 'Yoangelis, no estás haciendo lo mismo que te hicieron. Tú no estás abandonando desde la indiferencia: estás poniendo límites desde una herida que está sanando. Eso no te hace mala. Eso te hace valiente.', 'Seguir caminando');
          const btn = document.createElement('button');
          btn.className = 'primary-action';
          btn.type = 'button';
          btn.textContent = 'Quiero seguir hacia la luz';
          btn.addEventListener('click', nextScreen);
          screen.querySelector('.card').appendChild(btn);
          confetti(48);
        }, 380);
      }
    });
    area.appendChild(stone);
  });
  if (done.length === stones.length) {
    const btn = document.createElement('button');
    btn.className = 'primary-action';
    btn.type = 'button';
    btn.textContent = 'Quiero seguir hacia la luz';
    btn.addEventListener('click', nextScreen);
    screen.querySelector('.card').appendChild(btn);
  }
}

function renderAlcides() {
  const messages = [
    ['Flor de amor', 'Mi niña, fuiste amada con ternura. Ese amor no se perdió; sigue dentro de ti.'],
    ['Flor de valores', 'Papá Alcides te crió con amor y valores para que un día caminaras con dignidad, no para que vivieras apagada.'],
    ['Flor de orgullo', 'Si él pudiera verte luchando, intentando cambiar y soñando con tu salón, estaría orgulloso de ti.'],
    ['Flor de sueños', 'Tu papá te diría: haz lo que tengas que hacer para cumplir tus metas y tus sueños. No apagues tu futuro por culpa.'],
    ['Flor de memoria', 'Tú amas demasiado a papá Alcides, y cumplir tus sueños también honra el amor que él sembró en ti.'],
    ['Flor de cielo', 'Siempre serás la niña de sus ojos. Ni tus caídas ni tus dudas borran el amor que él te tuvo.']
  ];
  const opened = progress.flowers || [];
  screen.innerHTML = baseCard({
    eyebrow: 'Juego 2: el jardín de papá Alcides',
    title: 'Toca las flores para abrir lo que su amor sembró en ti.',
    lead: 'Él te amó demasiado. Y tú lo amas demasiado. Este jardín es para recordar que su amor también puede darte fuerza hoy.',
    body: `<div class="garden" id="garden"></div><p class="counter-line"><strong id="flowerCount">${opened.length}</strong>/${messages.length} flores abiertas</p>`,
    next: false
  });
  const garden = screen.querySelector('#garden');
  const icons = ['🌷','🌸','🌼','🌹','💐','🌻'];
  messages.forEach(([title, msg], i) => {
    const flower = document.createElement('button');
    flower.className = `flower ${opened.includes(i) ? 'opened' : ''}`;
    flower.type = 'button';
    flower.textContent = icons[i];
    flower.addEventListener('click', () => {
      if (!progress.flowers) progress.flowers = [];
      if (!progress.flowers.includes(i)) progress.flowers.push(i);
      flower.classList.add('opened');
      saveProgress();
      screen.querySelector('#flowerCount').textContent = progress.flowers.length;
      openModal(title, msg);
      if (progress.flowers.length === messages.length && !screen.querySelector('[data-next]')) {
        const btn = document.createElement('button');
        btn.className = 'primary-action';
        btn.dataset.next = 'true';
        btn.type = 'button';
        btn.textContent = 'Llevo a papá Alcides conmigo';
        btn.addEventListener('click', nextScreen);
        screen.querySelector('.card').appendChild(btn);
        confetti(60);
      }
    });
    garden.appendChild(flower);
  });
  if (opened.length === messages.length) {
    const btn = document.createElement('button');
    btn.className = 'primary-action';
    btn.type = 'button';
    btn.textContent = 'Llevo a papá Alcides conmigo';
    btn.addEventListener('click', nextScreen);
    screen.querySelector('.card').appendChild(btn);
  }
}

function renderJuana() {
  const hearts = [
    ['Paz', 'Juana dejó todo en Venezuela para venir a cuidarte y salvarte. Eso es verdadero amor de madre.'],
    ['Refugio', 'Cuando muchos no estuvieron, Juana sí estuvo. Su amor fue refugio.'],
    ['Descanso', 'Ella también merece paz, descanso y noches tranquilas.'],
    ['Esperanza', 'Le diste esperanza cuando empezaste a cambiar y cuidarte.'],
    ['Hogar', 'Vivir con Juana y buscar tranquilidad no es huir: es elegir un hogar donde puedan sanar.'],
    ['Gracias', 'Tu cambio también le está devolviendo alegría a su corazón.']
  ];
  const collected = progress.juanaHearts || [];
  screen.innerHTML = baseCard({
    eyebrow: 'Juego 3: corazones para Juana',
    title: 'Dale paz a quien dejó todo por amor.',
    lead: 'Toca cada corazón. Cada uno guarda una verdad sobre Juana, su amor y la paz que ambas merecen.',
    body: `<div class="juana-home"><div class="juana-house"></div></div><div class="heart-game" id="heartGame"></div><p class="counter-line"><strong id="heartCount">${collected.length}</strong>/${hearts.length} corazones de paz</p>`,
    next: false
  });
  const game = screen.querySelector('#heartGame');
  hearts.forEach(([title, msg], i) => {
    const heart = document.createElement('button');
    heart.className = `heart-token ${collected.includes(i) ? 'collected' : ''}`;
    heart.type = 'button';
    heart.textContent = '💗';
    heart.addEventListener('click', () => {
      if (!progress.juanaHearts) progress.juanaHearts = [];
      if (!progress.juanaHearts.includes(i)) progress.juanaHearts.push(i);
      heart.classList.add('collected');
      saveProgress();
      screen.querySelector('#heartCount').textContent = progress.juanaHearts.length;
      openModal(title, msg);
      if (progress.juanaHearts.length === hearts.length && !screen.querySelector('[data-next]')) {
        const btn = document.createElement('button');
        btn.className = 'primary-action';
        btn.type = 'button';
        btn.textContent = 'Gracias, Juana. Sigamos buscando paz';
        btn.addEventListener('click', nextScreen);
        screen.querySelector('.card').appendChild(btn);
        confetti(45);
      }
    });
    game.appendChild(heart);
  });
  if (collected.length === hearts.length) {
    const btn = document.createElement('button');
    btn.className = 'primary-action';
    btn.type = 'button';
    btn.textContent = 'Gracias, Juana. Sigamos buscando paz';
    btn.addEventListener('click', nextScreen);
    screen.querySelector('.card').appendChild(btn);
  }
}

function renderVictory() {
  const medals = [
    ['1', 'Volví a intentarlo', 'El primer mes no fue pequeño. Fue el inicio de una batalla que muchos no ven.'],
    ['2', 'Elegí cuidarme', 'Cada día que dijiste “hoy no”, estabas eligiendo tu vida.'],
    ['3', 'Dios me sostuvo', 'Cuando tus fuerzas no alcanzaban, Dios siguió caminando contigo.'],
    ['4', 'Empecé a creer', 'No todo cambió de golpe, pero algo dentro de ti empezó a despertar.'],
    ['5', 'Estoy de pie', 'Cinco meses significan que sí puedes. No significa que todo sea fácil; significa que no estás vencida.']
  ];
  const opened = progress.medals || [];
  screen.innerHTML = baseCard({
    eyebrow: 'Juego 4: cinco meses de victoria',
    title: 'Celebra lo que ya venciste.',
    lead: 'Toca cada medalla. Cinco meses de lucha también son cinco meses de amor propio, fe y valentía.',
    body: `<div class="timeline" id="timeline"></div><p class="counter-line"><strong id="medalCount">${opened.length}</strong>/${medals.length} victorias reconocidas</p>`,
    next: false
  });
  const timeline = screen.querySelector('#timeline');
  medals.forEach(([num, title, msg], i) => {
    const medal = document.createElement('button');
    medal.className = `medal ${opened.includes(i) ? 'opened' : ''}`;
    medal.type = 'button';
    medal.innerHTML = `<div class="coin">${num}</div><div><strong>Mes ${num}: ${title}</strong><span>Toca para leer esta victoria.</span></div>`;
    medal.addEventListener('click', () => {
      if (!progress.medals) progress.medals = [];
      if (!progress.medals.includes(i)) progress.medals.push(i);
      medal.classList.add('opened');
      saveProgress();
      screen.querySelector('#medalCount').textContent = progress.medals.length;
      openModal(`Mes ${num}: ${title}`, msg);
      if (progress.medals.length === medals.length && !screen.querySelector('[data-next]')) {
        openModal('Tu proceso vale', 'Yoangelis, no pongas en riesgo lo que Dios está restaurando en ti. Cinco meses de victoria merecen cuidado, paz y decisiones que protejan tu futuro.', 'Lo voy a cuidar');
        const btn = document.createElement('button');
        btn.className = 'primary-action';
        btn.type = 'button';
        btn.textContent = 'Voy a cuidar mi proceso';
        btn.addEventListener('click', nextScreen);
        screen.querySelector('.card').appendChild(btn);
        confetti(85);
      }
    });
    timeline.appendChild(medal);
  });
  if (opened.length === medals.length) {
    const btn = document.createElement('button');
    btn.className = 'primary-action';
    btn.type = 'button';
    btn.textContent = 'Voy a cuidar mi proceso';
    btn.addEventListener('click', nextScreen);
    screen.querySelector('.card').appendChild(btn);
  }
}

function renderSalon() {
  const dreams = [
    ['Mi salón de uñas', 'Tus manos tienen talento. Tus manos pueden crear belleza, independencia y futuro.'],
    ['Mi propio departamento', 'Un lugar donde haya paz, orden, oración y tranquilidad.'],
    ['Mi casa', 'Un hogar donde no tengas que vivir con miedo, incomodidad ni cargas que no son tuyas.'],
    ['Mi carro', 'Un símbolo de avance, libertad y fruto de tu esfuerzo.'],
    ['Mi paz', 'La meta más importante no es solo tener cosas. Es tener paz en el corazón.']
  ];
  const painted = progress.nails || [];
  screen.innerHTML = baseCard({
    eyebrow: 'Juego 5: el salón de tus sueños',
    title: 'Pinta cada uña y desbloquea un sueño.',
    lead: 'Tu futuro no es fantasía: es una semilla. Tócala con amor y no la entregues a la culpa.',
    body: `<div class="nail-salon"><div class="hand" id="hand"></div><p class="salon-status"><strong id="nailCount">${painted.length}</strong>/5 sueños pintados</p></div>`,
    next: false
  });
  const hand = screen.querySelector('#hand');
  dreams.forEach(([title, msg], i) => {
    const finger = document.createElement('div');
    finger.className = 'finger';
    finger.innerHTML = `<button class="nail ${painted.includes(i) ? 'done' : ''}" type="button" aria-label="Pintar uña ${i + 1}"></button><div class="finger-body"></div>`;
    const nail = finger.querySelector('.nail');
    nail.addEventListener('click', () => {
      if (!progress.nails) progress.nails = [];
      if (!progress.nails.includes(i)) progress.nails.push(i);
      nail.classList.add('done');
      saveProgress();
      screen.querySelector('#nailCount').textContent = progress.nails.length;
      openModal(title, msg);
      if (progress.nails.length === dreams.length && !screen.querySelector('[data-next]')) {
        openModal('Dios puso talento en tus manos', 'Santiago cree en ti. Juana cree en ti. Papá Alcides estaría orgulloso. Ahora tú también tienes que creer en ti.', 'Sí puedo');
        const btn = document.createElement('button');
        btn.className = 'primary-action';
        btn.type = 'button';
        btn.textContent = 'Sí puedo cumplir mis sueños';
        btn.addEventListener('click', nextScreen);
        screen.querySelector('.card').appendChild(btn);
        confetti(90);
      }
    });
    hand.appendChild(finger);
  });
  if (painted.length === dreams.length) {
    const btn = document.createElement('button');
    btn.className = 'primary-action';
    btn.type = 'button';
    btn.textContent = 'Sí puedo cumplir mis sueños';
    btn.addEventListener('click', nextScreen);
    screen.querySelector('.card').appendChild(btn);
  }
}

function renderLimits() {
  const cards = [
    ['¿Es mío sanar?', 'Sí. Tu sanidad es una responsabilidad sagrada contigo misma y con Dios.'],
    ['¿Es mío cuidar mi paz?', 'Sí. Tu paz no es un lujo. Es parte de tu recuperación.'],
    ['¿Es mío amar a mis hermanos?', 'Sí. Puedes amarlos, orar por ellos y desearles bien.'],
    ['¿Es mío criar a mis hermanos como si fueran mis hijos?', 'No. Esa responsabilidad no nació contigo. No eres mala por reconocer tus límites.'],
    ['¿Es mío resolver decisiones de adultos?', 'No. Cada adulto debe responder por sus decisiones. Tú no puedes pagar consecuencias que no elegiste.'],
    ['¿Es mío abandonar mis sueños para que nadie me critique?', 'No. La crítica no puede ser más fuerte que el propósito que Dios está formando en ti.']
  ];
  const flipped = progress.limitCards || [];
  screen.innerHTML = baseCard({
    eyebrow: 'Juego 6: lo que sí es tuyo y lo que no',
    title: 'Toca cada tarjeta para ordenar el corazón.',
    lead: 'Puedes ser buena, amar a tu familia y aun así decir: “esto no me corresponde”.',
    body: `<div class="flip-grid" id="flipGrid"></div><p class="counter-line"><strong id="limitCount">${flipped.length}</strong>/${cards.length} respuestas leídas</p>`,
    next: false
  });
  const grid = screen.querySelector('#flipGrid');
  cards.forEach(([question, answer], i) => {
    const card = document.createElement('button');
    card.className = `flip-card ${flipped.includes(i) ? 'revealed' : ''}`;
    card.type = 'button';
    card.innerHTML = flipped.includes(i)
      ? `<strong>${question}</strong><p>${answer}</p>`
      : `<strong>${question}</strong><p>Toca para responder.</p>`;
    card.addEventListener('click', () => {
      if (!progress.limitCards) progress.limitCards = [];
      if (!progress.limitCards.includes(i)) progress.limitCards.push(i);
      card.classList.add('revealed');
      card.innerHTML = `<strong>${question}</strong><p>${answer}</p>`;
      saveProgress();
      screen.querySelector('#limitCount').textContent = progress.limitCards.length;
      haptic(16);
      if (progress.limitCards.length === cards.length && !screen.querySelector('[data-next]')) {
        const btn = document.createElement('button');
        btn.className = 'primary-action';
        btn.type = 'button';
        btn.textContent = 'Entiendo: poner límites también es amor';
        btn.addEventListener('click', nextScreen);
        screen.querySelector('.card').appendChild(btn);
        confetti(55);
      }
    });
    grid.appendChild(card);
  });
  if (flipped.length === cards.length) {
    const btn = document.createElement('button');
    btn.className = 'primary-action';
    btn.type = 'button';
    btn.textContent = 'Entiendo: poner límites también es amor';
    btn.addEventListener('click', nextScreen);
    screen.querySelector('.card').appendChild(btn);
  }
}

function renderCycle() {
  screen.innerHTML = baseCard({
    eyebrow: 'Cuando sientas culpa',
    title: 'No estás repitiendo la historia. Estás intentando que no te destruya otra vez.',
    lead: 'Lee estas diferencias con calma. No todo límite es abandono.',
    body: `
      <div class="compare-list">
        <div class="compare-item"><div class="wrong"><strong>Dar la espalda</strong><br>es abandonar desde la indiferencia.</div><div class="right"><strong>Poner límites</strong><br>es protegerte desde la conciencia.</div></div>
        <div class="compare-item"><div class="wrong"><strong>Dar la espalda</strong><br>es no importar el dolor del otro.</div><div class="right"><strong>Poner límites</strong><br>es reconocer que también existe tu dolor.</div></div>
        <div class="compare-item"><div class="wrong"><strong>Dar la espalda</strong><br>es actuar sin amor.</div><div class="right"><strong>Poner límites</strong><br>puede doler, pero también puede nacer de la sabiduría, la fe y el amor propio.</div></div>
      </div>
      <p class="lead">Puedes amar a tu mamá sin obedecer cada carga que te imponga. Puedes amar a tus hermanos sin convertirte en su madre. Puedes ser buena sin dejar de cuidarte.</p>`,
    action: 'Necesitaba leer esto'
  });
  screen.querySelector('[data-next]').addEventListener('click', nextScreen);
}

function renderLetter() {
  screen.innerHTML = baseCard({
    eyebrow: 'Carta de Santiago',
    title: 'Lee esto cuando necesites recordar cuánto te amo.',
    lead: 'Desliza dentro de la carta. No hay prisa.',
    body: `
      <div class="letter-box">
        <p>Mi Yoangelis:</p>
        <p>Hice esto para ti porque sé que hay días en los que tu corazón se llena de dudas, culpa y tristeza. Sé que a veces te preguntas si estás haciendo lo correcto, si eres mala por elegir tu paz o si estás fallando por no cargar con responsabilidades que otros quieren poner sobre ti.</p>
        <p>Pero quiero recordarte algo con todo mi amor: tú no eres mala. Tú estás sanando.</p>
        <p>Yo he visto tu proceso. He visto tus días difíciles, tus lágrimas, tus dudas, tus ganas de cambiar y también tu esfuerzo. He visto cómo has luchado para dejar atrás cosas que te hacían daño. He visto esos cinco meses en los que has seguido de pie, aunque no siempre haya sido fácil. Y quiero que entiendas algo: eso vale muchísimo.</p>
        <p>No eres tu pasado. No eres tus errores. No eres las noches oscuras. No eres las personas que no supieron cuidarte. Eres una mujer que está intentando levantarse con la ayuda de Dios, con el amor de Juana, con la memoria hermosa de papá Alcides y con mi amor acompañándote.</p>
        <p>Juana dejó todo en Venezuela por venir a cuidarte, a sostenerte y a salvarte cuando más lo necesitabas. Eso es verdadero amor de madre. Y tú le has dado paz al empezar a cambiar, al cuidarte y al elegir una vida diferente.</p>
        <p>También sé cuánto amas a papá Alcides. Él te amó demasiado. Te crió con amor, con ternura y con valores. Y si hoy pudiera hablarte, sé que te diría que hagas lo que tengas que hacer para cumplir tus metas y tus sueños, porque él quería verte bien, verte fuerte y verte feliz.</p>
        <p>Yo sé que te duele pensar que puedes estar dándole la espalda a tu familia. Pero mi amor, poner límites no es abandonar. Decir “no puedo con esto” no te hace cruel. Reconocer que no puedes hacerte responsable de cargas que no te corresponden no te hace mala hija ni mala hermana. Te hace una persona consciente de que también necesita cuidarse.</p>
        <p>Tú tienes sueños hermosos: tu salón de uñas, tu propio espacio, tu casa, tu carro, tu tranquilidad. Y esos sueños también importan. Dios no puso talento en tus manos para que lo apagaras por culpa. Dios no te levantó para que vuelvas a vivir destruida por responsabilidades que no nacieron contigo.</p>
        <p>Yo estoy contigo. No solo cuando sonríes. También cuando dudas, cuando lloras, cuando tienes miedo y cuando necesitas que alguien te recuerde quién eres. Yo creo en ti. Creo en la mujer que estás construyendo. Creo en tu futuro. Creo en el propósito que Dios tiene para tu vida.</p>
        <p>No te rindas, mi amor. No vuelvas atrás. No sueltes tu proceso. No apagues tus sueños.</p>
        <p>Un día a la vez. Con Dios. Con fe. Con amor. Con límites. Con paz.</p>
        <p class="signature">Siempre voy a apoyarte.<br>Con amor, Santiago.</p>
      </div>`,
    action: 'Guardar esta carta en mi corazón'
  });
  screen.querySelector('[data-next]').addEventListener('click', () => { confetti(70); nextScreen(); });
}

function renderPrayer() {
  screen.innerHTML = baseCard({
    eyebrow: 'Oración',
    title: 'Para cuando tengas miedo.',
    lead: 'Puedes leerla en voz baja, despacio. Dios escucha incluso cuando el corazón tiembla.',
    body: `
      <div class="prayer-box">
        <p>Dios mío:</p>
        <p>Hoy pongo mi corazón en tus manos.</p>
        <p>Ayúdame a entender que no soy mala por cuidar mi paz. Ayúdame a no cargar con culpas que no me pertenecen. Dame sabiduría para tomar decisiones difíciles, fuerza para poner límites y amor para no endurecer mi corazón.</p>
        <p>Señor, guía mis pasos. Cuida mi proceso. Protégeme de volver a caminos que me hicieron daño. Sostén mi vida cuando yo sienta que no puedo más.</p>
        <p>Bendice a mi abuela Juana. Dale paz, descanso y tranquilidad. Gracias por haberla usado como refugio en mi vida. Gracias porque dejó todo en Venezuela para venir a cuidarme cuando más lo necesitaba.</p>
        <p>Honra también la memoria de mi papá Alcides. Gracias por el amor que me dio, por los valores que sembró en mí y por haberme hecho sentir amada cuando más lo necesitaba.</p>
        <p>Ayúdame a construir el futuro que Tú tienes para mí. Mi salón, mi independencia, mi hogar, mi paz y mi propósito están en tus manos.</p>
        <p>No permitas que la culpa me robe lo que Tú estás restaurando.</p>
        <p class="signature">Amén.</p>
      </div>`,
    action: 'Dios está conmigo'
  });
  screen.querySelector('[data-next]').addEventListener('click', () => { confetti(80); nextScreen(); });
}

function renderEmergency() {
  const options = [
    ['Me siento culpable', 'La culpa no siempre dice la verdad. A veces aparece cuando empiezas a poner límites que antes no sabías poner. No eres mala. Estás aprendiendo a cuidarte.'],
    ['Tengo miedo', 'No necesitas resolver toda tu vida hoy. Solo necesitas dar el siguiente paso correcto. Dios no te pide que cargues todo de una vez. Él camina contigo paso a paso.'],
    ['Extraño a papá Alcides', 'El amor de papá Alcides no terminó. Sigue en tus recuerdos, en tus valores, en la niña que él cuidó y en la mujer que estás volviendo a construir. Honras su amor cada vez que eliges sanar.'],
    ['Siento que voy a caer', 'Aléjate de lo que te empuja hacia atrás. Busca a Santiago, busca a Juana, ora, respira, toma agua y espera diez minutos. Una emoción fuerte no tiene que convertirse en una caída. Tú ya resististe cinco meses. Puedes resistir este momento también.'],
    ['Necesito amor', 'Santiago te ama. Juana te ama. Papá Alcides te amó profundamente. Dios te ama incluso en tus días más frágiles. No tienes que ser perfecta para ser amada.'],
    ['Necesito recordar mis sueños', 'Tu salón te espera. Tu paz te espera. Tu futuro te espera. No entregues tus sueños a la culpa. Dios está formando una nueva etapa para ti.']
  ];
  screen.innerHTML = baseCard({
    eyebrow: 'Caja de calma',
    title: 'Abre esto cuando tu corazón se sienta pesado.',
    lead: 'Toca lo que estás sintiendo. Esta caja no juzga; abraza, ordena y te recuerda la verdad.',
    body: `<div class="emergency-grid" id="emergencyGrid"></div>`,
    action: 'Estoy lista para cerrar con una promesa'
  });
  const grid = screen.querySelector('#emergencyGrid');
  options.forEach(([title, msg]) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.type = 'button';
    btn.innerHTML = `<strong>${title}</strong><span>Toca para recibir un mensaje.</span>`;
    btn.addEventListener('click', () => openModal(title, msg, 'Gracias, lo necesitaba'));
    grid.appendChild(btn);
  });
  screen.querySelector('[data-next]').addEventListener('click', () => goTo(screens.length - 1));
}

function renderPromise() {
  const promises = [
    'Prometo cuidar mi paz.',
    'Prometo no olvidar mis sueños.',
    'Prometo caminar con Dios un día a la vez.'
  ];
  const done = progress.promises || [];
  screen.innerHTML = baseCard({
    eyebrow: 'Promesa final',
    title: 'Antes de cerrar esta página, prométeme algo: no te rindas.',
    lead: 'Toca cada promesa. Cuando estén completas, la página guardará un mensaje final para ti.',
    body: `<div class="promise-list" id="promiseList"></div><div id="finalMessage"></div>`,
    next: false
  });
  const list = screen.querySelector('#promiseList');
  const final = screen.querySelector('#finalMessage');
  const check = () => {
    if ((progress.promises || []).length === promises.length) {
      final.innerHTML = `<div class="final-glow">Entonces seguimos. Tú no estás sola.<br>Dios va delante, papá Alcides vive en tu corazón, Juana camina contigo y yo, Santiago, voy a seguir apoyándote.<br><br>Te amo, Yoangelis. Tu historia no terminó. Tu historia está sanando.</div>`;
      confetti(110);
    }
  };
  promises.forEach((text, i) => {
    const btn = document.createElement('button');
    btn.className = `promise-btn ${done.includes(i) ? 'done' : ''}`;
    btn.type = 'button';
    btn.textContent = done.includes(i) ? `✓ ${text}` : text;
    btn.addEventListener('click', () => {
      if (!progress.promises) progress.promises = [];
      if (!progress.promises.includes(i)) progress.promises.push(i);
      btn.classList.add('done');
      btn.textContent = `✓ ${text}`;
      saveProgress();
      haptic([20, 30, 20]);
      check();
    });
    list.appendChild(btn);
  });
  check();
}

function goTo(index) {
  current = Math.max(0, Math.min(screens.length - 1, index));
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  render();
}

function nextScreen() { goTo(current + 1); }
function prevScreen() { goTo(current - 1); }

function render() {
  const active = screens[current];
  progress.lastScreen = current;
  saveProgress();
  progressBar.style.width = `${((current + 1) / screens.length) * 100}%`;
  backBtn.disabled = current === 0;
  active.render();
  screen.querySelectorAll('[data-next]').forEach(btn => btn.addEventListener('click', nextScreen, { once: true }));
}

backBtn.addEventListener('click', prevScreen);
homeBtn.addEventListener('click', () => goTo(0));
emergencyBtn.addEventListener('click', () => goTo(screens.findIndex(s => s.id === 'emergency')));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

goTo(progress.lastScreen || 0);
