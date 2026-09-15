// ---------------------------------------------------------------------------
// English overrides for the Mongolian source copy in index.html.
//
// ARCHITECTURE — read this before editing copy:
//   * index.html holds the MONGOLIAN text inline. That is the source of truth for MN, it is
//     what search engines index, and it is what a visitor sees if JavaScript never runs.
//     To change Mongolian copy, edit index.html directly — not this file.
//   * This file holds ONLY the English strings, keyed to the `data-i18n` attribute on each
//     element. To change English copy, edit here.
//   * On load, main.js snapshots each keyed element's original Mongolian markup, so switching
//     EN -> MN restores it exactly. Mongolian is therefore never duplicated across two files
//     and the two languages cannot drift apart at the markup level.
//
// Values are inserted as HTML (not text) so inline <em>/<br>/<span> survive translation.
// These are author-controlled static strings only — never put user input through this path.
//
// TRANSLATION NOTE for the Foundation: the Mongolian in index.html was drafted from published
// sources and needs a native review pass before launch. It carries the names of two national
// figures; the phrasing should be yours, not a draft.
// ---------------------------------------------------------------------------

window.I18N_EN = {
  // ---- Document / chrome ----
  'doc.title': 'Norovbanzad Foundation — The Song and the Word',
  'nav.song': 'Her Song',
  'nav.word': 'His Writing',
  'nav.foundation': 'The Foundation',
  'nav.news': 'News',
  'nav.shop': 'Shop',
  'nav.contact': 'Contact',
  'skip': 'Skip to content',
  'menu': 'Menu',

  // ---- Hero ----
  'hero.eyebrow': 'The Norovbanzad Foundation',
  'hero.title': 'The Song<br>and the Word.',
  'hero.lede': 'Two lives in one household, and two of Mongolia’s great arts — the long song of Namjilyn Norovbanzad and the literature of Namsrain Banzragch — carried forward as a single inheritance.',
  'hero.scroll': 'Scroll to explore',

  // ---- Branches intro ----
  'branches.eyebrow': 'Where the strand divides',
  'branches.title': 'She sang the steppe. He wrote it. They married in 1949.',
  'branches.note': 'For more than half a century their two crafts grew side by side — a voice that carried <em>urtiin duu</em> to the world, and a pen that set Mongolian life into prose. The Foundation exists because neither strand is complete without the other.',

  // ---- Branch A: Norovbanzad ----
  'a.eyebrow': 'Branch One — The Voice',
  'a.name': 'Namjilyn Norovbanzad',
  'a.meta': '1931–2002 · Long song (<em>urtiin duu</em>)',
  'a.summary': 'Born to a herding family in Dundgovi, she became the definitive voice of the Mongolian long song — and the singer her nation would name Singer of the Century.',
  'a.portrait.caption': '[PLACEHOLDER: caption — what this photograph shows, and when.]',
  'a.1931': 'Born 10 December at Ulaan Ovoo, Dundgovi province, daughter of the herders Damdin and Namjil.',
  'a.1940': 'Entered school at nine. She sang so constantly that her classmates called her <em>Duuchin shar</em>.',
  'a.1942': 'Her father died; she left school and returned to herding.',
  'a.1946': 'At fifteen, made her stage debut singing <em>Ider Jinchin</em> at the Revolution anniversary celebration in the capital.',
  'a.1949': 'Met and married the writer Namsrain Banzragch; the couple settled in Mandalgovi.',
  'a.1957': 'Won a gold medal at the VI World Festival of Youth and Students in Moscow, bringing the long song to a world stage.',
  'a.1961': 'Named Honoured Artist and completed her formal training as a professional singer.',
  'a.1969': 'Named People’s Artist of Mongolia. Principal vocalist of the State Song and Dance Ensemble until 1990.',
  'a.1993': 'Awarded the Fukuoka Asian Culture Prize, Japan.',
  'a.1997': 'Named Hero of Labour of Mongolia, in recognition of introducing the long song to the world.',
  'a.2000': 'Voted Singer of the Century by the people of Mongolia.',
  'a.2002': 'Died 21 December. Her recordings of <em>Uyakhan zambuutivyn naran</em>, <em>Seruun saikhan khangai</em> and <em>Zeergentiin shil</em> remain the reference performances of the form.',

  // ---- Branch B: Banzragch ----
  'b.eyebrow': 'Branch Two — The Word',
  'b.name': 'Namsrain Banzragch',
  'b.meta': '1925–2003 · Prose, drama',
  'b.summary': 'A writer from Zavkhan and a laureate of the D. Natsagdorj Prize, he spent six decades setting Mongolian life — the road, the steppe, the ordinary household — into literature.',
  'b.portrait.caption': '[PLACEHOLDER: caption — what this photograph shows, and when.]',
  'b.1925': 'Born in Aldarkhan sum, Zavkhan province.',
  'b.1940': 'Began publishing short fiction — among the earliest, <em>Jiriin khuukhnuud</em> and <em>Tal nutgiin khavar</em>.',
  'b.1949': 'Married the singer Namjilyn Norovbanzad; the couple settled in Mandalgovi.',
  'b.1955': 'Wrote the play <em>Eemeg</em>.',
  'b.1964': 'Completed the National University’s evening literature programme.',
  'b.1967': 'Published the novel <em>Zam</em> (“The Road”) — runner-up for novel of the 20th century, after Ch. Lodoidamba’s <em>Tungalag Tamir</em>. Later translated into Russian (twice), Belarusian, Czech, and Romanian.',
  'b.1971': 'Completed the advanced course at the M. Gorky Literature Institute in Moscow.',
  'b.1978': 'Published the novel <em>Khoshuu tsagaan nutag</em>.',
  'b.1987': 'Received the Mongolian Writers’ Union Prize in 1980, and the D. Natsagdorj Prize in 1987.',
  'b.works.year': 'Collected works',
  'b.works': 'Short fiction and novellas including <em>Monkh zul</em>, <em>Aadryn daraa</em>, <em>Tsereg eriin duuli</em>, <em>Zambaga yagaan tsetseg</em>, <em>Ogloo</em> and <em>Neg golynkhon</em>.',
  'b.2003': 'Died one year after his wife.',

  // ---- Convergence / Foundation ----
  'c.eyebrow': 'Where the two strands meet',
  'c.title': 'One foundation, for a sung tradition and a written one.',
  'c.lede': 'The Norovbanzad Foundation was established in 2003 to carry forward the legacy of Namjilyn Norovbanzad and Namsrain Banzragch. It is chaired by Norovbanzad’s daughter, lawyer and historian Dr. B. Delgermaa. Its remit is deliberately double: the long song as living practice, and Mongolian literature as the written record of the same world.',
  'c.stat1': 'Singers taught',
  'c.stat2': 'Recordings preserved',
  'c.stat3': 'Titles republished',
  'c.stat4': 'Founded',
  'c.prog1.eyebrow': 'Long song',
  'c.prog1.title': '"Uyakhan Zambuutivyn Naran" Festival',
  'c.prog1.body': 'Held annually at Ikh Gazriin Chuluu with the Dundgovi Governor’s Office and the Ministry of Culture. Named for one of Norovbanzad’s signature songs, the festival draws around three thousand long-song singers, morin khuur players, and folk artists.',
  'c.prog2.eyebrow': 'Literature',
  'c.prog2.title': 'N. Banzragch Collected Works',
  'c.prog2.body': 'In 2008, for the Mongolian Writers’ Union’s 80th anniversary, the Foundation published a 25-volume collected works of N. Banzragch — 7 novels, 39 novellas, 158 stories, and 22 works translated into Russian, Spanish, Czech, Romanian, and Belarusian.',
  'c.prog3.eyebrow': 'Archive',
  'c.prog3.title': 'Memorial Museum',
  'c.prog3.body': 'Opened in 2013, the museum holds Norovbanzad’s stage costumes and instruments, her state honours, and Banzragch’s manuscripts and typewriter.',

  // ---- News & events ----
  'n.eyebrow': 'News and events',
  'n.title': 'What the Foundation is doing now.',
  'n.lede': 'Concerts, masterclasses, publications and archive releases. [PLACEHOLDER: name the real upcoming concerts, workshops, publications, or archive releases here.]',
  'n.upcoming': 'Upcoming',
  'n.recent': 'Recent',
  'n.ev1.title': '[PLACEHOLDER: event title]',
  'n.ev1.venue': '[PLACEHOLDER: venue, city]',
  'n.ev1.body': '[PLACEHOLDER: one or two sentences — what it is and who it is for.]',
  'n.ev1.cta': 'Details',
  'n.ev2.title': '[PLACEHOLDER: event title]',
  'n.ev2.venue': '[PLACEHOLDER: venue, city]',
  'n.ev2.body': '[PLACEHOLDER: one or two sentences — what it is and who it is for.]',
  'n.ev2.cta': 'Details',
  'n.po1.title': '[PLACEHOLDER: news headline]',
  'n.po1.body': '[PLACEHOLDER: two or three sentences summarising the news.]',
  'n.po2.title': '[PLACEHOLDER: news headline]',
  'n.po2.body': '[PLACEHOLDER: two or three sentences summarising the news.]',
  'n.po3.title': '[PLACEHOLDER: news headline]',
  'n.po3.body': '[PLACEHOLDER: two or three sentences summarising the news.]',
  'n.readmore': 'Read more',

  // ---- Shop ----
  'shop.eyebrow': 'Shop',
  'shop.title': 'Recordings and books.',
  'shop.lede': '[PLACEHOLDER: one sentence on what the Foundation sells and where the proceeds go — for example, that every purchase funds the teaching and archive programmes.]',
  'shop.notice': 'The online shop is not open yet. To order in the meantime, please <a href="#contact">contact the Foundation</a> directly.',
  'shop.p1.eyebrow': 'Recording',
  'shop.p1.title': '[PLACEHOLDER: album or recording title]',
  'shop.p1.desc': '[PLACEHOLDER: format, length, and what is on it.]',
  'shop.p2.eyebrow': 'Book',
  'shop.p2.desc': '[PLACEHOLDER: edition, language(s), page count, publisher.]',
  'shop.p3.eyebrow': 'Book',
  'shop.p3.title': '[PLACEHOLDER: collected short fiction]',
  'shop.p3.desc': '[PLACEHOLDER: which stories are collected, and in what edition.]',
  'shop.p4.eyebrow': 'Film',
  'shop.p4.desc': '[PLACEHOLDER: the 2006 documentary tribute — format and running time. Confirm the Foundation holds distribution rights before listing.]',
  'shop.unavailable': 'Not yet available',

  // ---- Support ----
  'sup.title': 'Help carry both strands forward.',
  'sup.body': '[PLACEHOLDER: a short invitation to support the Foundation — through giving, volunteering, or attending an event.]',
  'sup.cta1': 'Support the Foundation',
  'sup.cta2': 'Get in touch',

  // ---- Contact ----
  'ct.eyebrow': 'Contact',
  'ct.title': 'Get in touch.',
  'ct.body': 'For archive and research enquiries, performance and teaching requests, publishing rights, or orders while the shop is closed.',
  'ct.name': 'Name',
  'ct.email': 'Email',
  'ct.subject': 'Subject',
  'ct.message': 'Message',
  'ct.opt1': 'Archive or research enquiry',
  'ct.opt2': 'Performance or teaching request',
  'ct.opt3': 'Publishing and rights',
  'ct.opt4': 'Orders and shop',
  'ct.opt5': 'Supporting the Foundation',
  'ct.opt6': 'Something else',
  'ct.send': 'Send message',
  'ct.l.email': 'Email',
  'ct.l.phone': 'Phone',
  'ct.l.address': 'Address',
  'ct.l.follow': 'Follow',
  'ct.v.email': '[PLACEHOLDER: email address]',
  'ct.v.phone': '[PLACEHOLDER: +976 phone number]',
  'ct.v.address': '[PLACEHOLDER: street, district, Ulaanbaatar, Mongolia]',
  'ct.v.follow': '[PLACEHOLDER: Facebook / YouTube / Instagram]',
  'ct.err.fields': 'Please complete the required fields before sending.',
  'ct.err.noendpoint': 'The message form is not connected yet — please email the Foundation directly and we will reply.',

  // ---- Footer ----
  'f.tag': 'In honour of Namjilyn Norovbanzad, 1931–2002, and Namsrain Banzragch, 1925–2003.',
  'f.explore': 'Explore',
  'f.more': 'More',
  'f.support': 'Support',
  'f.rights': 'All rights reserved.'
};
