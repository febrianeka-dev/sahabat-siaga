// Sahabat Siaga V1 — browser-only educational interactions.
// Survey-map-derived points/corridors below are approximate, never operational navigation data.
(function () {
  'use strict';

  const ROUTES = ['beranda', 'belajar', 'anak', 'peta', 'bersaudara', 'panduan', 'riset'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const safeLoad = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
  };
  const safeSave = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} };
  let leafletMap = null;
  let currentRoute = 'beranda';

  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.hidden = true, 3200);
  }

  function navigate(route, target) {
    if (!ROUTES.includes(route)) route = 'beranda';
    currentRoute = route;
    $$('.view').forEach(view => view.hidden = view.dataset.view !== route);
    $$('[data-route]').forEach(btn => {
      const active = btn.dataset.route === route;
      btn.classList.toggle('active', active);
      if (btn.matches('.nav-link, .bottom-nav button')) {
        if (active) btn.setAttribute('aria-current', 'page');
        else btn.removeAttribute('aria-current');
      }
    });
    $('#mobile-menu').hidden = true;
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
    if (location.hash !== '#' + route) history.replaceState(null, '', '#' + route);
    document.title = ({beranda:'Beranda', belajar:'Belajar Siaga', anak:'Pojok Anak', peta:'Peta Edukasi', bersaudara:'Desa Bersaudara', panduan:'Panduan Khusus', riset:'Data Penelitian'})[route] + ' — Sahabat Siaga';
    if (route === 'peta') setTimeout(initMap, 80);
    if (target) setTimeout(() => document.getElementById(target)?.scrollIntoView({behavior:'smooth', block:'start'}), 50);
    else window.scrollTo({top:0, behavior:'instant'});
  }

  $$('[data-route]').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route, btn.dataset.scrollTarget)));
  window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
  $('#menu-toggle').addEventListener('click', () => {
    const menu = $('#mobile-menu');
    menu.hidden = !menu.hidden;
    $('#menu-toggle').setAttribute('aria-expanded', String(!menu.hidden));
  });
  navigate(location.hash.slice(1) || 'beranda');

  // Accessibility settings apply to rem-based content site-wide and survive reloads.
  const textSizes = [100, 115, 130, 150];
  const savedSize = Number(safeLoad('siaga_text_ukuran', safeLoad('siaga_text_besar', false) ? 115 : 100));
  let textSize = textSizes.includes(savedSize) ? savedSize : 100;
  let highContrast = safeLoad('siaga_kontras', false) === true;
  const textPanel = $('#text-size-panel');
  const textToggle = $('#size-toggle');

  function updateAccessibility() {
    document.documentElement.style.setProperty('--text-scale', String(textSize / 100));
    document.documentElement.dataset.textSize = String(textSize);
    document.body.classList.toggle('high-contrast', highContrast);
    $('#text-size-value').textContent = `${textSize}%`;
    $('#text-smaller').disabled = textSize === textSizes[0];
    $('#text-larger').disabled = textSize === textSizes[textSizes.length - 1];
    $('#text-reset').disabled = textSize === 100;
    textToggle.title = `Ukuran tulisan ${textSize}% — buka pengaturan`;
    $('#contrast-toggle').setAttribute('aria-pressed', String(highContrast));
    $('#contrast-toggle').setAttribute('aria-label', highContrast ? 'Nonaktifkan kontras tinggi' : 'Aktifkan kontras tinggi');
    $('#contrast-toggle').title = highContrast ? 'Nonaktifkan kontras tinggi' : 'Aktifkan kontras tinggi';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', highContrast ? '#ffffff' : '#21483d');
    if (leafletMap) setTimeout(() => leafletMap.invalidateSize(), 60);
  }

  function setTextSize(value) {
    if (!textSizes.includes(value) || textSize === value) return;
    textSize = value;
    safeSave('siaga_text_ukuran', textSize);
    updateAccessibility();
    showToast(`Ukuran tulisan ${textSize}%`);
  }

  function closeTextPanel(restoreFocus = false) {
    textPanel.hidden = true;
    textToggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) textToggle.focus();
  }

  textToggle.addEventListener('click', () => {
    textPanel.hidden = !textPanel.hidden;
    textToggle.setAttribute('aria-expanded', String(!textPanel.hidden));
  });
  $('#text-smaller').addEventListener('click', () => setTextSize(textSizes[Math.max(0, textSizes.indexOf(textSize) - 1)]));
  $('#text-larger').addEventListener('click', () => setTextSize(textSizes[Math.min(textSizes.length - 1, textSizes.indexOf(textSize) + 1)]));
  $('#text-reset').addEventListener('click', () => setTextSize(100));
  document.addEventListener('click', event => { if (!$('#text-size-widget').contains(event.target)) closeTextPanel(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !textPanel.hidden) closeTextPanel(true); });
  $('#contrast-toggle').addEventListener('click', () => {
    highContrast = !highContrast;
    safeSave('siaga_kontras', highContrast);
    updateAccessibility();
    showToast(highContrast ? 'Kontras tinggi aktif' : 'Kontras normal');
  });
  updateAccessibility();

  // Real documentary photos from explicitly public-domain USGS media records.
  // The original source page remains linked beside every photograph. These
  // examples show other volcanoes and must never be presented as Semeru photos.
  const hazardPhotoSets = [
    [
      {
        file: 'apg-st-helens-aug-1980.webp',
        portrait: true,
        title: 'Aliran piroklastik saat erupsi',
        context: 'Gunung St. Helens, AS · 7 Agustus 1980',
        credit: 'Peter W. Lipman / USGS',
        alt: 'Foto dokumenter aliran piroklastik yang menuruni lereng Gunung St. Helens.',
        source: 'https://www.usgs.gov/media/images/pyroclastic-flow-aug-7-1980-eruption-stretches-moun'
      },
      {
        file: 'apg-st-helens-may-1980.webp',
        title: 'Arus piroklastik di sekitar kawah',
        context: 'Gunung St. Helens, AS · 18 Mei 1980',
        credit: 'J. G. Rosenbaum / USGS',
        alt: 'Foto erupsi Gunung St. Helens dengan arus piroklastik yang melewati bibir kawah.',
        source: 'https://www.usgs.gov/media/images/may-18-1980-eruption-mount-st-helens'
      }
    ],
    [
      {
        file: 'lahar-muddy-river-1980.webp',
        title: 'Bekas tinggi aliran lahar',
        context: 'Muddy River, St. Helens · lahar akibat erupsi 1980',
        credit: 'Cascades Volcano Observatory / USGS',
        alt: 'Bekas lumpur lahar pada batang pohon di tepi Muddy River, dengan seorang peneliti sebagai skala.',
        source: 'https://www.usgs.gov/media/images/lahar'
      },
      {
        file: 'lahar-toutle-bridge-1980.webp',
        title: 'Kerusakan jembatan akibat lahar',
        context: 'Sungai Toutle, St. Helens · lahar akibat erupsi 1980',
        credit: 'Richard Waitt / USGS',
        alt: 'Jembatan di North Fork Toutle River yang rusak akibat aliran lahar.',
        source: 'https://www.usgs.gov/media/images/mount-st-helens-lahar'
      }
    ],
    [
      {
        file: 'ash-hilo-2026.webp',
        portrait: true,
        title: 'Endapan abu di kawasan perkotaan',
        context: 'Hilo, dampak erupsi Kīlauea · 10 Maret 2026',
        credit: 'Hawaiian Volcano Observatory / USGS',
        alt: 'Endapan abu vulkanik di Hilo setelah aktivitas erupsi Gunung Kīlauea.',
        source: 'https://www.usgs.gov/media/images/march-10-2026-kilauea-episode-43-ashfall-hilo'
      },
      {
        file: 'ash-nikiski-2009.webp',
        title: 'Abu vulkanik menutupi kendaraan',
        context: 'Nikiski, dampak erupsi Redoubt · 2009',
        credit: 'Kristi L. Wallace / USGS',
        alt: 'Lapisan abu vulkanik dari Gunung Redoubt menumpuk di permukaan kendaraan.',
        source: 'https://www.usgs.gov/media/images/ash-fall-accumulation-redoubt-volcano-nikiski-after-march-28-2009-eruption-plume'
      }
    ],
    [
      {
        file: 'lava-kilauea-tube.webp',
        title: 'Lava cair yang masih berpijar',
        context: 'Lereng selatan Gunung Kīlauea, Hawaii',
        credit: 'Jeffrey Judd / USGS',
        alt: 'Lava cair berpijar merah mengalir di antara batuan lava yang sudah mengeras.',
        source: 'https://www.usgs.gov/media/images/kilauea-lava-flow-1'
      },
      {
        file: 'lava-kilauea-fissure-2018.webp',
        title: 'Aliran lava dari rekahan gunung',
        context: 'Fissure 8, Kīlauea · 14 Juni 2018',
        credit: 'Hawaiian Volcano Observatory / USGS',
        alt: 'Rekahan Fissure 8 di Kīlauea mengeluarkan aliran lava dari kawah kecil.',
        source: 'https://www.usgs.gov/media/images/kilauea-volcano-fissure-8-cone-building'
      }
    ],
    [
      {
        file: 'gas-kilauea-vent-2010.webp',
        title: 'Emisi dari ventilasi vulkanik',
        context: 'Lereng Gunung Kīlauea · 25 Februari 2010',
        credit: 'USGS Volcano Hazards Program',
        alt: 'Uap dan gas tampak keluar dari beberapa ventilasi pada medan lava Gunung Kīlauea.',
        source: 'https://www.usgs.gov/media/images/fume-volcanic-vent'
      },
      {
        file: 'gas-halemaumau-plume.webp',
        title: 'Kepulan gas dari kawah aktif',
        context: 'Kawah Halemaʻumaʻu, Kīlauea, Hawaii',
        credit: 'Tim R. Orr / USGS',
        alt: 'Kepulan gas vulkanik terlihat di atas ventilasi kawah Halemaʻumaʻu.',
        source: 'https://www.usgs.gov/media/images/halemaumau-vent-gas-plume-1'
      }
    ]
  ];

  $$('.detailed-hazards .hazard-card').forEach((card, hazardIndex) => {
    const photos = hazardPhotoSets[hazardIndex];
    const body = $('.hazard-body', card);
    if (!body || !photos) return;

    const gallery = document.createElement('div');
    gallery.className = 'hazard-photo-gallery';
    const heading = document.createElement('div');
    heading.className = 'hazard-photo-heading';
    const headingTitle = document.createElement('strong');
    headingTitle.textContent = 'FOTO DOKUMENTASI NYATA';
    const headingNote = document.createElement('span');
    headingNote.textContent = 'Contoh dari gunung api lain, bukan foto Semeru · geser foto di ponsel';
    heading.append(headingTitle, headingNote);

    const list = document.createElement('div');
    list.className = 'hazard-photo-list';
    photos.forEach(photo => {
      const figure = document.createElement('figure');
      figure.className = 'hazard-photo';
      const img = document.createElement('img');
      img.src = `assets/hazards/${photo.file}`;
      if (photo.portrait) img.classList.add('portrait');
      img.alt = photo.alt;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 720;
      img.height = 450;

      const caption = document.createElement('figcaption');
      const title = document.createElement('strong');
      title.textContent = photo.title;
      const context = document.createElement('span');
      context.textContent = photo.context;
      const credit = document.createElement('small');
      credit.textContent = `Foto: ${photo.credit}`;
      const source = document.createElement('a');
      source.href = photo.source;
      source.target = '_blank';
      source.rel = 'noopener noreferrer';
      source.textContent = 'Lihat sumber & izin Domain Publik ↗';
      caption.append(title, context, credit, source);
      figure.append(img, caption);
      list.append(figure);
    });
    gallery.append(heading, list);
    body.prepend(gallery);
  });

  // Illustrated, child-friendly DO & DON'T panels. The original safety copy in
  // index.html stays available as a readable fallback if JavaScript is off.
  const hazardActionGuides = [
    {
      yes: {
        title: 'Dengarkan, menjauh, saling menjaga!',
        scene: ['📢', '👨‍👩‍👧', '🏡'],
        steps: [
          ['📢', 'Ikuti perintah evakuasi', 'Berangkat sebelum awan panas mendekat.'],
          ['🗺️', 'Jauhi lembah dan sungai', 'Gunakan jalur aman yang ditetapkan petugas.'],
          ['🤝', 'Temani keluarga', 'Bantu anak, lansia, ibu hamil, dan penyandang disabilitas.']
        ]
      },
      no: {
        title: 'Jangan menjadi penonton bahaya.',
        scene: ['🌋', '📸', '⏳'],
        steps: [
          ['📸', 'Jangan melihat dari dekat', 'Awan panas sangat cepat dan berbahaya.'],
          ['⏳', 'Jangan menunggu awan panas terlihat', 'Ikuti arahan evakuasi sebelum bahaya datang.']
        ]
      }
    },
    {
      yes: {
        title: 'Saat ada peringatan lahar, jauhi sungai!',
        scene: ['🌧️', '📢', '🏡'],
        steps: [
          ['🌧️', 'Dengarkan peringatan hujan', 'Hujan di hulu sungai juga perlu diwaspadai.'],
          ['🏞️', 'Menjauh dari aliran sungai', 'Hindari bantaran dan jembatan yang ditutup.'],
          ['🧭', 'Ikuti rute yang diarahkan petugas', 'Gunakan lokasi perlindungan dan jalur alternatif yang aman.']
        ]
      },
      no: {
        title: 'Jangan melawan arus lahar.',
        scene: ['🌊', '🌉', '📱'],
        steps: [
          ['🌉', 'Jangan menyeberangi aliran lahar', 'Air dan materialnya dapat membawa batu besar dan merusak jembatan.'],
          ['📱', 'Jangan merekam dari tepi sungai', 'Tetap menjauh, bukan mendekat untuk menonton.']
        ]
      }
    },
    {
      yes: {
        title: 'Berlindung dan jaga pernapasan.',
        scene: ['🏠', '🪟', '😷'],
        steps: [
          ['🏠', 'Masuk ke bangunan yang aman', 'Kurangi kegiatan di luar saat hujan abu.'],
          ['🪟', 'Tutup pintu dan jendela', 'Lindungi air minum dan makanan dari abu.'],
          ['😷', 'Lindungi diri jika harus keluar', 'Gunakan pelindung partikulat yang pas dan kacamata; utamakan kelompok rentan untuk menghindari paparan.']
        ]
      },
      no: {
        title: 'Jangan mengambil risiko di luar.',
        scene: ['🌫️', '🛵', '🪜'],
        steps: [
          ['🛵', 'Jangan berkendara saat pandangan buruk', 'Abu dapat menghalangi pandangan dan membuat jalan licin.'],
          ['🪜', 'Jangan naik ke atap sendiri', 'Atap yang tertimbun abu dapat berbahaya.']
        ]
      }
    },
    {
      yes: {
        title: 'Jaga jarak dari material panas.',
        scene: ['🚧', '🏡', '📢'],
        steps: [
          ['🚧', 'Tetap di luar zona larangan', 'Jauhi kawasan puncak dan lereng yang dilarang petugas.'],
          ['📢', 'Patuhi penutupan jalur', 'Jangan masuk ke jalan atau jalur pendakian yang ditutup.'],
          ['🤝', 'Ingatkan keluarga', 'Tetap bersama pendamping di area yang aman.']
        ]
      },
      no: {
        title: 'Jangan mendekati pijaran.',
        scene: ['🔥', '📸', '🪨'],
        steps: [
          ['📸', 'Jangan berfoto dekat lava', 'Material panas tidak aman untuk didekati.'],
          ['🪨', 'Jangan menyentuh material pijar', 'Batuan yang panas dapat menyebabkan luka bakar.']
        ]
      }
    },
    {
      yes: {
        title: 'Menjauh saat ada peringatan gas.',
        scene: ['🚧', '🧭', '🏥'],
        steps: [
          ['🚧', 'Jauhi kawah dan area terlarang', 'Ikuti batas aman yang ditentukan petugas.'],
          ['🧭', 'Segera menjauh sesuai arahan', 'Patuhi peringatan gas dan petunjuk petugas.'],
          ['🏥', 'Cari bantuan bila sulit bernapas', 'Beri tahu pendamping atau petugas dan cari pertolongan kesehatan.']
        ]
      },
      no: {
        title: 'Jangan menebak dari bau atau asap.',
        scene: ['🌫️', '👃', '😷'],
        steps: [
          ['👃', 'Jangan mengandalkan bau', 'Gas berbahaya tidak selalu tercium atau terlihat.'],
          ['😷', 'Jangan mengandalkan masker debu', 'Masker partikulat tidak melindungi dari semua gas beracun.']
        ]
      }
    }
  ];

  function makeIllustratedActionPanel(type, guide, hazardIndex) {
    const good = type === 'yes';
    const panel = document.createElement('section');
    panel.className = `action-panel ${good ? 'action-do' : 'action-dont'}`;
    panel.setAttribute('aria-label', good ? 'DO: langkah aman' : "DON'T: hal yang harus dihindari");

    const top = document.createElement('div');
    top.className = 'action-panel-top';
    const copy = document.createElement('div');
    copy.className = 'action-intro';
    const label = document.createElement('span');
    label.className = 'action-pill';
    label.textContent = good ? '✓ DO · YUK, LAKUKAN!' : "✕ DON'T · JANGAN, YA!";
    const title = document.createElement('h4');
    title.id = `hazard-action-${hazardIndex}-${type}`;
    title.textContent = guide.title;
    panel.setAttribute('aria-labelledby', title.id);
    copy.append(label, title);

    const scene = document.createElement('div');
    scene.className = 'action-scene';
    scene.setAttribute('aria-hidden', 'true');
    guide.scene.forEach((symbol, index) => {
      const sticker = document.createElement('span');
      sticker.className = `action-scene-emoji sticker-${index + 1}`;
      sticker.textContent = symbol;
      scene.append(sticker);
    });
    const badge = document.createElement('span');
    badge.className = 'action-scene-mark';
    badge.textContent = good ? '✓' : '✕';
    scene.append(badge);
    top.append(copy, scene);

    const steps = document.createElement('ul');
    steps.className = 'action-step-list';
    guide.steps.forEach(([symbol, heading, explanation]) => {
      const item = document.createElement('li');
      item.className = 'action-step';
      const picture = document.createElement('span');
      picture.className = 'action-step-picture';
      picture.setAttribute('aria-hidden', 'true');
      picture.textContent = symbol;
      const text = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = heading;
      const description = document.createElement('p');
      description.textContent = explanation;
      text.append(strong, description);
      item.append(picture, text);
      steps.append(item);
    });
    panel.append(top, steps);
    return panel;
  }

  $$('.detailed-hazards .hazard-card').forEach((card, index) => {
    const guide = hazardActionGuides[index];
    const oldDo = $('.hazard-do', card);
    const oldDont = $('.hazard-dont', card);
    if (!guide || !oldDo || !oldDont) return;
    const pair = document.createElement('div');
    pair.className = 'hazard-action-pair';
    const marker = document.createElement('div');
    marker.className = 'hazard-action-heading';
    marker.textContent = 'PILIH YANG AMAN · DO & DON’TS';
    pair.append(
      marker,
      makeIllustratedActionPanel('yes', guide.yes, index),
      makeIllustratedActionPanel('no', guide.no, index)
    );
    oldDo.replaceWith(pair);
    oldDont.remove();
  });

  // Preparedness checklist.
  const bagItems = [
    'Air minum dan makanan praktis', 'Obat pribadi dan perlengkapan kesehatan',
    'Salinan dokumen penting', 'Senter dan baterai',
    'Peluit dan alat komunikasi', 'Pakaian dan kebutuhan kebersihan',
    'Kebutuhan khusus bayi, ibu hamil, lansia, atau disabilitas',
    'Daftar kontak darurat dan informasi keluarga'
  ];
  let checkedBag = safeLoad('siaga_tas_keluarga', []);
  if (!Array.isArray(checkedBag)) checkedBag = [];
  function renderBag() {
    $('#bag-checklist').replaceChildren();
    bagItems.forEach((item, index) => {
      const label = document.createElement('label');label.className='checklist-row';
      const input = document.createElement('input');input.type='checkbox';input.checked=checkedBag.includes(index);
      input.setAttribute('aria-label',item);
      const span = document.createElement('span');span.textContent=item;
      input.addEventListener('change', () => {checkedBag = input.checked?[...checkedBag,index]:checkedBag.filter(i=>i!==index);safeSave('siaga_tas_keluarga',checkedBag);renderBag();});
      label.append(input,span);$('#bag-checklist').append(label);
    });
    $('#bag-progress-text').textContent=`${checkedBag.length} dari ${bagItems.length} siap`;
    $('#bag-progress').style.width=`${checkedBag.length/bagItems.length*100}%`;
  }
  $('#reset-checklist').addEventListener('click', () => {checkedBag=[];safeSave('siaga_tas_keluarga',checkedBag);renderBag();showToast('Checklist diulang.');});
  renderBag();

  // Learning flipcards: intentionally illustration-led and low stakes.
  const flips = [
    {front:'Apa itu abu vulkanik?',icon:'☁️',back:'Material halus dari erupsi. Dengarkan orang dewasa dan lindungi diri sesuai arahan.'},
    {front:'Siapa yang harus didengar?',icon:'📢',back:'Dengarkan orang dewasa pendamping dan petugas resmi saat ada peringatan.'},
    {front:'Untuk apa tas siaga?',icon:'🎒',back:'Membawa barang penting yang sudah disiapkan bersama keluarga.'},
    {front:'Saat hujan dan ada bahaya lahar?',icon:'🌧️',back:'Jangan bermain di sungai berbahaya. Ikuti arahan petugas.'},
    {front:'Jika teman membutuhkan bantuan?',icon:'🤝',back:'Panggil orang dewasa atau petugas. Jangan masuk ke tempat berbahaya.'},
    {front:'Ke mana saat mengungsi?',icon:'🏠',back:'Ke lokasi aman yang diarahkan petugas bersama pendamping.'}
  ];
  flips.forEach((item,index) => {
    const btn=document.createElement('button');btn.className='flip-card';btn.type='button';btn.setAttribute('aria-pressed','false');btn.setAttribute('aria-label',`Kartu ${index+1}: ${item.front}. Ketuk untuk membalik.`);
    btn.innerHTML=`<span class="flip-inner"><span class="flip-face flip-front"><span class="flip-symbol" aria-hidden="true">${item.icon}</span><strong>${item.front}</strong><small>Ketuk untuk lihat jawabannya ↻</small></span><span class="flip-face flip-back"><span class="flip-symbol" aria-hidden="true">✦</span><strong>${item.front}</strong><p>${item.back}</p></span></span>`;
    btn.addEventListener('click',()=>{const flipped=btn.classList.toggle('flipped');btn.setAttribute('aria-pressed',String(flipped));btn.setAttribute('aria-label',flipped?`${item.front} ${item.back} Ketuk lagi untuk membalik.`:`${item.front}. Ketuk untuk membalik.`);});
    $('#flip-grid').append(btn);
  });

  const questions=[
    {q:'Saat petugas meminta warga mengungsi, apa yang harus dilakukan?',choices:['Mengikuti pendamping dan petugas menuju tempat aman','Mendekati gunung untuk melihat erupsi','Pergi sendiri tanpa memberi tahu keluarga'],correct:0,explanation:'Hebat! Selalu ikut arahan petugas dan tetap bersama pendamping.'},
    {q:'Barang apa yang penting ada di tas siaga?',choices:['Batu dari halaman','Air minum, senter, dan kebutuhan kesehatan','Mainan sebanyak-banyaknya'],correct:1,explanation:'Benar! Tas siaga berisi kebutuhan utama. Siapkan bersama orang dewasa.'},
    {q:'Saat ada peringatan bahaya lahar, bolehkah bermain di sungai?',choices:['Boleh kalau airnya jernih','Boleh jika bersama banyak teman','Tidak, kita harus menjauhi sungai berbahaya'],correct:2,explanation:'Tepat! Lahar bisa mengalir mengikuti sungai, jadi jauhi area berbahaya.'},
    {q:'Kalau teman kesulitan saat mengungsi, apa langkah yang aman?',choices:['Memanggil orang dewasa atau petugas untuk membantu','Membiarkannya tanpa memberi tahu siapa pun','Masuk sendirian ke tempat berbahaya'],correct:0,explanation:'Bagus! Meminta bantuan kepada petugas adalah tindakan yang tepat.'},
    {q:'Siapa yang sebaiknya menemanimu saat mengungsi?',choices:['Tidak perlu pendamping','Orang dewasa yang dikenal dan dipercaya keluarga','Siapa saja tanpa memberi tahu keluarga'],correct:1,explanation:'Tetap bersama pendamping yang disepakati keluarga agar tidak terpisah.'},
    {q:'Apa yang dilakukan jika jalur ditutup petugas?',choices:['Menerobos agar lebih cepat','Mengikuti teman yang menyeberangi sungai','Mengikuti jalur alternatif yang diarahkan petugas'],correct:2,explanation:'Penutupan jalan bertujuan melindungi kita. Ikuti arahan petugas bersama pendamping.'},
    {q:'Apa yang dilakukan jika terpisah dari keluarga di pengungsian?',choices:['Mencari petugas atau pos resmi di tempat aman','Pergi jauh sendirian untuk mencari rumah','Kembali ke kawasan bahaya'],correct:0,explanation:'Minta bantuan petugas di tempat aman untuk menghubungi keluarga. Jangan pergi sendiri ke kawasan bahaya.'},
    {q:'Kapan tas siaga sebaiknya disiapkan?',choices:['Setelah bahaya sangat dekat','Sebelum keadaan darurat, bersama keluarga','Saat semua orang sudah berangkat'],correct:1,explanation:'Siapkan lebih awal bersama keluarga supaya tidak menunda keberangkatan saat diminta mengungsi.'},
    {q:'Saat hujan abu, pilihan mana yang lebih aman?',choices:['Bermain di luar untuk melihat abu','Mengusap mata dengan tangan berdebu','Mengurangi kegiatan di luar dan mengikuti arahan pendamping'],correct:2,explanation:'Abu dapat mengganggu mata dan pernapasan. Kurangi paparan dan ikuti arahan orang dewasa.'},
    {q:'Apa yang sebaiknya dilakukan setelah tiba di pengungsian?',choices:['Bersama pendamping melapor kepada pengelola pos','Langsung pergi menjelajah sendirian','Menyembunyikan kebutuhan bantuan dari petugas'],correct:0,explanation:'Pendataan membantu petugas mengetahui keberadaan keluarga dan bantuan yang diperlukan.'},
    {q:'Apakah boleh kembali ke rumah hanya karena hujan sudah berhenti?',choices:['Boleh, asalkan bersama teman','Tunggu izin petugas dan tetap bersama pendamping','Boleh, tanpa memberi tahu siapa pun'],correct:1,explanation:'Cuaca yang membaik belum berarti kawasan aman. Kembali hanya setelah diizinkan petugas.'},
    {q:'Mengapa warga perlu latihan evakuasi bersama?',choices:['Supaya bisa berlomba berlari paling cepat','Supaya tidak perlu mendengar petugas lagi','Agar mengenal pendamping, jalur, dan titik kumpul yang disepakati'],correct:2,explanation:'Latihan membantu keluarga memahami peran masing-masing dan kebutuhan bantuan sebelum keadaan darurat.'}

  ];
  let questionIndex=0, selectedAnswer=-1, score=0;
  function renderQuiz(focusHeading=false) {
    $('#quiz-count').textContent=questionIndex<questions.length?`${questionIndex+1} / ${questions.length}`:'Selesai!';
    $('#quiz-progress').style.width=`${(questionIndex+(selectedAnswer<0?0:1))/questions.length*100}%`;
    const root=$('#quiz-content');root.replaceChildren();
    if(questionIndex>=questions.length){
      const end=document.createElement('div');end.className='quiz-finish';end.innerHTML=`<div class="trophy" aria-hidden="true">🏅</div><h3>Keren, Sahabat Kecil!</h3><p>Skor kamu: <strong>${score} dari ${questions.length}</strong>. Terus belajar bersama keluarga, ya!</p>`;
      const again=document.createElement('button');again.className='button primary';again.textContent='Main lagi ↺';again.addEventListener('click',()=>{questionIndex=0;selectedAnswer=-1;score=0;renderQuiz(true);});end.append(again);root.append(end);const title=$('h3',end);title.tabIndex=-1;if(focusHeading)title.focus({preventScroll:true});return;
    }
    const q=questions[questionIndex];const heading=document.createElement('h3');heading.className='quiz-question';heading.textContent=q.q;heading.tabIndex=-1;root.append(heading);if(focusHeading)heading.focus({preventScroll:true});
    const options=document.createElement('div');options.className='quiz-options';
    q.choices.forEach((answer,index)=>{
      const btn=document.createElement('button');btn.className='quiz-option';btn.textContent=String.fromCharCode(65+index)+'. '+answer;
      if(selectedAnswer>=0){btn.disabled=true;if(index===q.correct)btn.classList.add('correct');else if(index===selectedAnswer)btn.classList.add('wrong');}
      btn.addEventListener('click',()=>{if(selectedAnswer>=0)return;selectedAnswer=index;if(index===q.correct)score++;renderQuiz();$('.quiz-next',root)?.focus({preventScroll:true});});options.append(btn);
    });root.append(options);
    if(selectedAnswer>=0){const note=document.createElement('div');note.className='quiz-explanation';note.setAttribute('role','status');note.textContent=(selectedAnswer===q.correct?'★ Benar! ':'Yuk belajar lagi. ')+q.explanation;root.append(note);const next=document.createElement('button');next.className='button primary quiz-next';next.textContent=questionIndex===questions.length-1?'Lihat hasil →':'Lanjut soal →';next.addEventListener('click',()=>{questionIndex++;selectedAnswer=-1;renderQuiz(true);});root.append(next);}
  }
  renderQuiz();

  // Drag-free packing game, accessible by touch, mouse and keyboard.
  const packingItems=[
    {name:'Air minum',icon:'💧',needed:true},{name:'Obat pribadi',icon:'💊',needed:true},
    {name:'Senter',icon:'🔦',needed:true},{name:'Dokumen',icon:'🪪',needed:true},
    {name:'Peluit',icon:'📣',needed:true},{name:'Pakaian',icon:'👕',needed:true},
    {name:'Pot bunga',icon:'🪴',needed:false},{name:'Batu besar',icon:'🪨',needed:false}
  ];
  let chosenPacking=new Set();
  function renderPacking(){
    $('#packing-grid').replaceChildren();
    packingItems.forEach((item,index)=>{
      const btn=document.createElement('button');btn.className='packing-item';btn.setAttribute('aria-pressed',String(chosenPacking.has(index)));
      btn.innerHTML=`<span aria-hidden="true">${item.icon}</span><strong>${item.name}</strong>`;
      if(chosenPacking.has(index))btn.classList.add('selected');
      btn.addEventListener('click',()=>{if(chosenPacking.has(index))chosenPacking.delete(index);else chosenPacking.add(index);renderPacking();});
      $('#packing-grid').append(btn);
    });
    const correct=[...chosenPacking].filter(i=>packingItems[i].needed).length;
    const extras=[...chosenPacking].filter(i=>!packingItems[i].needed).length;
    $('#packing-counter').textContent=`${correct} dari 6 barang penting`;
    $('#packing-result').textContent=correct===6&&!extras?'🎉 Hebat! Semua barang contoh yang penting sudah dipilih. Minta orang dewasa membantu menyiapkan tas sungguhan.':extras?'Ada barang yang bukan kebutuhan utama. Coba pilih perlengkapan yang lebih penting, ya!':'Pilih barang penting untuk dibawa. '+(6-correct)+' barang penting lagi bisa ditemukan.';
  }
  $('#packing-reset').addEventListener('click',()=>{chosenPacking=new Set();renderPacking();});
  renderPacking();

  // Action-sorting game: no timer, no score penalty, keyboard and touch controls.
  const actionCards=[
    {icon:'🤝',title:'Tetap bersama pendamping',text:'Saat mengungsi, aku mengikuti pendamping dan arahan petugas.',safe:true,why:'Tetap bersama pendamping membantu kita saling menjaga.'},
    {icon:'🌊',title:'Menonton dari tepi sungai',text:'Saat ada peringatan lahar, aku pergi ke tepi sungai untuk menontonnya.',safe:false,why:'Jauhi sungai yang diperingatkan berbahaya. Lahar dapat mengalir melalui sungai.'},
    {icon:'🎒',title:'Bersiap bersama keluarga',text:'Aku menyiapkan tas siaga bersama orang dewasa sebelum ada keadaan darurat.',safe:true,why:'Persiapan bersama keluarga membantu kita siap saat harus mengungsi.'},
    {icon:'⛔',title:'Mencari jalan pintas',text:'Aku melewati jalan yang ditutup petugas supaya lebih cepat sampai.',safe:false,why:'Jalan ditutup untuk keselamatan. Ikuti jalur yang diarahkan petugas bersama pendamping.'},
    {icon:'🙋',title:'Meminta bantuan',text:'Temanku kesulitan berjalan. Aku memanggil orang dewasa atau petugas untuk membantu.',safe:true,why:'Meminta bantuan orang dewasa atau petugas adalah cara yang tepat untuk menolong.'},
    {icon:'📷',title:'Mendekati gunung',text:'Aku mendekati kawasan gunung yang dilarang petugas untuk mengambil foto.',safe:false,why:'Jangan memasuki kawasan terlarang. Foto tidak lebih penting daripada keselamatan.'}
  ];
  let actionDeck=[],actionIndex=0,actionSolved=false;
  function startActionGame(){
    actionDeck=[...actionCards];
    for(let i=actionDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[actionDeck[i],actionDeck[j]]=[actionDeck[j],actionDeck[i]];}
    actionIndex=0;actionSolved=false;renderActionGame();
  }
  function renderActionGame(focus=false){
    const finished=actionIndex===actionDeck.length;
    const completed=actionIndex+(actionSolved?1:0);
    $('#action-count').textContent=completed+' / 6 kartu selesai';
    $('#action-stars').innerHTML='<span aria-hidden="true">'+Array.from({length:6},(_,i)=>i<completed?'★':'☆').join(' ')+'</span>';
    $('#action-stars').setAttribute('aria-label',completed+' dari 6 bintang');
    $('#action-progress').setAttribute('aria-valuenow',String(completed));
    $('#action-progress-fill').style.width=(completed/6*100)+'%';
    $('#action-choices').hidden=finished;
    $('#action-next').hidden=!actionSolved||finished;
    $('#action-replay').hidden=!finished;
    ['#action-safe','#action-avoid'].forEach(id=>{$(id).disabled=actionSolved;});
    const area=$('#action-card-area');
    if(finished){
      area.innerHTML='<div class="siaga-game-scene action-finish"><span class="siaga-game-scene-icon" aria-hidden="true">🏅</span><h3 id="action-heading" tabindex="-1">Enam bintang untukmu!</h3><p>Semua kartu berhasil dipilah. Kamu hebat karena terus mencoba!</p><p>Ceritakan satu tindakan siaga kepada keluarga, ya.</p></div>';
      $('#action-feedback').textContent='Misi selesai! Terus belajar bersama orang dewasa dan ikuti arahan petugas.';
    }else{
      const card=actionDeck[actionIndex];
      area.innerHTML='<div class="siaga-game-scene"><span class="siaga-game-scene-icon" aria-hidden="true">'+card.icon+'</span><span class="action-card-label">KARTU '+(actionIndex+1)+' DARI 6</span><h3 id="action-heading" tabindex="-1">'+card.title+'</h3><p>'+card.text+'</p></div>';
      $('#action-feedback').textContent='Menurutmu, tindakan ini boleh dilakukan atau harus dihindari?';
    }
    if(focus)$('#action-heading').focus({preventScroll:true});
  }
  function chooseAction(isSafe){
    if(actionSolved||actionIndex>=actionDeck.length)return;
    const card=actionDeck[actionIndex];
    if(card.safe!==isSafe){
      $('#action-feedback').textContent='Yuk, coba lagi. '+card.why;
      return;
    }
    actionSolved=true;renderActionGame();
    $('#action-feedback').textContent='★ Tepat! '+card.why;
    $('#action-next').textContent=actionIndex===5?'Lihat bintangku →':'Kartu berikutnya →';
    $('#action-next').focus({preventScroll:true});
  }
  $('#action-safe').addEventListener('click',()=>chooseAction(true));
  $('#action-avoid').addEventListener('click',()=>chooseAction(false));
  $('#action-next').addEventListener('click',()=>{if(!actionSolved)return;actionIndex++;actionSolved=false;renderActionGame(true);});
  $('#action-replay').addEventListener('click',()=>{startActionGame();$('#action-heading').focus({preventScroll:true});});
  startActionGame();

  // A local, illustrated maze. DFS creates a connected path; BFS supplies hints.
  let mazeLevel=0,mazeGrid=[],mazePlayer=[1,1],mazeGoal=[],mazeTrail=new Set(),mazeMoves=0,mazeWon=false,mazeHint=null;
  const mazeDirections={up:[-1,0,'atas'],right:[0,1,'kanan'],down:[1,0,'bawah'],left:[0,-1,'kiri']};
  function createMaze(size,seed){
    const grid=Array.from({length:size},()=>Array(size).fill(1));
    let state=seed;
    const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
    const stack=[[1,1]];grid[1][1]=0;
    while(stack.length){
      const [r,c]=stack[stack.length-1];
      const options=Object.values(mazeDirections).map(([dr,dc])=>[r+2*dr,c+2*dc,dr,dc]).filter(([nr,nc])=>nr>0&&nc>0&&nr<size-1&&nc<size-1&&grid[nr][nc]===1);
      if(!options.length){stack.pop();continue;}
      const [nr,nc,dr,dc]=options[Math.floor(random()*options.length)];
      grid[r+dr][c+dc]=0;grid[nr][nc]=0;stack.push([nr,nc]);
    }
    // Decorative hazards occupy only impassable cells, never the route.
    for(let r=1;r<size-1;r++)for(let c=1;c<size-1;c++)if(grid[r][c]===1){if((r+c)%4===0)grid[r][c]=2;else if((r*3+c)%5===0)grid[r][c]=3;}
    return grid;
  }
  function mazePath(){
    const queue=[[...mazePlayer]],parents=new Map([[mazePlayer.join(','),null]]);
    for(let i=0;i<queue.length;i++){
      const [r,c]=queue[i];
      if(r===mazeGoal[0]&&c===mazeGoal[1]){
        const path=[];let key=[r,c].join(',');
        while(key!==null){path.unshift(key.split(',').map(Number));key=parents.get(key);}
        return path;
      }
      for(const [dr,dc] of Object.values(mazeDirections)){
        const nr=r+dr,nc=c+dc,key=[nr,nc].join(',');
        if(mazeGrid[nr]?.[nc]===0&&!parents.has(key)){parents.set(key,[r,c].join(','));queue.push([nr,nc]);}
      }
    }
    return [];
  }
  function startMaze(){
    mazeGrid=createMaze(mazeLevel===0?9:11,2401+mazeLevel*731);
    mazePlayer=[1,1];mazeGoal=[mazeGrid.length-2,mazeGrid.length-2];
    mazeTrail=new Set(['1,1']);mazeMoves=0;mazeWon=false;mazeHint=null;
    $('#maze-level').textContent='Misi '+(mazeLevel+1)+' dari 3 · '+['Kenali jalan','Cari celah','Penjelajah siaga'][mazeLevel];
    $('#maze-finish').hidden=true;$('#maze-hint').disabled=false;
    $$('[data-maze-direction]').forEach(button=>{button.disabled=false;});
    $('#maze-feedback').textContent='Misi dimulai! Temukan jalan menuju bendera. Tidak ada batas waktu.';
    renderMaze();
  }
  function renderMaze(){
    const board=$('#maze-board');board.replaceChildren();board.style.setProperty('--maze-size',mazeGrid.length);
    const fragment=document.createDocumentFragment();
    mazeGrid.forEach((row,r)=>row.forEach((cell,c)=>{
      const el=document.createElement('span');el.setAttribute('aria-hidden','true');
      el.className='siaga-maze-cell '+(['maze-road','maze-wall','maze-river','maze-closed'][cell]);
      const key=[r,c].join(',');
      if(cell===2)el.textContent='≋';else if(cell===3)el.textContent='⛔';
      if(mazeTrail.has(key))el.classList.add('maze-visited');
      if(r===1&&c===1){el.classList.add('maze-home');el.textContent='⌂';}
      if(r===mazeGoal[0]&&c===mazeGoal[1]){el.classList.add('maze-goal');el.textContent='🏁';}
      if(mazeHint&&mazeHint[0]===r&&mazeHint[1]===c){el.classList.add('maze-hint-cell');el.textContent='✦';}
      if(r===mazePlayer[0]&&c===mazePlayer[1]){el.classList.add('maze-player');el.textContent=mazeWon?'★':'●';}
      fragment.append(el);
    }));board.append(fragment);
    $('#maze-moves').textContent=mazeMoves+' langkah';
    const openings=Object.values(mazeDirections).filter(([dr,dc])=>mazeGrid[mazePlayer[0]+dr]?.[mazePlayer[1]+dc]===0).map(d=>d[2]);
    const position='Baris '+(mazePlayer[0]+1)+', kolom '+(mazePlayer[1]+1)+'. Jalan terbuka: '+openings.join(', ')+'.';
    $('#maze-position').textContent=position;
    board.setAttribute('aria-label','Papan maze '+mazeGrid.length+' kali '+mazeGrid.length+'. '+position+' Tujuan: baris '+(mazeGoal[0]+1)+', kolom '+(mazeGoal[1]+1)+'.');
  }
  function moveMaze(direction){
    if(mazeWon)return;
    const [dr,dc,label]=mazeDirections[direction];
    const nr=mazePlayer[0]+dr,nc=mazePlayer[1]+dc,cell=mazeGrid[nr]?.[nc];
    if(cell!==0){
      $('#maze-feedback').textContent=(cell===2?'Ada sungai. Jangan menyeberang.':cell===3?'Jalan ini ditutup. Jangan diterobos.':'Jalan buntu atau batas peta.')+' Coba arah lain. '+$('#maze-position').textContent;
      return;
    }
    mazePlayer=[nr,nc];mazeMoves++;mazeTrail.add([nr,nc].join(','));mazeHint=null;
    mazeWon=nr===mazeGoal[0]&&nc===mazeGoal[1];renderMaze();
    if(mazeWon){
      $('#maze-feedback').textContent='★ Berhasil! Kamu tiba di titik kumpul bersama pendamping dalam '+mazeMoves+' langkah.';
      $('#maze-finish').hidden=false;
      $('#maze-finish-title').textContent=mazeLevel===2?'🏅 Tiga misi selesai!':'★ Sampai di titik kumpul!';
      $('#maze-finish-text').textContent=mazeLevel===2?'Hebat, kamu terus mencoba dan menghindari rintangan. Ceritakan kepada keluarga mengapa kita harus mengikuti petugas.':'Pendamping menunggumu. Saat evakuasi sungguhan, kita berjalan bersama dan mengikuti petugas.';
      $('#maze-next').textContent=mazeLevel===2?'Main dari awal ↺':'Misi berikutnya →';
      $('#maze-hint').disabled=true;$$('[data-maze-direction]').forEach(button=>{button.disabled=true;});
      $('#maze-next').focus({preventScroll:true});
    }else $('#maze-feedback').textContent='Bergerak ke '+label+'. '+$('#maze-position').textContent;
  }
  $$('[data-maze-direction]').forEach(button=>button.addEventListener('click',()=>{moveMaze(button.dataset.mazeDirection);}));
  $('#maze-board').addEventListener('keydown',event=>{
    const direction={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'}[event.key];
    if(!direction)return;event.preventDefault();moveMaze(direction);
  });
  $('#maze-hint').addEventListener('click',()=>{
    if(mazeWon)return;const path=mazePath();if(path.length<2)return;
    mazeHint=path[1];renderMaze();
    const dr=mazeHint[0]-mazePlayer[0],dc=mazeHint[1]-mazePlayer[1];
    const direction=Object.values(mazeDirections).find(d=>d[0]===dr&&d[1]===dc)[2];
    $('#maze-feedback').textContent='💡 Coba satu langkah ke '+direction+'. Kotak berbintang menunjukkan langkah berikutnya.';
  });
  $('#maze-reset').addEventListener('click',()=>{startMaze();$('#maze-board').focus({preventScroll:true});});
  $('#maze-next').addEventListener('click',()=>{mazeLevel=(mazeLevel+1)%3;startMaze();$('#maze-board').focus({preventScroll:true});});
  startMaze();

  // Memory matching: item/function pairs, no timed hiding or drag gestures.
  const memoryPairs=[
    {item:'Air minum',icon:'💧',use:'Untuk diminum saat mengungsi.'},
    {item:'Senter',icon:'🔦',use:'Menerangi tempat gelap.'},
    {item:'Peluit',icon:'📣',use:'Memberi tanda untuk meminta bantuan.'},
    {item:'Salinan dokumen',icon:'🪪',use:'Membantu petugas mengenali identitas keluarga.'},
    {item:'Pakaian ganti',icon:'👕',use:'Mengganti pakaian yang kotor.'},
    {item:'Daftar kontak keluarga',icon:'☎',use:'Menghubungi keluarga atau pendamping.'}
  ];
  let memoryDeck=[],memoryOpen=[],memoryMatched=new Set(),memoryTries=0;
  function startMemory(focus=false){
    memoryDeck=memoryPairs.flatMap((pair,id)=>[{pair:id,kind:'item',text:pair.item,icon:pair.icon},{pair:id,kind:'use',text:pair.use,icon:'✦'}]);
    for(let i=memoryDeck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[memoryDeck[i],memoryDeck[j]]=[memoryDeck[j],memoryDeck[i]];}
    memoryOpen=[];memoryMatched=new Set();memoryTries=0;renderMemory();
    $('#memory-feedback').textContent='Pilih dua kartu. Cocokkan nama perlengkapan dengan kegunaannya.';
    if(focus)$('#memory-grid button').focus({preventScroll:true});
  }
  function renderMemory(){
    const root=$('#memory-grid');root.replaceChildren();
    memoryDeck.forEach((card,index)=>{
      const matched=memoryMatched.has(card.pair),open=matched||memoryOpen.includes(index);
      const button=document.createElement('button');button.type='button';button.dataset.memoryIndex=index;
      button.className='siaga-memory-card'+(open?' is-open':'')+(matched?' is-matched':'');
      button.disabled=matched;button.setAttribute('aria-pressed',String(open));
      button.setAttribute('aria-label','Kartu '+(index+1)+': '+(open?card.text+(matched?' Sudah cocok.':''):'belum dibuka'));
      button.innerHTML=open?'<span class="memory-card-kind">'+(card.kind==='item'?'PERLENGKAPAN':'KEGUNAAN')+'</span><span class="memory-card-icon" aria-hidden="true">'+card.icon+'</span><strong>'+card.text+'</strong>'+(matched?'<span class="memory-card-check">✓ Cocok</span>':''):'<span class="memory-card-number">'+(index+1)+'</span><span class="memory-card-back" aria-hidden="true">✳</span><strong>Buka kartu</strong>';
      root.append(button);
    });
    $('#memory-count').textContent=memoryMatched.size+' / 6 pasangan';
    $('#memory-tries').textContent=memoryTries+' percobaan';
    $('#memory-close').hidden=memoryOpen.length!==2;
    $('#memory-finish').hidden=memoryMatched.size!==6;
  }
  $('#memory-grid').addEventListener('click',event=>{
    const button=event.target.closest('[data-memory-index]');if(!button||!$('#memory-grid').contains(button))return;
    const index=Number(button.dataset.memoryIndex);
    if(memoryOpen.length===2||memoryOpen.includes(index)||memoryMatched.has(memoryDeck[index].pair))return;
    memoryOpen.push(index);
    if(memoryOpen.length===2){
      memoryTries++;
      const [first,second]=memoryOpen.map(i=>memoryDeck[i]);
      if(first.pair===second.pair){
        memoryMatched.add(first.pair);memoryOpen=[];renderMemory();
        $('#memory-feedback').textContent='★ Cocok! '+memoryPairs[first.pair].item+': '+memoryPairs[first.pair].use;
        if(memoryMatched.size===6){$('#memory-feedback').textContent='🎉 Enam pasangan ditemukan! Kamu mengenal perlengkapan dan kegunaannya. Siapkan tas sungguhan bersama keluarga, ya.';$('#memory-finish-title').focus({preventScroll:true});}
        else $('#memory-grid button:not(:disabled)').focus({preventScroll:true});
      }else{renderMemory();$('#memory-feedback').textContent='Belum cocok. Ingat kedua kartu ini, lalu tekan Tutup dua kartu untuk mencoba pasangan lain.';$('#memory-close').focus({preventScroll:true});}
    }else{
      renderMemory();$('#memory-feedback').textContent='Kartu terbuka: '+memoryDeck[index].text+' Pilih satu kartu lagi untuk mencari pasangannya.';
      $('#memory-grid button[data-memory-index="'+index+'"]').focus({preventScroll:true});
    }
  });
  $('#memory-close').addEventListener('click',()=>{memoryOpen=[];renderMemory();$('#memory-feedback').textContent='Coba pasangan lain. Tidak perlu terburu-buru!';$('#memory-grid button:not(:disabled)').focus({preventScroll:true});});
  $('#memory-reset').addEventListener('click',()=>startMemory(true));
  $('#memory-again').addEventListener('click',()=>startMemory(true));
  startMemory();

  // Coordinates interpreted from the latitude/longitude grid printed on the two
  // source maps. These positions are illustrative and MUST be GPS-validated.
  const mapLocations = [
    {id:'sw1',group:'sumberwuluh',number:1,name:'Lapangan Krajan — titik 1',lat:-8.17868,lng:113.03433,area:null,facilities:{listrik:false,air:false,mandi:false,musala:false}},
    {id:'sw2',group:'sumberwuluh',number:2,name:'Balai Desa Sumberwuluh',lat:-8.18517,lng:113.04424,area:null,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'sw3',group:'sumberwuluh',number:3,name:'Masjid Al Amin',lat:-8.18709,lng:113.04742,area:null,facilities:{listrik:true,air:true,mandi:true,musala:null}},
    {id:'sw4',group:'sumberwuluh',number:4,name:'SDN Sumberwuluh 1',lat:-8.19214,lng:113.05040,area:2714,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'sw5',group:'sumberwuluh',number:5,name:'Lapangan Krajan — titik 5',lat:-8.19217,lng:113.05243,area:null,facilities:{listrik:false,air:false,mandi:false,musala:false}},
    {id:'sw6',group:'sumberwuluh',number:6,name:'Masjid An Nur',lat:-8.19402,lng:113.04958,area:500,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'jr1',group:'jarit',number:1,name:'Kantor Desa Jarit',lat:-8.20524,lng:113.10170,area:1600,facilities:{listrik:true,air:true,mandi:true,musala:true},bathrooms:'5 unit'},
    {id:'jr2',group:'jarit',number:2,name:'SDN Jarit 01',lat:-8.20683,lng:113.09491,area:8407,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'jr3',group:'jarit',number:3,name:'SDN Jarit 02',lat:-8.21713,lng:113.08426,area:180,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'jr4',group:'jarit',number:4,name:'SDN Jarit 03',lat:-8.21507,lng:113.08506,area:2100,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'jr5',group:'jarit',number:5,name:'SDN Jarit 04',lat:-8.20206,lng:113.10171,area:4314,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'jr6',group:'jarit',number:6,name:'SMPN 3 Candipuro',lat:-8.21418,lng:113.07714,area:5410,facilities:{listrik:true,air:true,mandi:true,musala:true}},
    {id:'jr7',group:'jarit',number:7,name:'SMKS Pembangunan Candipuro',lat:-8.20350,lng:113.09300,area:3297,facilities:{listrik:true,air:true,mandi:true,musala:true}}
  ];
  // Cropped and RGB-extracted directly from the supplied 2026 map figure.
  // Registration is approximate (printed graticule), not surveyed GPS geometry.
  // The transparent raster deliberately has no routing graph or turn directions.
  const routeBounds=[[-8.22037845705968,113.009461426492],[-8.152620087336244,113.113173216885]];
  let mapLayers = null;
  let mapMarkerById = null;
  let mapKrbImage = null;
  let mapKrbRequested = false;
  const krbService = 'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/export';
  function mapPopupHtml(place){
    const f=place.facilities;
    const yesNo=v=>v===null?'Belum tercatat':v?'Ada':'Tidak ada';
    const type=place.group==='jarit'?'Calon barak pengungsian Jarit':'Titik kumpul Sumberwuluh';
    return `<div class="location-popup"><span class="popup-type">${type} · ${place.number}</span><h3>${place.name}</h3><p class="popup-notice">📍 Sumber lokasi: peta kajian tim 2026</p><p><strong>Luas tercantum:</strong> ${place.area?place.area.toLocaleString('id-ID')+' m²':'Tidak tercantum'}${place.area?' (bukan kapasitas pengungsi)':''}</p><ul><li>Listrik: ${yesNo(f.listrik)}</li><li>Air: ${yesNo(f.air)}</li><li>Kamar mandi: ${place.bathrooms||yesNo(f.mandi)}</li><li>Musala: ${yesNo(f.musala)}</li></ul><p class="popup-notice">Tanyakan akses kursi roda, daya tampung, dan ketersediaan layanan kepada pengelola atau petugas desa.</p></div>`;
  }
  function renderMapPlaceList(){
    const root=$('#map-place-list');
    if(!root)return;
    root.replaceChildren();
    const group=$('#map-site-select').value;
    mapLocations.filter(p=>group==='all'||p.group===group).forEach(place=>{
      const btn=document.createElement('button');btn.type='button';btn.className='map-place-button';
      btn.innerHTML=`<span class="map-place-bubble ${place.group}">${place.number}</span><span><strong>${place.name}</strong><small>${place.group==='jarit'?'Calon barak Jarit':'Titik kumpul Sumberwuluh'} · data kajian 2026</small></span><span aria-hidden="true">↗</span>`;
      btn.addEventListener('click',()=>{
        if(!leafletMap){showToast('Peta belum dapat dibuka. Lihat peta sumber di bawah.');return;}
        const checkbox=$('#layer-points-'+(place.group==='jarit'?'jarit':'source'));
        checkbox.checked=true;
        const groupLayer=mapLayers[place.group];
        if(!leafletMap.hasLayer(groupLayer))groupLayer.addTo(leafletMap);
        leafletMap.setView([place.lat,place.lng],14,{animate:true});
        mapMarkerById[place.id].openPopup();
      });
      root.append(btn);
    });
  }
  $('#map-site-select')?.addEventListener('change',renderMapPlaceList);
  renderMapPlaceList();

  function renderKrbOverlay(){
    if(!leafletMap||!mapKrbRequested)return;
    if(mapKrbImage){leafletMap.removeLayer(mapKrbImage);mapKrbImage=null;}
    const bounds=leafletMap.getBounds();
    const size=leafletMap.getSize();
    const args=new URLSearchParams({bbox:bounds.toBBoxString(),bboxSR:'4326',imageSR:'4326',size:`${Math.max(1,Math.floor(size.x))},${Math.max(1,Math.floor(size.y))}`,format:'png32',transparent:'true',layers:'show:11',f:'image'});
    const image=L.imageOverlay(krbService+'?'+args.toString(),bounds,{opacity:.42,interactive:false,alt:'Lapisan referensi Kawasan Rawan Bencana gunung api dari layanan peta BIG'});
    mapKrbImage=image;
    $('#map-krb-status').textContent='Memuat lapisan KRB dari layanan peta BIG…';
    image.on('load',()=>{
      if(mapKrbImage===image)$('#map-krb-status').textContent='Lapisan referensi KRB dari BIG ditampilkan. Kuning, merah muda, dan merah menunjukkan KRB I, II, dan III. Untuk batas kegiatan yang berlaku, ikuti rekomendasi PVMBG.';
    });
    image.on('error',()=>{
      if(mapKrbImage!==image)return;
      leafletMap.removeLayer(image);mapKrbImage=null;mapKrbRequested=false;
      $('#layer-krb').checked=false;
      $('#map-krb-status').textContent='Lapisan KRB belum dapat dimuat dari BIG. Coba aktifkan kembali atau buka informasi Badan Geologi pada bagian sumber.';
    });
    image.addTo(leafletMap);
  }
  function initLiveLocation(){
    const start=$('#map-location-start'), center=$('#map-location-center'), stop=$('#map-location-stop'), status=$('#map-location-status');
    let watchId=null, marker=null, accuracyCircle=null, lastPosition=null, generation=0;
    const clearWatch=()=>{
      generation++;
      if(watchId!==null)navigator.geolocation.clearWatch(watchId);
      watchId=null;
      start.disabled=false;start.setAttribute('aria-pressed','false');
      start.textContent='⌖ Aktifkan lokasi saya';stop.disabled=true;
    };
    const removePosition=()=>{
      if(marker)leafletMap.removeLayer(marker);
      if(accuracyCircle)leafletMap.removeLayer(accuracyCircle);
      marker=null;accuracyCircle=null;lastPosition=null;center.disabled=true;
    };
    start.addEventListener('click',()=>{
      if(watchId!==null)return;
      if(!window.isSecureContext){status.textContent='Akses lokasi memerlukan HTTPS. Buka situs melalui alamat HTTPS.';return;}
      if(!navigator.geolocation){status.textContent='Browser ini tidak mendukung lokasi. Coba browser lain pada perangkat Anda.';return;}
      const current=++generation;
      start.disabled=true;start.setAttribute('aria-pressed','true');start.textContent='⌖ Lokasi aktif';stop.disabled=false;
      status.textContent='Menunggu izin dan posisi perangkat…';
      watchId=navigator.geolocation.watchPosition(position=>{
        if(current!==generation)return;
        const {latitude,longitude,accuracy}=position.coords;
        const first=!lastPosition;
        lastPosition=[latitude,longitude];
        if(!marker){
          accuracyCircle=L.circle(lastPosition,{radius:accuracy,color:'#1976d2',weight:1,fillColor:'#2196f3',fillOpacity:.12,interactive:false}).addTo(leafletMap);
          marker=L.circleMarker(lastPosition,{radius:9,color:'#fff',weight:3,fillColor:'#1479dc',fillOpacity:1}).addTo(leafletMap).bindTooltip('Lokasi saya');
        }else{marker.setLatLng(lastPosition);accuracyCircle.setLatLng(lastPosition).setRadius(accuracy);}
        const time=new Date(position.timestamp).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
        marker.bindPopup('Lokasi perangkat Anda · akurasi ±'+Math.round(accuracy)+' m');
        status.textContent='Lokasi aktif · akurasi ±'+Math.round(accuracy)+' m · diperbarui '+time+'.'+(accuracy>100?' Akurasi rendah; coba berpindah ke area terbuka.':'');
        center.disabled=false;
        if(first)leafletMap.setView(lastPosition,15);
      },error=>{
        if(current!==generation)return;
        if(error.code===1){clearWatch();removePosition();status.textContent='Izin lokasi ditolak. Izinkan lokasi di pengaturan situs browser, lalu coba lagi.';}
        else status.textContent=(error.code===3?'Pencarian lokasi melewati batas waktu.':'Posisi perangkat belum tersedia.')+' Pastikan layanan lokasi aktif. Pencarian tetap berjalan; Anda dapat menekan Berhenti.'+(lastPosition?' Titik yang terlihat adalah posisi terakhir.':'');
      },{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    });
    center.addEventListener('click',()=>{if(lastPosition)leafletMap.setView(lastPosition,15);});
    stop.addEventListener('click',()=>{clearWatch();removePosition();status.textContent='Lokasi dihentikan. Posisi Anda dihapus dari peta.';});
    window.addEventListener('pagehide',()=>{clearWatch();removePosition();status.textContent='Lokasi dihentikan. Aktifkan kembali untuk memperbarui posisi.';});
  }
  function initMap(){
    if(leafletMap){leafletMap.invalidateSize();return;}
    if(!window.L){$('#map-fallback').hidden=false;$('#leaflet-map').hidden=true;return;}
    // Location is opt-in and stays in browser memory.
    leafletMap=L.map('leaflet-map',{zoomControl:true,scrollWheelZoom:false});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(leafletMap);
    mapLayers={sumberwuluh:L.layerGroup(),jarit:L.layerGroup(),routes:L.layerGroup()};
    mapMarkerById={};
    mapLocations.forEach(place=>{
      const marker=L.circleMarker([place.lat,place.lng],{
        radius:9,color:'#fff',weight:2.7,fillColor:place.group==='jarit'?'#7551ce':'#e6bf53',fillOpacity:1
      }).bindPopup(mapPopupHtml(place),{maxWidth:290});
      marker.bindTooltip(`${place.name}`,{direction:'top'});
      mapMarkerById[place.id]=marker;
      marker.addTo(mapLayers[place.group]);
    });
    // Keep colored route traces visually above KRB and below location markers.
    leafletMap.createPane('study-routes').style.zIndex='450';
    leafletMap.getPane('study-routes').style.pointerEvents='none';
    const routeOverlay=L.imageOverlay('assets/maps/koridor-jalan-terekstraksi-2026.png',routeBounds,{
      pane:'study-routes',opacity:.97,interactive:false,
      alt:'Garis hijau dan oranye hasil ekstraksi gambar jaringan jalan kajian tahun 2026'
    });
    routeOverlay.on('error',()=>{
      $('#map-route-status').textContent='Lapisan jalan tidak dapat dimuat. Silakan buka peta kajian asli pada bagian sumber data di bawah.';
    });
    routeOverlay.addTo(mapLayers.routes);
    mapLayers.routes.addTo(leafletMap);
    mapLayers.sumberwuluh.addTo(leafletMap);
    mapLayers.jarit.addTo(leafletMap);
    const studyBounds=L.latLngBounds(mapLocations.map(p=>[p.lat,p.lng])).pad(.35);
    leafletMap.fitBounds(studyBounds,{maxZoom:12});
    $('#map-focus-route').addEventListener('click',()=>{
      if(!$('#layer-routes').checked){
        $('#layer-routes').checked=true;
        mapLayers.routes.addTo(leafletMap);
      }
      leafletMap.fitBounds(routeBounds,{maxZoom:13,padding:[18,18]});
    });
    [['#layer-routes','routes'],['#layer-points-source','sumberwuluh'],['#layer-points-jarit','jarit']].forEach(([selector,key])=>{
      $(selector).addEventListener('change',e=>{
        if(e.target.checked)mapLayers[key].addTo(leafletMap);
        else leafletMap.removeLayer(mapLayers[key]);
      });
    });
    $('#layer-krb').addEventListener('change',e=>{
      mapKrbRequested=e.target.checked;
      if(mapKrbRequested)renderKrbOverlay();
      else {
        if(mapKrbImage)leafletMap.removeLayer(mapKrbImage);
        mapKrbImage=null;
        $('#map-krb-status').textContent='Lapisan KRB dinonaktifkan. Aktifkan untuk melihat referensi kawasan bahaya dari layanan BIG.';
      }
    });
    leafletMap.on('moveend',()=>{if(mapKrbRequested)renderKrbOverlay();});
    $('#map-reset-view').addEventListener('click',()=>leafletMap.fitBounds(studyBounds,{maxZoom:12}));
    initLiveLocation();
    leafletMap.whenReady(()=>setTimeout(()=>leafletMap.invalidateSize(),100));
  }

  // Interactive conceptual Sister Village story, opt-in motion and timed playback.
  const svStages=[
    {kicker:'SEBELUM BENCANA',title:'Kenali, sepakati, dan latih.',text:'Kedua desa menyusun rencana bersama pemerintah dan petugas: siapa yang perlu bantuan, bagaimana perpindahan dilakukan, serta layanan apa yang perlu disiapkan. Rencana diuji melalui latihan.',source:'Mendata kebutuhan warga, pendamping, titik kumpul, dan transportasi. Jalur ditinjau bersama pihak berwenang.',host:'Meninjau kapasitas, aksesibilitas tempat penerimaan, air, sanitasi, logistik, dan dukungan kesehatan.',scene:'Data warga ↔ kesiapan penerimaan'},
    {kicker:'SAAT ADA ARAHAN RESMI',title:'Peringatan diterima, dua desa bersiap.',text:'Warga mengikuti peringatan dan perintah petugas. Desa asal dan desa penyangga saling mengabarkan kebutuhan serta rencana kedatangan agar persiapan berjalan bersama.',source:'Menyampaikan arahan resmi, mengoordinasikan warga di titik kumpul, dan memastikan pendamping serta kendaraan siap.',host:'Menerima pemberitahuan, menyiapkan relawan penerima, dan memeriksa layanan sesuai kebutuhan warga yang akan datang.',scene:'Peringatan resmi → koordinasi kedua desa'},
    {kicker:'EVAKUASI DENGAN PENDAMPINGAN',title:'Berangkat bersama, saling menjaga.',text:'Perpindahan dilakukan melalui jalur yang ditetapkan petugas. Anak-anak, ibu hamil, lansia, dan penyandang disabilitas memperoleh dukungan sesuai kebutuhan masing-masing.',source:'Memeriksa jumlah warga, menjaga keluarga tetap bersama, dan mengoordinasikan bantuan mobilitas serta transportasi.',host:'Memantau informasi kedatangan dan menyiapkan penerimaan berdasarkan jumlah warga serta kebutuhan bantuan.',scene:'Perjalanan didampingi · ikuti arahan petugas'},
    {kicker:'SELAMA DI DESA PENYANGGA',title:'Disambut, didata, dan didampingi.',text:'Kedatangan bukan akhir kerja sama. Kedua desa dan petugas memperbarui data serta kebutuhan warga, menjaga keluarga tetap terhubung, dan mengoordinasikan pelayanan.',source:'Membantu pencocokan data keluarga dan menyampaikan kebutuhan warga kepada pengelola penerimaan.',host:'Mengoordinasikan registrasi, tempat penampungan, air bersih, sanitasi, logistik, dan akses layanan kesehatan.',scene:'Penerimaan → pendataan → pemenuhan kebutuhan'}
  ];
  let svStage=0,svPlaying=false,svTimer=null;
  const svMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function updateSvControls(){
    $('#sv-story').classList.toggle('sv-playing',svPlaying);
    $('#sv-play').setAttribute('aria-pressed',String(svPlaying));
    $('#sv-play').textContent=svPlaying?'Ⅱ Jeda cerita':svStage===3?'↺ Putar dari awal':'▶ Putar cerita';
    $('#sv-prev').disabled=svStage===0;$('#sv-next').disabled=svStage===3;
    $('#sv-progress').textContent='Tahap '+(svStage+1)+' dari 4 · '+(svPlaying?'berputar otomatis setiap 9 detik':'pilih tahap atau tekan Putar');
  }
  function stopSv(){clearTimeout(svTimer);svTimer=null;svPlaying=false;updateSvControls();}
  function scheduleSv(){
    clearTimeout(svTimer);
    if(!svPlaying)return;
    svTimer=setTimeout(()=>{if(svStage<3){setSvStage(svStage+1);}else stopSv();},9000);
  }
  function setSvStage(index){
    svStage=Math.max(0,Math.min(3,index));const step=svStages[svStage];
    $('#sv-story').dataset.stage=String(svStage);
    $$('[data-sv-stage]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.svStage)===svStage)));
    $('#sv-stage-kicker').textContent='TAHAP 0'+(svStage+1)+' · '+step.kicker;
    $('#sv-stage-title').textContent=step.title;$('#sv-stage-text').textContent=step.text;
    $('#sv-source-role').textContent=step.source;$('#sv-host-role').textContent=step.host;
    $('#sv-scene-message').textContent=step.scene;
    updateSvControls();scheduleSv();
  }
  $$('[data-sv-stage]').forEach(button=>button.addEventListener('click',()=>{stopSv();setSvStage(Number(button.dataset.svStage));}));
  $('#sv-prev').addEventListener('click',()=>{stopSv();setSvStage(svStage-1);});
  $('#sv-next').addEventListener('click',()=>{stopSv();setSvStage(svStage+1);});
  $('#sv-play').addEventListener('click',()=>{
    if(svPlaying){stopSv();return;}
    svPlaying=true;if(svStage===3)setSvStage(0);else{updateSvControls();scheduleSv();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSv();});
  $$('[data-route]').forEach(button=>button.addEventListener('click',stopSv));
  window.addEventListener('hashchange',stopSv);window.addEventListener('pagehide',stopSv);
  svMotion.addEventListener('change',()=>{stopSv();});
  setSvStage(0);

  // Browser text-to-speech: user-initiated, section-specific, and keyboard accessible.
  // The speech engine and available Indonesian voices depend on the visitor's browser/device.
  function createSpeechTrigger(key, title, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tts-trigger';
    button.dataset.tts = key;
    button.dataset.ttsTitle = title;
    button.textContent = `🔊 ${label}`;
    return button;
  }

  $$('.detailed-hazards .hazard-card').forEach((card, index) => {
    const title = $('summary strong', card)?.textContent?.trim() || 'bahaya gunung api';
    $('.hazard-body', card)?.prepend(createSpeechTrigger(`bahaya-${index}`, title, 'Dengarkan penjelasan & langkah aman'));
  });
  $$('[data-guide-target]').forEach(button => button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.guideTarget);
    target?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
    $('h2',target)?.focus({preventScroll:true});
  }));
  $$('.guide-grid .guide-card').forEach((card, index) => {
    const heading = $('h2', card);
    if (heading) heading.insertAdjacentElement('afterend', createSpeechTrigger(`panduan-${index}`, heading.textContent.trim(), 'Dengarkan panduan ini'));
  });
  $('.sv-story-summary')?.append(createSpeechTrigger('sister-story', 'Ilustrasi cara kerja Sumberwuluh dan Jarit', 'Dengarkan tahap ini'));
  $('.sister-intro-copy')?.append(createSpeechTrigger('sister', 'Konsep Desa Bersaudara', 'Dengarkan konsep Desa Bersaudara'));
  const mapIntro = $('.map-sidebar h2')?.nextElementSibling;
  if (mapIntro?.tagName === 'P') mapIntro.insertAdjacentElement('afterend', createSpeechTrigger('peta', 'Penjelasan peta kajian evakuasi', 'Dengarkan petunjuk membaca peta'));

  const synth = ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) ? window.speechSynthesis : null;
  const player = $('#tts-player');
  const pauseButton = $('#tts-pause');
  const stopButton = $('#tts-stop');
  const rateSelect = $('#tts-rate');
  const allowedRates = [0.8, 1, 1.2];
  const storedRate = Number(safeLoad('siaga_tts_kecepatan', 1));
  let speechRate = allowedRates.includes(storedRate) ? storedRate : 1;
  rateSelect.value = String(speechRate);
  let activeSpeechKey = null;
  let activeSpeechTitle = '';
  let lastSpeechTrigger = null;
  let speechParts = [];
  let speechPartIndex = 0;
  let speechState = 'idle';
  let speechSession = 0;

  function readNodes(nodes) {
    return nodes.map(node => node.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join('. ');
  }

  function guideText(card) {
    if (!card) return '';
    return readNodes($$('h2,h3,h4,p,li', card).filter(node => !node.parentElement.closest('li')));
  }

  function buildSpeechText(key) {
    if (key === 'ringkasan') return 'Kenali bahaya Gunung Semeru. Awan panas dapat meluncur cepat melalui lereng dan lembah. Lahar hujan dapat mengikuti alur sungai bahkan ketika tidak terlihat letusan baru. Abu vulkanik dapat mengganggu pernapasan dan penglihatan. Jangan mendekati kawasan terlarang, tebing sungai, atau koridor bahaya. Siapkan tas siaga dan rencana pendampingan bagi anak-anak, ibu hamil, lansia, serta penyandang disabilitas. Jika ada arahan evakuasi resmi, ikuti petugas. Situs ini adalah bahan belajar, bukan informasi keadaan darurat secara langsung.';
    if (key === 'bahaya') return 'Gunung api dapat menghasilkan awan panas guguran, lahar hujan, hujan abu, lava dan lontaran batu, serta gas vulkanik. Awan panas bergerak mengikuti lereng dan lembah. Lahar dapat mengalir melalui sungai setelah hujan di bagian hulu. Abu dapat terbawa angin hingga jauh dari kawah. Tidak melihat letusan bukan berarti keadaan sudah aman. Pelajari tiap bahaya, patuhi zona larangan dan arahan petugas, dan bantu anggota keluarga yang membutuhkan pendampingan.';
    if (key.startsWith('bahaya-')) {
      const index = Number(key.slice('bahaya-'.length));
      const card = $$('.detailed-hazards .hazard-card')[index];
      if (!card) return '';
      const title = $('summary strong', card)?.textContent || 'Bahaya gunung api';
      const explanation = readNodes($$('.hazard-explain h4,.hazard-explain p', card));
      const safeSteps = $$('.action-do .action-step', card).map(step => readNodes($$('strong,p', step))).join('. ');
      const avoidSteps = $$('.action-dont .action-step', card).map(step => readNodes($$('strong,p', step))).join('. ');
      return `${title}. ${explanation}. Yang sebaiknya dilakukan. ${safeSteps}. Yang harus dihindari. ${avoidSteps}. Ikuti selalu informasi resmi dari petugas.`;
    }
    if (key === 'tas') return `Persiapan tas siaga keluarga. Siapkan perlengkapan sebelum keadaan darurat dan sesuaikan dengan kebutuhan seluruh anggota keluarga. Daftar yang bisa diperiksa: ${bagItems.join('. ')}. Periksa kembali isi tas secara berkala. Jangan menunggu peringatan untuk mulai menyiapkannya.`;
    if (key === 'evakuasi') {
      const steps = $$('.evac-steps article').map((item, index) => `Langkah ${index + 1}. ${readNodes($$('h3,p', item))}`);
      return `Langkah dasar evakuasi keluarga. Mulailah bergerak sesuai arahan resmi dari BPBD, pemerintah desa, atau petugas yang berwenang. ${steps.join('. ')}. Jalur dan tempat tujuan harus mengikuti keputusan petugas, bukan sekadar garis pada peta kajian ini.`;
    }
    if (key === 'edukasi-penambang') return readNodes($$('#miner-education h3,#miner-education h4,#miner-education p'));
    if (key === 'panduan-semua') return `Panduan pendampingan evakuasi yang inklusif. ${$$('.guide-grid .guide-card').map(guideText).join('. ')}. Tanyakan bantuan yang diinginkan kepada orang yang bersangkutan dan sepakati rencana bersama keluarga serta petugas.`;
    if (key.startsWith('panduan-')) return `${guideText($$('.guide-grid .guide-card')[Number(key.slice('panduan-'.length))])}. Tanyakan bantuan yang dibutuhkan, jangan berasumsi.`;
    if (key === 'sister-story') return 'Ilustrasi konsep, bukan rute evakuasi nyata. '+readNodes($$('#sv-story-detail h3,#sv-story-detail h4,#sv-story-detail p'));
    if (key === 'sister') return `Desa Bersaudara atau Sister Village adalah kerja sama yang disiapkan sebelum bencana antara desa asal yang menghadapi ancaman dan desa penyangga yang dinilai lebih aman. ${readNodes($$('.sister-intro-copy > p,.sister-definition p'))}. Peran, transportasi, kebutuhan kelompok rentan, dan fasilitas perlu disepakati dan dilatih bersama pemerintah serta lembaga penanggulangan bencana. Rencana Sumberwuluh dan Jarit pada laman ini masih merupakan materi penelitian, bukan pengumuman jalur atau shelter resmi.`;
    if (key === 'peta') return 'Peta Sumberwuluh menuju Jarit menampilkan titik kumpul, calon barak, jaringan jalan, dan lapisan referensi kawasan rawan bencana. Aktifkan lapisan atau pilih lokasi untuk melihat fasilitas. Titik dan garis merupakan posisi pendekatan dari peta kajian tim tahun 2026. Kondisi jalan dan fasilitas mengikuti catatan kajian. Saat evakuasi, ikuti jalur dan tujuan yang ditetapkan petugas. Untuk batas kegiatan di kawasan bahaya yang berlaku, ikuti rekomendasi PVMBG.';
    return '';
  }

  function speechChunks(text) {
    const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
    const parts = [];
    let segment = '';
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      words.forEach(word => {
        if (segment && `${segment} ${word}`.length > 170) {
          parts.push(segment);
          segment = word;
        } else segment = segment ? `${segment} ${word}` : word;
      });
    });
    if (segment) parts.push(segment);
    return parts;
  }

  function preferredIndonesianVoice() {
    if (!synth) return null;
    const voices = synth.getVoices();
    return voices.find(voice => voice.lang.toLowerCase() === 'id-id') || voices.find(voice => voice.lang.toLowerCase().startsWith('id')) || null;
  }

  function updateSpeechButtons() {
    $$('[data-tts]').forEach(button => {
      if (!button.dataset.ttsDefaultText) button.dataset.ttsDefaultText = button.textContent;
      const active = button.dataset.tts === activeSpeechKey && ['playing', 'paused'].includes(speechState);
      button.setAttribute('aria-pressed', String(active));
      button.textContent = active ? '■ Hentikan bacaan' : button.dataset.ttsDefaultText;
      button.setAttribute('aria-label', `${active ? 'Hentikan' : 'Dengarkan'} ${button.dataset.ttsTitle || 'materi ini'}`);
      button.classList.toggle('tts-active', active);
    });
  }

  function updatePlayerState(statusText) {
    $('#tts-current-title').textContent = activeSpeechTitle;
    $('#tts-current-status').textContent = statusText;
    pauseButton.disabled = speechState === 'error';
    pauseButton.textContent = speechState === 'paused' ? '▶ Lanjut' : speechState === 'finished' ? '↻ Putar ulang' : '⏸ Jeda';
    pauseButton.setAttribute('aria-label', speechState === 'paused' ? 'Lanjutkan pembacaan' : speechState === 'finished' ? 'Putar ulang pembacaan' : 'Jeda pembacaan');
    updateSpeechButtons();
  }

  function stopSpeech(restoreFocus = false, announce = true) {
    speechSession++;
    if (synth) synth.cancel();
    const triggerToFocus = lastSpeechTrigger;
    activeSpeechKey = null;
    speechState = 'idle';
    speechParts = [];
    player.hidden = true;
    updateSpeechButtons();
    if (announce) showToast('Pembacaan suara dihentikan.');
    if (restoreFocus && triggerToFocus?.isConnected) triggerToFocus.focus();
  }

  function playSpeechPart(session) {
    if (session !== speechSession || speechState !== 'playing') return;
    if (speechPartIndex >= speechParts.length) {
      speechState = 'finished';
      updatePlayerState('Pembacaan selesai. Anda dapat memutar ulang atau menutup panel.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(speechParts[speechPartIndex]);
    utterance.lang = 'id-ID';
    utterance.rate = speechRate;
    const voice = preferredIndonesianVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      if (session !== speechSession) return;
      speechPartIndex++;
      playSpeechPart(session);
    };
    utterance.onerror = event => {
      if (session !== speechSession || ['canceled', 'interrupted'].includes(event.error)) return;
      speechState = 'error';
      updatePlayerState('Suara tidak dapat diputar pada browser atau perangkat ini.');
      showToast('Pembacaan gagal. Coba browser atau suara perangkat lain.');
    };
    try { synth.speak(utterance); }
    catch (_) {
      speechState = 'error';
      updatePlayerState('Mesin pembaca suara tidak tersedia.');
      showToast('Pembacaan suara tidak dapat dimulai.');
    }
  }

  function startSpeech(key, title, trigger = lastSpeechTrigger) {
    if (!synth) return showToast('Pembacaan suara belum didukung oleh browser ini.');
    const text = buildSpeechText(key);
    if (!text) return showToast('Materi yang akan dibacakan belum tersedia.');
    speechSession++;
    synth.cancel();
    activeSpeechKey = key;
    activeSpeechTitle = title;
    lastSpeechTrigger = trigger;
    speechParts = speechChunks(text);
    speechPartIndex = 0;
    speechState = 'playing';
    player.hidden = false;
    updatePlayerState('Sedang membacakan. Tekan Jeda untuk menghentikan sementara.');
    playSpeechPart(speechSession);
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-tts]');
    if (!trigger) return;
    const key = trigger.dataset.tts;
    if (activeSpeechKey === key && ['playing', 'paused'].includes(speechState)) stopSpeech(false);
    else startSpeech(key, trigger.dataset.ttsTitle || 'Materi kesiapsiagaan', trigger);
  });
  pauseButton.addEventListener('click', () => {
    if (speechState === 'finished') return startSpeech(activeSpeechKey, activeSpeechTitle);
    if (!synth) return;
    if (speechState === 'playing') {
      synth.pause();
      speechState = 'paused';
      updatePlayerState('Pembacaan dijeda.');
    } else if (speechState === 'paused') {
      synth.resume();
      speechState = 'playing';
      updatePlayerState('Pembacaan dilanjutkan.');
    }
  });
  stopButton.addEventListener('click', () => stopSpeech(true));
  rateSelect.addEventListener('change', () => {
    const next = Number(rateSelect.value);
    if (!allowedRates.includes(next)) return;
    speechRate = next;
    safeSave('siaga_tts_kecepatan', speechRate);
    showToast('Kecepatan baru digunakan untuk potongan bacaan berikutnya.');
  });
  $$('[data-route]').forEach(button => button.addEventListener('click', () => {
    if (activeSpeechKey !== null) stopSpeech(false, false);
  }));
  window.addEventListener('hashchange', () => { if (activeSpeechKey !== null) stopSpeech(false, false); });
  window.addEventListener('pagehide', () => { if (synth) synth.cancel(); });
  updateSpeechButtons();
  window.addEventListener('load',()=>{if(currentRoute==='peta')initMap();});
})();
