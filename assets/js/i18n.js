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
  'doc.title': 'Norovbanzad Foundation',
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
  'hero.title': '[PLACEHOLDER: title]',
  'hero.lede': '[PLACEHOLDER: one or two sentences introducing the Foundation.]',
  'hero.scroll': 'Scroll to explore',

  // ---- Branches intro ----
  'branches.eyebrow': '[PLACEHOLDER: subheading]',
  'branches.title': '[PLACEHOLDER: title]',
  'branches.note': '[PLACEHOLDER: one sentence introducing this section.]',

  // ---- Branch A: Norovbanzad ----
  'a.eyebrow': '[PLACEHOLDER: subheading]',
  'a.name': 'Namjilyn Norovbanzad',
  'a.meta': '1931–2002 · Long song (<em>urtiin duu</em>)',
  // Kept: sourced verbatim from the Foundation's own printed introduction brochure (supplied
  // 2026-09-30). See the matching comment in index.html.
  'a.summary': 'Over more than fifty years she performed on stages from La Scala to the Metropolitan, and the public crowned her the “Queen of Urtiin Duu.” [PLACEHOLDER: add more here if needed.]',
  'a.portrait.caption': '[PLACEHOLDER: caption — what this photograph shows, and when.]',
  'a.1931': '[PLACEHOLDER: what happened this year.]',
  'a.1940': '[PLACEHOLDER: what happened this year.]',
  'a.1942': '[PLACEHOLDER: what happened this year.]',
  'a.1946': '[PLACEHOLDER: what happened this year.]',
  'a.1949': '[PLACEHOLDER: what happened this year.]',
  'a.1957': '[PLACEHOLDER: what happened this year.]',
  'a.1961': '[PLACEHOLDER: what happened this year.]',
  'a.1969': '[PLACEHOLDER: what happened this year.]',
  'a.1990': '[PLACEHOLDER: what happened this year.]',
  'a.1993': '[PLACEHOLDER: what happened this year.]',
  'a.1997': '[PLACEHOLDER: what happened this year.]',
  'a.2000': '[PLACEHOLDER: what happened this year.]',
  // Kept: "Seruun saikhan khangai" and its UNESCO Golden Fund listing come verbatim from the
  // Foundation's own brochure. Exact death date removed — see the matching comment in index.html.
  'a.2002': '[PLACEHOLDER: date of death.] Her recording of <em>Seruun saikhan khangai</em> is registered in UNESCO’s Golden Fund archive.',

  // ---- Branch B: Banzragch ----
  'b.eyebrow': '[PLACEHOLDER: subheading]',
  'b.name': 'Namsrain Banzragch',
  'b.meta': '1925–2003 · Prose, drama',
  'b.summary': '[PLACEHOLDER: short description.]',
  'b.portrait.caption': '[PLACEHOLDER: caption — what this photograph shows, and when.]',
  'b.1925': '[PLACEHOLDER: what happened this year.]',
  'b.1940': '[PLACEHOLDER: what happened this year.]',
  'b.1949': '[PLACEHOLDER: what happened this year.]',
  'b.1955': '[PLACEHOLDER: what happened this year.]',
  // Kept: dated to 1964 in the bibliography/timeline chart from Banzragch's 2008 Collected Works
  // (supplied 2026-09-23).
  'b.1964': 'Completed the National University’s evening literature programme, and published his first novella, <em>Tal nutgiin khavar</em>.',
  // Kept: the translated-language list comes from the same bibliography chart. The "one of the
  // finest 20th-century Mongolian novels" claim was research/judgment, not from that document, and
  // has been removed.
  'b.1967': 'Published the novel <em>Zam</em> (“The Road”). Later translated into Russian (twice), Belarusian, Czech, and Romanian.',
  'b.1971': '[PLACEHOLDER: what happened this year.]',
  // Kept: 1978 is listed directly in the bibliography chart.
  'b.1978': 'Published the novel <em>Khoshuu tsagaan nutag</em>.',
  // Kept: both 1980 and 1987 (below) are dated in the same bibliography chart's awards list.
  'b.1980': 'Received the Mongolian Writers’ Union Prize.',
  'b.1987': 'Received the D. Natsagdorj Prize.',
  'b.1982': '[PLACEHOLDER: what happened this year.]',
  'b.2002': '[PLACEHOLDER: what happened this year.]',
  // Kept: this list and its 1965–1974 span come from the same bibliography chart.
  'b.works.year': '1965–1974',
  'b.works': 'In these same years, also wrote the novellas and short stories <em>Monkh zul</em>, <em>Aadryn daraa</em>, <em>Tsereg eriin duuli</em>, <em>Zambaga yagaan tsetseg</em>, and <em>Ogloo</em>.',
  'b.2003': '[PLACEHOLDER: what happened this year.]',

  // ---- Convergence / Foundation ----
  'c.eyebrow': 'About the Foundation',
  'c.title': '[PLACEHOLDER: title]',
  'c.lede': '[PLACEHOLDER: one or two sentences on what the Foundation does and who leads it.]',
  'c.stat1': 'Singers taught',
  'c.stat2': 'Recordings preserved',
  'c.stat3': 'Titles republished',
  'c.stat4': 'Founded',
  'c.prog1.eyebrow': 'Long song',
  'c.prog1.title': '[PLACEHOLDER: programme name]',
  'c.prog1.body': '[PLACEHOLDER: programme description.]',
  'c.prog2.eyebrow': 'Literature',
  'c.prog2.title': 'N. Banzragch Collected Works',
  // Kept: the translated-language list matches b.1967, sourced from the bibliography chart.
  // Volume/story counts and the anniversary framing were not confirmed against that document, so
  // removed — see the matching comment in index.html.
  'c.prog2.body': 'In 2008, the Foundation published the Collected Works of N. Banzragch, including works translated into Russian, Czech, Romanian, and Belarusian. [PLACEHOLDER: volume, novel, and novella counts.]',
  'c.prog3.eyebrow': 'Archive',
  'c.prog3.title': '[PLACEHOLDER: programme name]',
  'c.prog3.body': '[PLACEHOLDER: programme description.]',

  // ---- News & events ----
  'n.eyebrow': 'News and events',
  'n.title': '[PLACEHOLDER: title]',
  'n.lede': '[PLACEHOLDER: name the real upcoming concerts, workshops, publications, or archive releases here.]',
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
  'shop.title': '[PLACEHOLDER: title]',
  'shop.lede': '[PLACEHOLDER: one sentence on what the Foundation sells and where the proceeds go — for example, that every purchase funds the teaching and archive programmes.]',
  'shop.notice': 'The online shop is not open yet. To order in the meantime, please <a href="#contact">contact the Foundation</a> directly.',
  'shop.p1.eyebrow': 'Recording',
  'shop.p1.title': '[PLACEHOLDER: album or recording title]',
  'shop.p1.desc': '[PLACEHOLDER: format, length, and what is on it.]',
  'shop.p2.eyebrow': 'Book',
  'shop.p2.title': 'Zam',
  'shop.p2.desc': '[PLACEHOLDER: edition, language(s), page count, publisher.]',
  'shop.p3.eyebrow': 'Book',
  'shop.p3.title': '[PLACEHOLDER: collected short fiction]',
  'shop.p3.desc': '[PLACEHOLDER: which stories are collected, and in what edition.]',
  'shop.p4.eyebrow': 'Film',
  'shop.p4.title': '[PLACEHOLDER: the film’s Mongolian title] <span class="product__title-alt">(released in English as World-Cherished Mongolian Treasure)</span>',
  'shop.p4.desc': '[PLACEHOLDER: the 2006 documentary tribute — format and running time. Confirm the Foundation holds distribution rights before listing.]',
  'shop.unavailable': 'Not yet available',

  // ---- Support ----
  'sup.title': '[PLACEHOLDER: title]',
  'sup.body': '[PLACEHOLDER: a short invitation to support the Foundation — through giving, volunteering, or attending an event.]',
  'sup.cta1': 'Support the Foundation',
  'sup.cta2': 'Get in touch',

  // ---- Contact ----
  'ct.eyebrow': 'Contact',
  'ct.title': '[PLACEHOLDER: title]',
  'ct.body': '[PLACEHOLDER: one sentence introducing the contact section.]',
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
