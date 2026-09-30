import { useState } from 'react';

// Team size limits (keep in sync with server/server.js)
export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 4;

const TEAM_FIELDS = [
  { key: 'teamName', label: 'Team name', placeholder: 'e.g. Byte Busters', autoComplete: 'off', maxLength: 80 },
  { key: 'college', label: 'College name', placeholder: 'Full college name', autoComplete: 'organization', maxLength: 150 },
];

const MEMBER_FIELDS = [
  { key: 'name', label: 'Member name', placeholder: 'Full name', autoComplete: 'off', maxLength: 80 },
  { key: 'phone', label: 'Contact number', placeholder: '10-digit mobile number', type: 'tel', inputMode: 'numeric', autoComplete: 'off', half: true },
  { key: 'email', label: 'Email', placeholder: 'name@college.edu', type: 'email', autoComplete: 'off', maxLength: 120, half: true },
  { key: 'course', label: 'Course', placeholder: 'e.g. B.Tech CSE, 2nd year', autoComplete: 'off', maxLength: 100 },
];

const RULES = {
  teamName: (v) => v.length >= 2 || 'Enter your team name.',
  college: (v) => v.length >= 3 || 'Enter your college name.',
  name: (v) => v.length >= 2 || 'Enter the member\u2019s full name.',
  phone: (v) => {
    let d = v.replace(/\D/g, '');
    if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
    return /^[6-9]\d{9}$/.test(d) || 'Enter a valid 10-digit mobile number.';
  },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter a valid email address.',
  course: (v) => v.length >= 2 || 'Enter the course.',
};

const emptyMember = () => ({ name: '', phone: '', email: '', course: '' });
const initialMembers = () => Array.from({ length: MIN_MEMBERS }, emptyMember);
const idOf = (key) => key.replace(/\./g, '-');

function Field({ def, id, value, error, onChange, onBlur }) {
  return (
    <div className={`field${def.half ? ' half' : ''}${error ? ' bad' : ''}`}>
      <label htmlFor={id}>{def.label}</label>
      <input
        id={id}
        type={def.type || 'text'}
        inputMode={def.inputMode}
        autoComplete={def.autoComplete}
        placeholder={def.placeholder}
        maxLength={def.maxLength}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={`${id}-err`}
      />
      <p className="msg" id={`${id}-err`}>{error || ''}</p>
    </div>
  );
}

