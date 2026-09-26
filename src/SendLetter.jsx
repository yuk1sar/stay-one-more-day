import React, { useEffect, useRef, useState } from 'react';
import copy from './letters.json';

export default function SendLetter({ text, language }) {
  const c = copy[language];
  const [open, setOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState('');
  const [website, setWebsite] = useState('');
  const [sentText, setSentText] = useState(null);
  const [mode, setMode] = useState('reply');
  const [prepared, setPrepared] = useState(null);
  useEffect(() => { setConsent(false); setPrepared(null); setState(''); }, [text, mode]);
  const busy = useRef(false);
  const send = async () => {
    if (busy.current || !consent || !text.trim() || (mode === 'direct' && text === sentText)) return;
    busy.current = true; setState('sending');
    const snapshot = text;
    try {
      const response = await fetch('/api/letter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: snapshot, language, consent: true, website, mode }), signal: AbortSignal.timeout(15_000) });
      const data = await response.json();
      if (response.ok && data.ok === true && mode === 'reply' && /^https:\/\/t\.me\/StayOneMoreDayBot\?start=w_[A-Za-z0-9_-]{32}$/.test(data.telegramUrl || '')) { setPrepared({text:snapshot,url:data.telegramUrl}); setConsent(false); setState('ready'); }
      else if (response.ok && data.ok === true && mode === 'direct') { setSentText(snapshot); setConsent(false); setState('sent'); }
      else setState(({ unavailable: 'unavailable', linkUnavailable:'linkUnavailable', rate: 'rate', uncertain: 'uncertain' })[data.code] || (mode === 'reply' ? 'linkFailed' : 'failed'));
    } catch { setState(mode === 'reply' ? 'linkFailed' : 'uncertain'); }
    finally { busy.current = false; }
  };
  return <div className="send-letter">
    <button type="button" className="text-button" aria-expanded={open} aria-controls="author-send-panel" onClick={() => setOpen(!open)}>{c.button} ↗</button>
    {open && <div id="author-send-panel">
      <p>{c.intro}</p>
      <fieldset className="letter-modes" disabled={state === 'sending'}><legend>{c.modeLabel}</legend>
        <label><input type="radio" name="letter-mode" value="reply" checked={mode === 'reply'} onChange={() => setMode('reply')}/>{c.replyOption}</label>
        <label><input type="radio" name="letter-mode" value="direct" checked={mode === 'direct'} onChange={() => setMode('direct')}/>{c.directOption}</label>
      </fieldset>
      <p>{mode === 'reply' ? c.replyDisclosure : c.disclosure} <a href="#help">{c.help}</a></p>
      <label className="letter-consent"><input type="checkbox" checked={consent} disabled={state === 'sending'} onChange={e => setConsent(e.target.checked)}/><span>{mode === 'reply' ? c.replyConsent : c.consent}</span></label>
      <label className="letter-trap" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}/></label>
      <button type="button" className="button dark" onClick={send} disabled={!consent || !text.trim() || (mode === 'direct' && text === sentText) || state === 'sending'}>{state === 'sending' ? c.sending : mode === 'reply' ? c.prepare : c.confirm}</button>
      <p className="letter-status" role="status">{c[state] || ''}</p>
      {mode === 'reply' && prepared?.text === text && <a className="button dark" href={prepared.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{c.openBot} ↗</a>}
    </div>}
  </div>;
}
