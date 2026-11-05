"""Render the bilingual static website from local content, without a framework."""
import json
from html import escape as e
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COPY = json.loads((ROOT / 'content/translations.json').read_text())
PRODUCTS = json.loads((ROOT / 'content/products.json').read_text())
PAGES = ('index', 'about', 'products', 'services', 'projects', 'privacy')
CATALOGUE = 'https://drive.google.com/file/d/1QSCUBZcM3y0OD1u3vPb5KYfSu9179oac/view'
EN_PRODUCTS = ['Pole-mounted transformer substation', 'General-purpose transformer substation', 'Dead-end kiosk transformer substation', 'Insulated block-modular transformer substation', 'Pass-through kiosk transformer substation', 'Urban network transformer substation', '35/0.4 kV block transformer substation', 'KSO-285 / KSO-272 cells', 'KSO-393 / KSO-299 cells', 'KSO-214S cells', 'ShO-90 distribution board panels', 'DC control cabinet', 'Capacitor units', 'Enclosed switchgear', 'Mobile containerised power supply unit', 'Complete switchgear', 'Block-type complete power supply unit']


def url(page, lang):
    prefix = '/en/' if lang == 'en' else '/'
    return prefix if page == 'index' else prefix + page


def image(name, alt='', cls='', eager=False):
    return f'<img class="{cls}" src="/assets/{name}.webp" alt="{e(alt)}" loading="{"eager" if eager else "lazy"}" decoding="async" width="1400" height="1000">'


def contact(t, lang):
    return f'''<section class="section contact" id="contacts" aria-labelledby="contact-heading">
      <div><p class="eyebrow">{e(t['nav'][4])}</p><h2 id="contact-heading">{e(t['contactTitle'])}</h2><p>{e(t['contactIntro'])}</p>
      <address><a href="tel:+380332788678">0332 78-86-78</a><a href="mailto:office@elservis.com.ua">office@elservis.com.ua</a><p>{e(t['address'])}</p></address>
      <a class="text-link" href="https://www.google.com/maps/search/?api=1&amp;query=50.75326%2C25.26168" target="_blank" rel="noopener noreferrer">{e(t['map'])} ↗</a></div>
      <form class="contact-form" method="post" data-contact-form aria-label="{e(t['contactTitle'])}">
        <label for="contact-name">{e(t['name'])}<input id="contact-name" name="Name" autocomplete="name" required maxlength="100"></label>
        <label for="contact-phone">{e(t['phone'])}<input id="contact-phone" name="Phone" type="tel" autocomplete="tel" required maxlength="30" placeholder="+380 …"></label>
        <label for="contact-message">{e(t['message'])} <span class="muted">({e(t['optional'])})</span><textarea id="contact-message" name="Message" rows="4" maxlength="4000"></textarea></label>
        <div class="honeypot" aria-hidden="true"><label>Website<input name="_hp_email" tabindex="-1" autocomplete="off"></label></div>
        <label class="consent"><input name="consent" type="checkbox" required><span>{e(t['consent'])} <a href="{url('privacy',lang)}">{e(t['privacy'])}</a>.</span></label>
        <button class="button" type="submit">{e(t['send'])} <span aria-hidden="true">↗</span></button>
        <p class="form-status" role="status" aria-live="polite" aria-atomic="true"></p>
      </form></section>'''


def stats(t):
    return '<dl class="stats">'+''.join(f'<div><dt>{e(t[key])}</dt><dd>{number}<span>+</span></dd></div>' for key,number in [('years','29'),('projects','1000'),('team','180')])+'</dl>'


def services(t, lang):
    return '<div class="service-grid">'+''.join(f'''<article class="service-card" data-reveal>{image(photo,t['serviceNames'][i])}<div class="card-copy"><span class="index">0{i+1}</span><h3>{e(t['serviceNames'][i])}</h3><p>{e(t['serviceDescriptions'][i])}</p><a class="text-link" href="#contacts">{e(t['contactAction'])} ↗</a></div></article>''' for i,photo in enumerate(['engineering','installation','commissioning']))+'</div>'


def partners(t):
    names={'abb':'ABB','stalev':'Stalev','svaltera':'Svaltera','electro-system':'Електросистеми','portcity':'PortCity','kromberg-schubert':'Kromberg & Schubert','pankurchak':'Пан Курчак'}
    return f'<section class="section partners"><h2>{e(t["partners"])}</h2><div>'+''.join(image('partner-'+key,name) for key,name in names.items())+'</div></section>'


def project_cards(t, lang, full=False):
    cards=''
    for i,photo in enumerate(['substation','power-lines','project-site']):
        cards+=f'<article class="project-card" data-reveal>{image(photo,t["projectNames"][i])}<div><span class="eyebrow">0{i+1}</span><h3>{e(t["projectNames"][i])}</h3><p>{e(t["projectDescriptions"][i])}</p><a class="text-link" href="{url("projects",lang)+"#project-gallery" if not full else "#contacts"}">{e(t["gallery"] if not full else t["contactAction"])} ↗</a></div></article>'
    return '<div class="project-list">'+cards+'</div>'


