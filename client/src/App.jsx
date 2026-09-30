import RegistrationForm, { MIN_MEMBERS, MAX_MEMBERS } from './components/RegistrationForm.jsx';

// Fill these in when the details are final; empty values are hidden.
const EVENT = { name: "QBIT'26", date: '', venue: '' };

const NAV_LINKS = ['Home', 'About', 'Events', 'Team', 'Sponsors', 'Contact Us']; // set real hrefs here

const QUESTION_MARKS = [
  { left: '4%', top: '12%', size: 90, rot: -16 },
  { left: '30%', top: '22%', size: 56, rot: 10 },
  { left: '52%', top: '6%', size: 64, rot: -8 },
  { left: '92%', top: '30%', size: 80, rot: 12 },
  { left: '88%', top: '78%', size: 60, rot: -10 },
  { left: '44%', top: '84%', size: 72, rot: 8 },
];

function Logo({ className }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" strokeLinecap="round" aria-hidden="true">
      <circle cx="30" cy="30" r="22" />
      <path d="M42 42l14 14" />
      <path d="M37 24a9 9 0 1 0 0 12" />
    </svg>
  );
}

export default function App() {
  return (
    <>
      <div className="bg" aria-hidden="true">
        <Logo className="bigq" />
        {QUESTION_MARKS.map((q, i) => (
          <span key={i} style={{ left: q.left, top: q.top, fontSize: q.size, transform: `rotate(${q.rot}deg)` }}>?</span>
        ))}
      </div>

      <div className="page">
        <nav>
          <a href="/" aria-label="Quizzers' Club home"><Logo className="logo" /></a>
          <div className="links">
            {NAV_LINKS.map((label) => <a key={label} href="#">{label}</a>)}
          </div>
          <a className="pill" href="#reg">Register</a>
        </nav>

        <div className="layout">
          <header className="intro">
            <h1>{EVENT.name}</h1>
            <p className="club">Quizzers' Club NIT Bhopal</p>
            <p className="lede">Register your team for {EVENT.name}, the quiz event hosted by QCM.</p>

            {(EVENT.date || EVENT.venue) && (
              <dl className="meta">
                {EVENT.date && <div><dt>Date</dt><dd>{EVENT.date}</dd></div>}
                {EVENT.venue && <div><dt>Venue</dt><dd>{EVENT.venue}</dd></div>}
              </dl>
            )}

            <ul className="facts">
              <li>Teams of {MIN_MEMBERS} to {MAX_MEMBERS} members</li>
              <li>One form per team, filled in by the team lead</li>
              <li>Your confirmation appears as soon as you submit</li>
            </ul>
          </header>

          <RegistrationForm />
        </div>
      </div>
    </>
  );
}