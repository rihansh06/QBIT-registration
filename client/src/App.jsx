import RegistrationForm, { MIN_MEMBERS, MAX_MEMBERS } from './components/RegistrationForm.jsx';

// Fill these in when the details are final; empty values are hidden.
const EVENT = { name: "QBIT'26", date: '', venue: '' };

const NAV_LINKS = ['Home', 'About', 'Events', 'Team', 'Sponsors', 'Contact Us']; // set real hrefs here

export default function App() {
  return (
    <>
      <div className="bg" aria-hidden="true">
        <img src="/floating-mark.png" alt="" />
      </div>

      <div className="page">
        <nav>
          <a href="/" aria-label="Quizzers' Club home">
            <img className="logo" src="/qcm-logo.png" alt="QCM logo" width="46" height="46" />
          </a>
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

            <div className="art" aria-hidden="true">
              <img className="q" src="/gradient-qcm-logo.png" alt="" />
              <img className="bulb" src="/bulb.png" alt="" />
            </div>
          </header>

          <RegistrationForm />
        </div>
      </div>
    </>
  );
}