def product_cards(t, lang, preview=False):
    cards=''
    items=PRODUCTS[:4] if preview else PRODUCTS
    for i,p in enumerate(items):
        title=EN_PRODUCTS[i] if lang=='en' else p['title'].replace('підстанціїї','підстанції')
        technical=f'<p class="muted">{e(t["specLanguage"])}</p>' if lang=='en' else ''
        cards+=f'''<article class="product-card" id="{p['id']}" data-category="{e(p['category'])}">
        <span class="product-category">{e(p['category'])}</span><span class="product-symbol" aria-hidden="true">↯</span><h3>{e(title)}</h3>
        <details><summary>{e(t['details'])}</summary>{technical}<div lang="uk">{e(p['summary'])}<p>{e(p['specification'])}</p></div></details>
        <a class="text-link" href="#contacts">{e(t['request'])} ↗</a></article>'''
    return '<div class="product-grid" id="product-grid">'+cards+'</div>'


def content(page,t,lang):
    if page=='index':
        return f'''<section class="hero"><picture><source media="(max-width: 700px)" srcset="/assets/hero-small.webp"><img class="hero-image" src="/assets/hero.webp" width="1400" height="1600" alt="" fetchpriority="high"></picture><div class="hero-content"><p class="eyebrow">{e(t['eyebrow'])}</p><h1>{t['hero']}</h1><p class="hero-intro">{e(t['intro'])}</p><div class="actions"><a class="button button-light" href="#contacts">{e(t['contactAction'])} ↗</a><a class="hero-link" href="{url('about',lang)}">{e(t['learn'])} →</a></div><p class="voltage">{e(t['voltage'])} <strong>0.4–110 kV</strong></p></div></section>
        <div class="container">{stats(t)}<section class="section split"><div><p class="eyebrow">{e(t['nav'][0])}</p><h2>{e(t['aboutTitle'])}</h2><p>{e(t['aboutIntro'])}</p><a class="text-link" href="{url('about',lang)}">{e(t['learn'])} →</a></div>{image('workshop',t['production'])}</section>
        <section class="section"><div class="section-heading"><div><p class="eyebrow">{e(t['nav'][2])}</p><h2>{t['servicesTitle']}</h2></div></div>{services(t,lang)}</section>
        <section class="section"><div class="section-heading"><div><p class="eyebrow">{e(t['nav'][1])}</p><h2>{t['productsTitle']}</h2></div><a class="text-link" href="{url('products',lang)}">{e(t['catalog'])} →</a></div>{product_cards(t,lang,True)}</section>
        <section class="section"><p class="eyebrow">{e(t['benefits'])}</p><div class="benefit-grid">{''.join(f'<article data-reveal><span class="index">0{i+1}</span><h2>{e(name)}</h2><p>{e(t["benefitTexts"][i])}</p></article>' for i,name in enumerate(t['benefitNames']))}</div></section>
        <section class="section"><p class="eyebrow">{e(t['nav'][3])}</p><h2>{t['projectsTitle']}</h2>{project_cards(t,lang)}</section>{partners(t)}{contact(t,lang)}</div>'''
    headings={'about':('aboutTitle','aboutIntro'),'services':('servicesTitle','servicesIntro'),'products':('productsTitle','productsIntro'),'projects':('projectsTitle','projectsIntro'),'privacy':('privacyTitle','privacyIntro')}
    title,intro=headings[page]
    opening=f'<div class="container"><section class="page-heading"><p class="eyebrow">{e(t["eyebrow"])}</p><h1>{t[title]}</h1><p>{e(t[intro])}</p></section>'
    body=''
    if page=='about':
        body=f'''{stats(t)}<section class="section split">{image('workshop',t['production'])}<div><h2>{e(t['structure'])}</h2><ul class="department-list">{''.join('<li>'+e(x)+'</li>' for x in t['departments'])}</ul></div></section><section class="section split"><div><h2>{e(t['production'])}</h2><p>{e(t['productionText'])}</p><p><strong>2200+</strong> {e(t['equipment'])}</p></div>{image('installation',t['production'])}</section>{partners(t)}'''
    elif page=='services':body=f'<section class="section section-first">{services(t,lang)}</section>'
    elif page=='products':
        categories=list(dict.fromkeys(p['category'] for p in PRODUCTS))
        examples=['Transformer substations','Switchgear','Distribution equipment'] if lang=='en' else ['Трансформаторні підстанції','Комірки та щити','Розподільче обладнання']
        showcase='<div class="equipment-showcase">'+''.join('<figure>'+image(photo,caption)+'<figcaption>'+e(caption)+'</figcaption></figure>' for photo,caption in zip(['equipment','switchgear','distribution'],examples))+'</div>'
        body=f'''{showcase}<section class="section section-first" aria-label="{e(t['nav'][1])}"><div class="catalog-toolbar"><div class="filters" role="group" aria-label="{e(t['nav'][1])}"><button type="button" class="filter" data-filter="all" aria-pressed="true">{e(t['all'])}</button>{''.join(f'<button type="button" class="filter" data-filter="{e(cat)}" aria-pressed="false">{e(cat)}</button>' for cat in categories)}</div><p id="product-count" role="status" data-unit="{e(t['count'])}">17 {e(t['count'])}</p></div>{product_cards(t,lang)}<p><a class="button" href="{CATALOGUE}" target="_blank" rel="noopener noreferrer">{e(t['catalogDownload'])} ↗</a></p></section>'''
    elif page=='projects':
        body=f'''<section class="section section-first">{project_cards(t,lang,True)}</section><section class="section" id="project-gallery"><h2>{e(t['gallery'])}</h2><div class="gallery">{''.join(f'<button type="button" class="gallery-trigger" data-photo="/assets/project-{i}.webp" aria-label="{e(t["openPhoto"])} {i}">{image("project-"+str(i),t["projectNames"][0]+" · "+str(i))}</button>' for i in range(1,9))}</div></section><dialog id="photo-dialog" aria-label="{e(t['gallery'])}"><div class="dialog-toolbar"><button class="icon-button" type="button" data-photo-prev aria-label="{e(t['prev'])}">←</button><span id="photo-count" aria-live="polite"></span><button class="icon-button" type="button" data-photo-next aria-label="{e(t['next'])}">→</button><button class="icon-button" type="button" data-photo-close aria-label="{e(t['close'])}">×</button></div><img id="dialog-photo" alt="{e(t['projectNames'][0])}" width="1400" height="1000"></dialog>'''
    elif page=='privacy':body='<article class="prose">'+''.join(f'<section><h2>{e(title)}</h2><p>{e(text)}</p></section>' for title,text in t['privacySections'])+'</article>'
    return opening+body+(contact(t,lang) if page!='privacy' else '')+'</div>'


