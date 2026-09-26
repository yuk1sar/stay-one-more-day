import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import english from './en.json';
import azerbaijani from './az.json';
import support from './support.json';
import ui from './ui.json';
import author from './author.json';
import SendLetter from './SendLetter.jsx';
import './style.css';

const KEY = 'stay-one-more-day.note.v1';
const LANGUAGE_KEY = 'stay-one-more-day.language';
const steps = [
  ['Найди более безопасное место', 'Отойди от всего, чем можно причинить себе вред. Если можешь, попроси другого человека убрать это и побыть рядом.'],
  ['Почувствуй опору', 'Сядь поудобнее. Почувствуй пол под ногами. Посмотри вокруг и назови пять вещей, которые видишь. Не нужно делать это идеально.'],
  ['Позови кого-то', 'Напиши человеку, которому доверяешь: «Мне сейчас очень тяжело. Можешь позвонить или побыть со мной?» Если никто не отвечает — обратись на линию помощи.'],
  ['Позаботься о простом', 'Сделай глоток воды. Возьми плед. Выбери одно маленькое действие, которое сейчас по силам.']
];
function App() {
  const [language, setLanguage] = useState(() => { try { const requested = new URLSearchParams(window.location.search).get('lang'); if (['ru', 'en', 'az'].includes(requested)) return requested; const stored = localStorage.getItem(LANGUAGE_KEY); return ['ru', 'en', 'az'].includes(stored) ? stored : 'ru'; } catch { return 'ru'; } });
  const dictionary = language === 'az' ? azerbaijani : language === 'en' ? english : null;
  const t = key => dictionary?.[key] ?? key;
  const locale = ui[language];
  const lovedOne = support[language];
  const letter = author[language];
  const [seconds, setSeconds] = useState(600);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  const [step, setStep] = useState(0);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState('');
  const [status, setStatus] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [country, setCountry] = useState('');
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = locale.title;
    document.querySelector('meta[name="description"]').content = locale.description;
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Language still works for this visit. */ }
  }, [language]);
  useEffect(() => { try { const value = localStorage.getItem(KEY) || ''; setNote(value); setSaved(value); } catch { setStatus('Хранилище браузера недоступно. Текст можно написать и скопировать вручную.'); } }, []);
  useEffect(() => {
    if (!running) return;
    const tick = () => { const left = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)); setSeconds(left); if (!left) setRunning(false); };
    tick(); const interval = setInterval(tick, 250); return () => clearInterval(interval);
  }, [running]);
  useEffect(() => { const guard = e => { if (note !== saved) { e.preventDefault(); e.returnValue = ''; } }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [note, saved]);
  const start = () => { deadline.current = Date.now() + (seconds || 600) * 1000; if (!seconds) setSeconds(600); setRunning(true); };
  const save = () => { try { localStorage.setItem(KEY, note); setSaved(note); setStatus('Сохранено в этом браузере. Можно вернуться позже.'); } catch { setStatus('Не удалось сохранить. Скопируй текст, чтобы не потерять его.'); } };
  const remove = () => { try { localStorage.removeItem(KEY); setNote(''); setSaved(''); setStatus('Заметка удалена из этого браузера.'); setConfirmDelete(false); } catch { setStatus('Не удалось удалить заметку. Проверь настройки хранилища браузера.'); } };
  const lines = (...keys) => keys.map((key, i) => <React.Fragment key={key}>{i > 0 && <br/>}{t(key)}</React.Fragment>);
  return <>
    <a className="skip" href="#main">{t('Перейти к содержимому')}</a>
    <header className="header wrap">
      <a className="brand" href="#"><span className="brand-icon" aria-hidden="true">Ⅱ</span>{t('ЕЩЁ ОДИН ДЕНЬ')}<span className="brand-small">{t('пространство поддержки')}</span></a>
      <nav aria-label={t('Основная навигация')}><a href="#wall">{t('Слова рядом')}</a><a href="#note">{t('Записка себе')}</a><a className="loved-one-link" href="#support">{lovedOne.nav}</a><a className="help-link" href="#help">{t('Нужна помощь')} ↗</a></nav>
      <div className="language-switch" role="group" aria-label={locale.languageLabel}>{['ru', 'en', 'az'].map(code => <button type="button" key={code} lang={code} aria-label={{ru:'Русский', en:'English', az:'Azərbaycanca'}[code]} aria-pressed={language === code} onClick={() => setLanguage(code)}>{code.toUpperCase()}</button>)}</div>
    </header>
    <main id="main">
      <section className="hero wrap" aria-labelledby="hero-title"><div className="hero-copy">
        <p className="eyebrow"><span className="red-line"/>{t('ТЫ ЗДЕСЬ. ЭТО УЖЕ ЧТО-ТО.')}</p>
        <h1 id="hero-title">{lines('ОСТАНЬСЯ', 'ЕЩЁ НА')}<br/><span className="red-word">{t('ДЕНЬ.')}</span></h1>
        <p className="hero-description">{lines('Сейчас не нужно решать всю жизнь.', 'Давай начнём с ближайших десяти минут.')}</p>
        <div className="hero-actions"><a className="button primary" href="#pause">{t('Останься ещё на 10 минут')} <span aria-hidden="true">↗</span></a><a className="text-link" href="#now">{t('Мне тяжело прямо сейчас ↓')}</a></div><p className="small hero-foot">{t('Не знаешь, с чего начать? Можно просто побыть здесь.')}</p>
      </div><figure className="hero-art"><span className="tape top-tape" aria-hidden="true"/><img src="/art.png" alt={t('Зернистый бумажный коллаж: две руки держатся друг за друга, вокруг — веточки и обрывки бумаги.')} width="1086" height="1448"/><span className="art-stamp">{lines('НЕ ОБЯЗАТЕЛЬНО','СПРАВЛЯТЬСЯ В ОДИНОЧКУ')}</span><figcaption>{t('фрагмент № 01 / держаться друг за друга')}</figcaption><span className="art-cross" aria-hidden="true">+</span></figure></section>
      <div className="ticker" aria-hidden="true"><span>{t('ОДИН ВДОХ')}</span><b>✳</b><span>{t('ОДИН МАЛЕНЬКИЙ ШАГ')}</span><b>✳</b><span>{t('ЕЩЁ ОДИН ДЕНЬ')}</span><b>✳</b><span>{t('В ТВОЁМ ТЕМПЕ')}</span></div>
      <section className="section wrap" id="wall"><div className="section-top"><p className="eyebrow">{t('01 / СЛОВА РЯДОМ')}</p><p className="small">{t('возьми то, что сейчас отзывается')}</p></div><div className="collage">
        <article className="paper paper-one"><span className="tape" aria-hidden="true"/><span className="small">{t('запомни, пожалуйста')}</span><h2>{lines('ТЫ НЕ ОБЯЗАН','ТАЩИТЬ')}<br/><em>{t('ВСЁ ОДИН.')}</em></h2><span className="handwritten">{t('можно попросить о помощи.')}</span></article>
        <article className="paper paper-two"><span className="paper-mark" aria-hidden="true">✳</span><h2>{lines('ТЕБЕ МОЖНО','БЫТЬ','НЕ В ПОРЯДКЕ.')}</h2><p>{t('Тебе не нужно заслуживать поддержку.')}</p></article>
        <article className="paper paper-three"><span className="small">{t('небольшое напоминание')}</span><h2>{lines('ТЫ —','БОЛЬШЕ,','ЧЕМ ЭТОТ')}<br/><span>{t('МОМЕНТ.')}</span></h2><p>{lines('Сейчас трудно.','И сейчас можно быть не одному.')}</p></article>
      </div></section>
      <figure className="quote-card wrap"><span className="tape" aria-hidden="true"/><p className="eyebrow">{locale.quoteHeading}</p><blockquote lang="en">“If you’re that depressed, reach out to someone. And remember, suicide is a permanent solution to a temporary problem.”</blockquote>
        {locale.quoteTranslation && <p className="quote-translation">{locale.quoteTranslation}</p>}
        <figcaption>— <a href="https://quotefancy.com/robin-williams-quotes" target="_blank" rel="noreferrer">Robin Williams ↗</a><span>{locale.quoteAttribution}</span></figcaption><p className="quote-context">{locale.quoteContext}</p>
      </figure>
      <section className="section now-section" id="now"><div className="wrap"><p className="eyebrow">{t('02 / ПРЯМО СЕЙЧАС')}</p><div className="two-col"><div><h2 className="section-title">{lines('ЕСЛИ ТЕБЕ','ТЯЖЕЛО')}<br/><span className="outline">{t('ПРЯМО СЕЙЧАС.')}</span></h2><p className="muted">{lines('Не надо проходить всё по списку.','Начни с одного посильного шага.')}</p><a className="text-link" href="#help">{t('Мне нужна помощь человека ↗')}</a></div>
        <div className="steps"><div className="urgent"><strong>{t('Если есть риск, что ты навредишь себе сейчас')}</strong><p>{t('Позвони в местную экстренную службу или попроси человека рядом сделать это. Если уже есть травма или отравление — нужна немедленная медицинская помощь. Не жди окончания таймера.')}</p><a href="#help">{t('Открыть контакты помощи ↗')}</a></div>
          <div className="step-tabs" role="group" aria-label={t('Выбери небольшой шаг')}>{steps.map((item,i) => <button key={i} aria-pressed={step === i} onClick={() => setStep(i)} aria-label={`${t('Шаг')} ${i+1}: ${t(item[0])}`}>0{i+1}</button>)}</div>
          <div className="step-content" aria-live="polite"><span className="eyebrow">{t('ШАГ 0')}{step+1} / 04</span><h3>{t(steps[step][0])}</h3><p>{t(steps[step][1])}</p></div><button className="text-button" onClick={() => setStep((step+1)%steps.length)}>{t(step === 3 ? 'Вернуться к первому шагу' : 'Следующий маленький шаг')} <span aria-hidden="true">→</span></button>
        </div></div></div></section>
      <section className="section wrap pause-section" id="pause"><div><p className="eyebrow">{t('03 / НЕМНОГО ВРЕМЕНИ')}</p><h2 className="section-title">{t('НЕ ВСЯ ЖИЗНЬ.')}<br/><span className="red-word">{t('ТОЛЬКО 10 МИНУТ.')}</span></h2><p className="muted">{lines('Можно просто посидеть здесь. Почувствовать опору.','И связаться с кем-то, кто сможет побыть рядом.')}</p><p className="small">{t('Побудь здесь эти десять минут. Не нужно за это время искать ответы на всё.')}</p></div>
        <div className="timer-card"><span className="tape" aria-hidden="true"/><p className="eyebrow">{t('ЭТО ВРЕМЯ — ДЛЯ ТЕБЯ')}</p><div className="timer" role="timer" aria-label={locale.timerLabel.replace('{minutes}', Math.floor(seconds/60)).replace('{seconds}', seconds%60)}>{String(Math.floor(seconds/60)).padStart(2,'0')}<span>:</span>{String(seconds%60).padStart(2,'0')}</div><div className="timer-progress" aria-hidden="true"><span style={{width:`${(600-seconds)/6}%`}}/></div><button className="button dark" onClick={() => running ? setRunning(false) : start()}>{t(running ? 'Поставить на паузу' : seconds === 0 ? 'Ещё 10 минут' : seconds < 600 ? 'Продолжить' : 'Побыть здесь 10 минут')} <span aria-hidden="true">{running ? 'Ⅱ' : '→'}</span></button><p className="timer-status" role="status">{t(seconds === 0 ? 'Десять минут прошли. Какой шаг сейчас по силам? Можно связаться с человеком.' : running ? 'Дыши спокойно. У тебя всё получится.' : 'Таймер закончится. Твоя жизнь продолжается.')}</p><a href="#help">{t('Обратиться за помощью ↗')}</a></div>
      </section>
      <section className="section note-section" id="note"><div className="wrap two-col"><div><p className="eyebrow">{t('04 / ЗАПИСКА СЕБЕ')}</p><h2 className="section-title">{lines('ОСТАВЬ','ПАРУ СЛОВ')}<br/><span className="outline">{t('НА ЗАВТРА.')}</span></h2><p className="muted">{t('Напиши себе несколько слов на завтра. О песне, которую хочется услышать снова. О человеке, которому давно собираешься позвонить. О чём-то, чего ждёшь, пусть даже совсем маленьком.')}</p><p className="small privacy">{t('Если выбрать «Сохранить себе», записка останется только в твоём браузере. Если очистить его данные, она исчезнет. Отправить текст автору можно отдельно — по кнопке ниже.')}</p></div>
        <div className="notepad"><span className="tape" aria-hidden="true"/><label htmlFor="note-text">{t('ДОРОГОЙ Я,')}</label><textarea id="note-text" placeholder={t('Сегодня мне хочется сказать себе…')} value={note} maxLength={3000} onChange={e => {setNote(e.target.value); setStatus(''); setConfirmDelete(false);}}/><div className="note-meta"><span>{note.length} / 3000</span><span>{t(note !== saved ? 'есть несохранённые слова' : saved ? 'сохранено' : 'только для тебя')}</span></div><div className="note-actions"><button className="button dark" onClick={save} disabled={note === saved}>{t('Сохранить себе ↗')}</button><button className="text-button" disabled={!note && !saved} onClick={() => setConfirmDelete(true)}>{t('Удалить')}</button></div>{confirmDelete && <div className="delete-confirm"><p>{t('Удалить записку? Вернуть её не получится.')}</p><button onClick={remove}>{t('Да, удалить')}</button><button onClick={() => setConfirmDelete(false)}>{t('Оставить')}</button></div>}<p className="save-status" role="status">{t(status)}</p><SendLetter text={note} language={language}/></div>
      </div></section>
      <section className="section wrap author-section" id="author" aria-labelledby="author-title">
        <div className="author-letter"><img className="author-art" src="/author-letter.png" alt="" width="2172" height="724" loading="lazy"/><div className="author-copy">
          <h2 id="author-title">{letter.title}</h2>
          {letter.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <p className="author-closing">{letter.closing} <strong>{letter.emphasis}</strong></p>
        </div></div>
      </section>
      <section className="section support-section" id="support" aria-labelledby="support-title"><div className="wrap">
        <div className="support-heading"><div><p className="eyebrow">{lovedOne.eyebrow}</p><h2 className="section-title" id="support-title">{lovedOne.title}</h2></div><p className="muted">{lovedOne.intro}</p></div>
        <ol className="support-list">{lovedOne.steps.map(([title, body], index) => <li key={index}><span className="support-number" aria-hidden="true">0{index+1}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
        <div className="support-footer"><a className="button primary" href="#help">{lovedOne.cta}</a><a className="small" href="https://www.nimh.nih.gov/health/publications/5-action-steps-to-help-someone-having-thoughts-of-suicide" target="_blank" rel="noreferrer">{lovedOne.source}</a></div>
      </div></section>
      <section className="section wrap help-section" id="help"><p className="eyebrow">{t('05 / ЧЕЛОВЕК НА ДРУГОМ КОНЦЕ')}</p><div className="two-col"><h2 className="section-title">{t('ПОМОЩЬ')}<br/><span className="red-word">{t('ЕСТЬ.')}</span></h2><div><p className="help-intro">{t('Можно начать с одной фразы:')}<br/><strong>{lines('«Мне небезопасно оставаться одному.','Мне нужна помощь».')}</strong></p><label className="country-label" htmlFor="country">{t('Где ты сейчас?')}</label><select id="country" value={country} onChange={e => setCountry(e.target.value)}><option value="">{t('Выбери страну')}</option><option value="ru">{t('Россия')}</option><option value="az">{t('Азербайджан')}</option><option value="other">{t('Другая страна')}</option></select>
        <div className="contacts">{['ru','az'].includes(country) ? <a className="contact" href="tel:112"><span><strong>112</strong><small>{t('Экстренная помощь ·')} {t(country === 'ru' ? 'Россия' : 'Азербайджан')}<br/>{t('При непосредственной угрозе жизни')}</small></span><span aria-hidden="true">↗</span></a> : <p className="emergency-text">{t('При угрозе жизни позвони по местному номеру экстренной помощи или обратись в ближайшее отделение неотложной помощи.')}</p>}<a className="contact" href="https://findahelpline.com/" target="_blank" rel="noreferrer"><span><strong className="directory-title">{t('Найти линию поддержки')}</strong><small>{lines('Find A Helpline · выбор страны и способа связи','Откроется внешний сайт')}</small></span><span aria-hidden="true">↗</span></a></div><p className="small">{t('Доступность, язык и часы работы зависят от выбранной службы.')}</p>
        <details className="sources"><summary>{t('Источники контактов и рекомендаций')}</summary><a href="https://moscow.mchs.gov.ru/kontakty" target="_blank" rel="noreferrer">{t('МЧС России — 112 ↗')}</a><a href="https://fhn.gov.az/ru/kontakty/telefonnaia-sluzba-112" target="_blank" rel="noreferrer">{t('МЧС Азербайджана — 112 ↗')}</a><a href="https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/help-for-suicidal-thoughts/" target="_blank" rel="noreferrer">{t('NHS — поддержка при суицидальных мыслях ↗')}</a><p>{t('Контакты проверены 26 сентября 2026 года.')}</p></details>
      </div></div></section>
    </main>
    <footer className="wrap"><div className="footer-top"><a className="brand" href="#">{t('Ⅱ ЕЩЁ ОДИН ДЕНЬ')}</a><span>{t('ТВОЯ ИСТОРИЯ ЕЩЁ ПИШЕТСЯ.')}</span></div><p>{t('Этот сайт не заменяет профессиональную психологическую или медицинскую помощь. Записки, сохранённые себе, остаются в браузере; письма, отправленные автору, приходят ему в Telegram. Автор не оказывает экстренную помощь и не может ответить через сайт. Если ты в опасности, обратись в экстренную службу прямо сейчас.')}</p><span className="small">{t('Сделано с заботой. Для следующего маленького шага.')}</span></footer><a className="floating-help" href="#help">{t('Нужна помощь ↗')}</a>
  </>;
}
createRoot(document.getElementById('root')).render(<App/>);