export default function RegistrationForm() {
  const [team, setTeam] = useState({ teamName: '', college: '' });
  const [members, setMembers] = useState(initialMembers);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const ruleFor = (key) => (key.startsWith('members.') ? key.split('.')[2] : key);
  const check = (key, value) => {
    const r = RULES[ruleFor(key)](value.trim());
    return r === true ? '' : r;
  };
  const setError = (key, msg) => setErrors((er) => ({ ...er, [key]: msg }));

  const changeTeam = (key) => (e) => {
    const v = e.target.value;
    setTeam((t) => ({ ...t, [key]: v }));
    if (errors[key]) setError(key, check(key, v));
  };
  const changeMember = (i, f) => (e) => {
    const v = e.target.value;
    const key = `members.${i}.${f}`;
    setMembers((ms) => ms.map((m, idx) => (idx === i ? { ...m, [f]: v } : m)));
    if (errors[key]) setError(key, check(key, v));
  };

  const clearMemberErrors = () =>
    setErrors((er) => Object.fromEntries(Object.entries(er).filter(([k]) => !k.startsWith('members'))));
  const addMember = () => {
    if (members.length >= MAX_MEMBERS) return;
    setMembers((ms) => [...ms, emptyMember()]);
    clearMemberErrors();
  };
  const removeMember = (i) => {
    setMembers((ms) => ms.filter((_, idx) => idx !== i));
    clearMemberErrors();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBanner('');

    const keys = [
      ...TEAM_FIELDS.map((f) => f.key),
      ...members.flatMap((_, i) => MEMBER_FIELDS.map((f) => `members.${i}.${f.key}`)),
    ];
    const valueOf = (key) => {
      if (!key.startsWith('members.')) return team[key];
      const [, i, f] = key.split('.');
      return members[i][f];
    };
    const found = {};
    keys.forEach((k) => {
      const msg = check(k, valueOf(k));
      if (msg) found[k] = msg;
    });
    setErrors(found);
    const firstBad = keys.find((k) => found[k]);
    if (firstBad) {
      document.getElementById(idOf(firstBad))?.focus();
      return;
    }

    const payload = {
      teamName: team.teamName.trim(),
      college: team.college.trim(),
      members: members.map((m) => ({ name: m.name.trim(), phone: m.phone.trim(), email: m.email.trim(), course: m.course.trim() })),
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitted(payload);
      } else {
        const serverErrors = data.errors || {};
        setErrors(serverErrors);
        setBanner(data.message || 'Could not register. Please try again.');
        const firstServerBad = keys.find((k) => serverErrors[k]);
        if (firstServerBad) document.getElementById(idOf(firstServerBad))?.focus();
      }
    } catch {
      setBanner('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setTeam({ teamName: '', college: '' });
    setMembers(initialMembers());
    setErrors({});
    setBanner('');
    setSubmitted(null);
  };

  if (submitted) {
    return (
      <section className="card done" id="reg" role="status" aria-live="polite">
        <div className="tick" aria-hidden="true">&#10003;</div>
        <h2>Team registered</h2>
        <dl>
          <div className="row"><dt>Team name</dt><dd>{submitted.teamName}</dd></div>
          <div className="row"><dt>College</dt><dd>{submitted.college}</dd></div>
        </dl>
        {submitted.members.map((m, i) => (
          <div className="summary-member" key={i}>
            <p className="who">{i === 0 ? 'Team lead' : `Member ${i + 1}`}: {m.name}</p>
            <p>{m.phone} &middot; {m.email}</p>
            <p>{m.course}</p>
          </div>
        ))}
        <button className="alt" type="button" onClick={reset}>Register another team</button>
      </section>
    );
  }

  return (
    <section className="card" id="reg">
      <h2>Register your team</h2>
      {banner && <p className="banner" role="alert">{banner}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <h3 className="sec">Team</h3>
        <div className="grid">
          {TEAM_FIELDS.map((f) => (
            <Field
              key={f.key}
              def={f}
              id={f.key}
              value={team[f.key]}
              error={errors[f.key]}
              onChange={changeTeam(f.key)}
              onBlur={(e) => setError(f.key, check(f.key, e.target.value))}
            />
          ))}
        </div>

        <h3 className="sec">Members <span>{members.length} of {MAX_MEMBERS}</span></h3>
        {members.map((m, i) => (
          <div className="member" role="group" aria-label={i === 0 ? 'Team lead' : `Member ${i + 1}`} key={i}>
            <div className="mhead">
              <span className="num" aria-hidden="true">{i + 1}</span>
              <span className="mtitle">{i === 0 ? 'Team lead' : `Member ${i + 1}`}</span>
              {i >= MIN_MEMBERS && (
                <button type="button" className="remove" onClick={() => removeMember(i)}>Remove</button>
              )}
            </div>
            <div className="grid">
              {MEMBER_FIELDS.map((f) => {
                const key = `members.${i}.${f.key}`;
                return (
                  <Field
                    key={key}
                    def={f}
                    id={idOf(key)}
                    value={m[f.key]}
                    error={errors[key]}
                    onChange={changeMember(i, f.key)}
                    onBlur={(e) => setError(key, check(key, e.target.value))}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {errors.members && <p className="msg">{errors.members}</p>}
        {members.length < MAX_MEMBERS && (
          <button type="button" className="alt add" onClick={addMember}>
            + Add member ({members.length}/{MAX_MEMBERS})
          </button>
        )}

        <button className="go" type="submit" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register team'}
        </button>
      </form>
    </section>
  );
}