def render(page,lang):
    t=COPY[lang];other='en' if lang=='uk' else 'uk'
    title=t['brand']+' — '+(t['footer'] if page=='index' else t['nav'][['about','products','services','projects'].index(page)] if page!='privacy' else t['privacy'])
    nav=''.join(f'<a href="{url(name,lang)}"'+(' aria-current="page"' if page==name else '')+'>'+e(label)+'</a>' for name,label in zip(['about','products','services','projects'],t['nav']))+f'<a href="{url("index",lang)}#contacts">{e(t["nav"][4])}</a>'
    document = f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#12549a"><title>{e(title)}</title><meta name="description" content="{e(t['intro'])}"><link rel="canonical" href="https://elservice.netlify.app{url(page,lang)}"><link rel="alternate" hreflang="uk" href="https://elservice.netlify.app{url(page,'uk')}"><link rel="alternate" hreflang="en" href="https://elservice.netlify.app{url(page,'en')}"><meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(t['intro'])}"><meta property="og:type" content="website"><meta property="og:url" content="https://elservice.netlify.app{url(page,lang)}"><meta property="og:image" content="https://elservice.netlify.app/assets/substation.webp"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/site.css"><script src="/assets/site.js" defer></script><script src="/assets/contact.js" defer></script></head>
<body><a class="skip-link" href="#main-content">{e(t['skip'])}</a><header class="site-header"><div class="header-inner"><a class="brand" href="{url('index',lang)}" aria-label="{e(t['brand'])} — {e(t['home'])}"><img src="/assets/brand.webp" alt="{e(t['brand'])}" width="260" height="52"></a><nav id="site-navigation" aria-label="{e(t['home'])}"><button class="menu-close icon-button" type="button" aria-label="{e(t['close'])}">×</button>{nav}</nav><div class="header-actions"><a class="header-phone" href="tel:+380332788678">0332 78-86-78</a><a class="language-switch" lang="{other}" href="{url(page,other)}" aria-label="{e(t['language'])}">{e(t['langLabel'])}</a><button id="menu-toggle" class="icon-button" type="button" aria-label="{e(t['menu'])}" aria-expanded="false" aria-controls="site-navigation"><span aria-hidden="true">☰</span></button></div></div></header><div class="menu-backdrop" hidden></div>
<main id="main-content" tabindex="-1">{content(page,t,lang)}</main>
<footer class="site-footer"><div class="container footer-grid"><div><a class="footer-brand" href="{url('index',lang)}">{e(t['brand'])}</a><p>{e(t['footer'])}</p><p>{e(t['address'])}</p></div><nav aria-label="{e(t['nav'][4])}">{nav}</nav><div><a href="tel:+380332788678">0332 78-86-78</a><a href="mailto:office@elservis.com.ua">office@elservis.com.ua</a><a href="{url('privacy',lang)}">{e(t['privacy'])}</a></div></div></footer></body></html>'''
    arrow = '<svg class="arrow-icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 18 18 6M6 6h12v12" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'
    bolt = '<svg aria-hidden="true" viewBox="0 0 64 64"><path d="M36 6 14 36h18l-5 22 23-32H33z" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
    return document.replace('↗', arrow).replace('↯', bolt)


def generate(output):
    for lang in COPY:
        directory=output/'en' if lang=='en' else output
        directory.mkdir(parents=True,exist_ok=True)
        for page in PAGES:(directory/(page+'.html')).write_text(render(page,lang))

if __name__=='__main__':generate(ROOT)
