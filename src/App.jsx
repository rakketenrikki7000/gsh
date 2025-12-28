import { useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router-dom'
import { addDoc, collection, getDocs, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth, db } from './firebase'

const TEAM_OPTIONS = [
  'Gut Schluck Hauset',
  'Tornado',
  'Weserkicker',
  'Raeren Berg',
  'Herbestha',
  'Inferno',
  'Werth',
  'Walk',
]

const PUBLIC_NAV_ITEMS = [
  { to: '/', label: 'Start' },
  { to: '/news', label: 'News' },
  { to: '/tabelle-oeffentlich', label: 'Tabelle' },
  { to: '/galerie', label: 'Galerie' },
  { to: '/anfahrt', label: 'Anfahrt' },
  { to: '/ueber-uns', label: 'Über uns' },
]

const PRIVATE_NAV_ITEMS = [
  { to: '/', label: 'Start' },
  { to: '/news', label: 'News' },
  { to: '/tabelle', label: 'Tabelle' },
  { to: '/mannschaft', label: 'Mannschaft' },
  { to: '/galerie', label: 'Galerie' },
  { to: '/anfahrt', label: 'Anfahrt' },
  { to: '/ueber-uns', label: 'Über uns' },
]

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean)


const formatDate = (value) => {
  if (!value) return '-'
  if (value?.toDate) return value.toDate().toLocaleDateString('de-DE')
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('de-DE')
}

const computeStandings = (matches) => {
  const table = {}
  matches.forEach((match) => {
    const { homeTeam, awayTeam, homeScore, awayScore } = match
    if (!homeTeam || !awayTeam) return
    const hs = Number(homeScore)
    const as = Number(awayScore)
    if (Number.isNaN(hs) || Number.isNaN(as)) return
    const ensure = (team) => {
      table[team] ??= { team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }
    }
    ensure(homeTeam)
    ensure(awayTeam)
    table[homeTeam].played += 1
    table[awayTeam].played += 1
    table[homeTeam].gf += hs
    table[homeTeam].ga += as
    table[awayTeam].gf += as
    table[awayTeam].ga += hs
    if (hs > as) {
      table[homeTeam].wins += 1
      table[awayTeam].losses += 1
      table[homeTeam].points += 3
    } else if (hs < as) {
      table[awayTeam].wins += 1
      table[homeTeam].losses += 1
      table[awayTeam].points += 3
    } else {
      table[homeTeam].draws += 1
      table[awayTeam].draws += 1
      table[homeTeam].points += 1
      table[awayTeam].points += 1
    }
  })
  return Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.gf - a.ga
    const gdB = b.gf - b.ga
    if (gdB !== gdA) return gdB - gdA
    return (b.gf || 0) - (a.gf || 0)
  })
}

const PrivateRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" replace />
  return children
}

const GradientBadge = ({ children }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
    {children}
  </span>
)

const Card = ({ title, kicker, children, id, className = '' }) => (
  <section
    id={id}
    className={`rounded-3xl border border-white/5 bg-slate-900/60 p-6 shadow-soft backdrop-blur-sm ${className}`}
  >
    <div className="flex items-start justify-between gap-4 pb-4">
      <div>
        {kicker ? <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">{kicker}</p> : null}
        <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400/70 to-orange-400/80 blur-lg" />
    </div>
    {children}
  </section>
)

const TopNav = ({ user, onLogout, navItems }) => {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Close user dropdown on route change.
    setMenuOpen(false)
    setOpen(false)
  }, [location.pathname])

  const linkBase =
    'rounded-full px-4 py-2 transition border md:border-transparent text-sm font-semibold'

  return (
    <div className="sticky top-0 z-20 border-b border-white/5 bg-slate-950/90 backdrop-blur">
      <div className="flex w-full items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2 text-white">
          <img
            src="/gs-hauset-logo.png"
            alt="GS Hauset Logo"
            className="h-9 w-9 rounded-xl bg-white/10 p-1 object-contain shadow-lg shadow-emerald-500/30"
            loading="lazy"
          />
          <div>
            <p className="font-display text-lg font-semibold leading-none">Gut Schluck Hauset</p>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/80">Fussball</p>
          </div>
        </Link>

        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:border-emerald-300/60 hover:text-emerald-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          Menue
          <span className="text-lg">{open ? 'X' : '|||'}</span>
        </button>

        <nav
          className={`${
            open ? 'flex' : 'hidden'
          } absolute left-0 right-0 top-full flex-col gap-2 border-b border-white/5 bg-slate-950/95 px-4 pb-4 md:static md:flex md:flex-row md:items-center md:gap-2 md:border-none md:bg-transparent md:p-0`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  linkBase,
                  isActive ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/5',
                  location.pathname === item.to ? 'border border-white/10' : '',
                ].join(' ')
              }
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <div className="flex flex-col gap-2 md:ml-3 md:flex-row md:items-center">
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                  aria-label="ProfilMenue"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-orange-400 text-sm font-bold text-slate-900">
                    {(user.displayName || user.email || '?').slice(0, 1).toUpperCase()}
                  </span>
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-lg shadow-emerald-500/20">
                    <button
                      className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                      onClick={() => {
                        onLogout?.()
                        setMenuOpen(false)
                        setOpen(false)
                      }}
                    >
                      Abmelden
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5"
                onClick={() => setOpen(false)}
              >
                Anmelden
              </Link>
            )}
          </div>
        </nav>
      </div>
    </div>
  )
}

const HomePage = () => (
  <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />

    <header className="mb-10 rounded-3xl border border-white/5 bg-slate-900/70 p-8 shadow-soft backdrop-blur">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <GradientBadge>Gut Schluck Hauset - Fussball</GradientBadge>
          <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
            Ergebnisse melden. Tabelle aktualisieren. Modern & sicher.
          </h1>
          <p className="max-w-2xl text-lg text-slate-200/80">
            Gut Schluck Hauset - Fussball mit Herz in Ostbelgien. Tradition, Gemeinschaft und ein klarer Blick nach
            vorn.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/tabelle"
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              Zur Tabelle
            </a>
            <a
              href="/news"
              className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-emerald-300/60 hover:text-emerald-100"
            >
              News & Updates
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-gradient-to-br from-emerald-500/40 via-transparent to-orange-400/30 blur-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-5 text-sm text-slate-200 shadow-soft">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">Naechster Schritt</p>
            <p className="mt-2 text-base font-semibold text-white">Firebase konfigurieren</p>
            <p className="mt-1 text-slate-300/80">
              Trage deine API-Daten in <code className="text-emerald-200">.env.local</code> ein und starte den Dev
              Server.
            </p>
          </div>
        </div>
      </div>
    </header>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card title="Unsere DNA" kicker="Verein">
        <p className="text-sm text-slate-200/90">
          Mehr als ein Klub: Gut Schluck Hauset steht fuer Teamgeist, Nachwuchsfoerderung und packende Heimspiele. Wir
          investieren in Jugend, modernisieren Strukturen und bleiben immer nah an Fans und Dorf.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300/80">
          <span className="rounded-full bg-white/5 px-3 py-1">Heimspiele Samstag 18:00</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Jugend U11-U19</span>
          <span className="rounded-full bg-white/5 px-3 py-1">Emerald & Orange</span>
        </div>
      </Card>

      <Card title="Highlights" kicker="Momente">
        <div className="grid grid-cols-2 gap-3">
          {['Heimjubel', 'Auswaertssieg', 'Jugendcamp', 'Derby'].map((label, idx) => (
            <div
              key={label}
              className="relative h-28 overflow-hidden rounded-2xl border border-white/10 bg-slate-800"
              style={{
                backgroundImage:
                  idx % 2 === 0
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(249,115,22,0.35)), url(https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80)'
                    : 'linear-gradient(135deg, rgba(15,118,110,0.35), rgba(15,23,42,0.35)), url(https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <p className="absolute bottom-2 left-2 text-xs font-semibold text-white">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Mitmachen" kicker="Community">
        <ul className="space-y-2 text-sm text-slate-200/90">
          <li>- Schau beim Training vorbei und lerne das Team kennen.</li>
          <li>- Unterstuetze uns als Volunteer bei Heimspielen.</li>
          <li>- Werde Mitglied - Kontakt über info@gsh-fussball.be.</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <a
            href="/tabelle"
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-600"
          >
            Ergebnisse & Tabelle
          </a>
          <a
            href="/news"
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300/60 hover:text-emerald-100"
          >
            News lesen
          </a>
        </div>
      </Card>
    </div>
  </div>
)

const newsItems = [
  {
    title: 'Wintervorbereitung startet',
    date: '2025-01-10',
    tag: 'Club',
    body: 'Trainingslager in Buetgenbach und Testspiele gegen FC Eupen und Union Kelmis.',
  },
  {
    title: 'Jugendcamp im Februar',
    date: '2025-02-02',
    tag: 'Jugend',
    body: 'Drei Tage Technik, Spass und Torabschluss mit unseren Coaches - jetzt anmelden.',
  },
  {
    title: 'Neue Trikotsaison',
    date: '2025-03-01',
    tag: 'Team',
    body: 'Frisches Design in Emerald & Orange - Praesentation beim Heimspielauftakt.',
  },
]

const NewsPage = () => (
  <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-orange-500/15 via-transparent to-transparent blur-3xl" />
    <header className="mb-8">
      <GradientBadge>News & Updates</GradientBadge>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">Aktuelles aus dem Verein</h1>
      <p className="text-slate-300/80">Berichte, Ankuendigungen und Stories rund um Gut Schluck Hauset.</p>
    </header>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {newsItems.map((item) => (
        <Card key={item.title} title={item.title} kicker={item.tag}>
          <p className="text-xs text-slate-400">{formatDate(item.date)}</p>
          <p className="mt-2 text-sm text-slate-200/90">{item.body}</p>
          <button className="mt-4 inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300/60 hover:text-emerald-100">
            Mehr lesen
          </button>
        </Card>
      ))}
    </div>
  </div>
)

const TablePage = ({ matches, standings, form, handleChange, handleSubmit, saving, error, isAdmin }) => {
  const toTime = (value) => {
    if (!value) return 0
    if (value?.toDate) return value.toDate().getTime()
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const latestMatches = useMemo(
    () =>
      [...matches]
        .sort((a, b) => (toTime(b.date || b.createdAt) ?? 0) - (toTime(a.date || a.createdAt) ?? 0))
        .slice(0, 4),
    [matches],
  )

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />
    <header className="mb-8">
      <GradientBadge>Ergebnisse & Tabelle</GradientBadge>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">Spielstände und Ranking</h1>
      <p className="text-slate-300/80">
        Trage neue Ergebnisse ein, sieh dir den Live-Feed an und checke die aktuelle Tabelle.
      </p>
    </header>

    <div className={`grid grid-cols-1 gap-6 ${isAdmin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`} id="report">
      {isAdmin ? (
        <Card title="Ergebnis erfassen" kicker="Workflow">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Heimteam
                <select
                  value={form.homeTeam}
                  onChange={handleChange('homeTeam')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none ring-emerald-500/50 focus:border-emerald-300 focus:ring-2"
                >
                  {TEAM_OPTIONS.map((team) => (
                    <option key={`home-${team}`}>{team}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Auswärtsteam
                <select
                  value={form.awayTeam}
                  onChange={handleChange('awayTeam')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none ring-orange-500/50 focus:border-orange-300 focus:ring-2"
                >
                  {TEAM_OPTIONS.map((team) => (
                    <option key={`away-${team}`}>{team}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Heim-Tore
                <input
                  type="number"
                  min="0"
                  value={form.homeScore}
                  onChange={handleChange('homeScore')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Auswaerts-Tore
                <input
                  type="number"
                  min="0"
                  value={form.awayScore}
                  onChange={handleChange('awayScore')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/40"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Datum
                <input
                  type="date"
                  value={form.date}
                  onChange={handleChange('date')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-white/30 focus:ring-2 focus:ring-white/20"
                  required
                />
              </label>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Speichern…' : 'Ergebnis speichern'}
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      <Card title="Letzte Ergebnisse" kicker="Live Feed" id="results">
        <div className="space-y-3">
          {latestMatches.length === 0 ? (
            <p className="text-sm text-slate-300/70">Noch keine Spiele gespeichert.</p>
          ) : (
            latestMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {match.homeTeam} <span className="text-emerald-200">vs</span> {match.awayTeam}
                  </p>
                  <p className="text-xs text-slate-300/70">{formatDate(match.date)}</p>
                </div>
                <div className="rounded-full bg-slate-900/80 px-3 py-1 text-sm font-semibold text-emerald-100">
                  {match.homeScore} : {match.awayScore}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      </div>

    <Card title="Tabelle" kicker="Live Ranking" id="standings" className="mt-12">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.2em] text-slate-300/70">
              <th className="py-2 pr-3 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">Team</th>
              <th className="py-2 pr-3 font-medium">Sp</th>
              <th className="py-2 pr-3 font-medium">S</th>
              <th className="py-2 pr-3 font-medium">U</th>
              <th className="py-2 pr-3 font-medium">N</th>
              <th className="py-2 pr-3 font-medium">Tore</th>
              <th className="py-2 pr-3 font-medium">Diff</th>
              <th className="py-2 pr-3 font-medium text-right">Pkt</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {standings.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-4 text-center text-slate-300/70">
                  Noch keine Daten. Erfasse das erste Ergebnis.
                </td>
              </tr>
            ) : (
              standings.map((row, idx) => (
                <tr key={row.team} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-3 text-slate-400">{idx + 1}</td>
                  <td className="py-3 pr-3 font-semibold text-white">{row.team}</td>
                  <td className="py-3 pr-3">{row.played}</td>
                  <td className="py-3 pr-3">{row.wins}</td>
                  <td className="py-3 pr-3">{row.draws}</td>
                  <td className="py-3 pr-3">{row.losses}</td>
                  <td className="py-3 pr-3">
                    {row.gf}:{row.ga}
                  </td>
                  <td className="py-3 pr-3">{row.gf - row.ga}</td>
                  <td className="py-3 pr-3 text-right font-semibold text-emerald-200">{row.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
    </div>
  )
}

const AnfahrtPage = () => (
  <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/15 via-transparent to-transparent blur-3xl" />
    <header className="mb-8">
      <GradientBadge>Anfahrt</GradientBadge>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">So findest du uns</h1>
      <p className="text-slate-300/80">Adresse, Parken und Karte fuer den schnellsten Weg zum GSH.</p>
    </header>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card title="Adresse" kicker="Gut Schluck Hauset Sportplatz">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <p className="text-sm text-slate-200/90">
              Kirchstrasse 97
              <br />
              4730 Raeren
            </p>
            <p className="text-xs text-slate-400">Parkplaetze direkt vor dem Platz - Buslinie 722 bis "Hauset Dorf"</p>
            <a
              href="https://maps.google.com/?q=Kirchstra%C3%9Fe+97,+4730+Raeren"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              In Google Maps oeffnen
            </a>
          </div>
          <div className="w-full max-w-lg md:ml-auto">
            <video
              src="/gs-hauset-spotplatz.mp4"
              className="h-[260px] w-full rounded-2xl object-cover shadow-soft"
              autoPlay
              loop
              muted
              playsInline
              controls
            >
              Dein Browser unterstuetzt kein Video-Tag.
            </video>
          </div>
        </div>
      </Card>
      <Card title="Karte" kicker="Lageplan">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-soft">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/30 pointer-events-none" />
          <iframe
            title="Karte Kirchstrasse 97, Raeren"
            src="https://maps.google.com/maps?q=Kirchstra%C3%9Fe%2097%2C%204730%20Raeren&z=16&output=embed"
            width="100%"
            height="320"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="border-0"
          />
        </div>
      </Card>
    </div>
  </div>
)

const AboutPage = () => (
  <div className="relative isolate w-full px-4 pt-12 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:42px_42px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />

    <header className="mx-auto mb-12 max-w-4xl text-center">
      <GradientBadge>Über Gut Schluck Hauset</GradientBadge>
      <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl">Tradition trifft Zukunft</h1>
      <p className="mt-4 text-lg text-slate-200/80">
        Seit 1973 stehen wir für Leidenschaft, Gemeinschaft und die Liebe zum Fussball.
        <br />
        Was als Dorfmannschaft begann,
        ist heute ein stolzer Verein mit einer großen Familie.
      </p>
    </header>

    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
      <div className="relative flex h-[520px] items-center justify-center overflow-hidden rounded-3xl lg:col-span-3">
        <img
          src="/Vereinsfoto.png"
          alt="Vereinsfoto GS Hauset"
          className="h-full w-full object-cover drop-shadow-xl rounded-3xl"
          loading="lazy"
        />
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft lg:col-span-2">
        <h2 className="text-2xl font-semibold text-white">Unsere Geschichte</h2>
        <p className="text-sm text-slate-200/90">
          Gegründet 1973 von fussballbegeisterten Menschen aus Hauset, entwickelte sich Gut Schluck Hauset zu einem der
          respektiertesten Vereine der Region.
        </p>
        <p className="text-sm text-slate-200/90">
          Mit mehr als 100 Mitgliedern von Jugend bis Senioren leben wir Gemeinschaftsgeist, Fairplay und die Werte, die
          uns seit Jahrzehnten prägen.
        </p>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-50">
          Mehr als Fussball - wir sind eine Familie, die zusammenhält und gemeinsam träumt.
        </div>
      </div>
    </div>

    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { icon: '🤝', title: 'Gemeinschaft', body: 'Wir sind mehr als ein Verein - wir sind eine Familie' },
        { icon: '🏆', title: 'Tradition', body: 'Über 50 Jahre Vereinsgeschichte prägen unsere Identität' },
        { icon: '🌱', title: 'Nachwuchs', body: 'Förderung junger Talente' },
        { icon: '⚖️', title: 'Fairplay', body: 'Respekt und Fairness sind die Grundpfeiler unseres Sports' },
      ].map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-center shadow-soft"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-xl">
            {item.icon}
          </div>
          <p className="text-base font-semibold text-white">{item.title}</p>
          <p className="text-sm text-slate-200/80">{item.body}</p>
        </div>
      ))}
    </div>
  </div>
)

const GalleryPage = () => (
  <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-400/20 via-transparent to-transparent blur-3xl" />
    <header className="mb-8">
      <GradientBadge>Galerie</GradientBadge>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">Momente & Highlights</h1>
      <p className="text-slate-300/80">Einblicke in Spiele, Training und Community. Bilder folgen bald.</p>
    </header>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <div
          key={idx}
          className="relative h-44 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-900/40 to-orange-400/20 blur-xl" />
          <div className="relative flex h-full items-center justify-center text-sm font-semibold text-slate-200">
            Platzhalter Bild {idx}
          </div>
        </div>
      ))}
    </div>
  </div>
)

const TeamPage = () => (
  <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/15 via-transparent to-transparent blur-3xl" />
    <header className="mb-8">
      <GradientBadge>Mannschaft</GradientBadge>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">Kader & Organisation</h1>
      <p className="text-slate-300/80">Interne Ansicht: hier koennen Teaminfos, Kaderlisten und Aufgaben gepflegt werden.</p>
    </header>
    <Card title="Hinweis" kicker="Intern">
      <p className="text-sm text-slate-200/90">
        Dieser Bereich ist nur fuer angemeldete Nutzer sichtbar. Lege hier spaeter Kader, Positionen oder Trainingsplaene an.
      </p>
    </Card>
  </div>
)

const PublicTablePage = ({ standings }) => (
  <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />
    <header className="mb-8">
      <GradientBadge>Spielstand</GradientBadge>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">Tabelle</h1>
      <p className="text-slate-300/80">
        Season 2025 - Gut Schluck Hauset Fussball
        <br />
        Ergebnisse und Tabelle für alle Fans und Mitglieder
      </p>
    </header>
    <Card title="Tabelle" kicker="Live Ranking">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.2em] text-slate-300/70">
              <th className="py-2 pr-3 font-medium">#</th>
              <th className="py-2 pr-3 font-medium">Team</th>
              <th className="py-2 pr-3 font-medium">Sp</th>
              <th className="py-2 pr-3 font-medium">S</th>
              <th className="py-2 pr-3 font-medium">U</th>
              <th className="py-2 pr-3 font-medium">N</th>
              <th className="py-2 pr-3 font-medium">Tore</th>
              <th className="py-2 pr-3 font-medium">Diff</th>
              <th className="py-2 pr-3 font-medium text-right">Pkt</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {standings.length === 0 ? (
              <tr>
                <td colSpan="9" className="py-4 text-center text-slate-300/70">
                  Noch keine Daten. Erfasse das erste Ergebnis im privaten Bereich.
                </td>
              </tr>
            ) : (
              standings.map((row, idx) => (
                <tr key={row.team} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-3 text-slate-400">{idx + 1}</td>
                  <td className="py-3 pr-3 font-semibold text-white">{row.team}</td>
                  <td className="py-3 pr-3">{row.played}</td>
                  <td className="py-3 pr-3">{row.wins}</td>
                  <td className="py-3 pr-3">{row.draws}</td>
                  <td className="py-3 pr-3">{row.losses}</td>
                  <td className="py-3 pr-3">
                    {row.gf}:{row.ga}
                  </td>
                  <td className="py-3 pr-3">{row.gf - row.ga}</td>
                  <td className="py-3 pr-3 text-right font-semibold text-emerald-200">{row.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
)

const LoginPage = ({ user }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/')
    } catch (err) {
      console.error(err)
      const code = err?.code || ''
      const friendly =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Email oder Passwort falsch.'
          : code === 'auth/user-not-found'
            ? 'Kein Nutzer mit dieser E-Mail gefunden.'
            : code === 'auth/invalid-api-key' || code === 'auth/configuration-not-found'
              ? 'Firebase-Konfiguration fehlt/ist falsch. Bitte .env.* prufen.'
              : 'Login fehlgeschlagen. Bitte Zugangsdaten pruefen oder Auth in Firebase aktivieren.'
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-white/5 bg-slate-900/70 p-8 shadow-soft backdrop-blur">
        <div>
          <GradientBadge>Login</GradientBadge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white">Anmelden</h1>
          <p className="text-slate-300/80">
            Melde dich mit deiner E-Mail und deinem Passwort an. 
            <br />
            Nur für Vereinsmitglieder.
          </p>
        </div>

        {user ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
            Bereits angemeldet als <span className="font-semibold">{user.email}</span>.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
            E-Mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
            Passwort
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Anmeldung laeuft...' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}

const SettingsPage = ({ user, onProfileSaved }) => {
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!user) {
      setError('Bitte zuerst anmelden.')
      return
    }
    setSaving(true)
    try {
      await user.reload()
      await user.updateProfile({ displayName: displayName || null })
      setMessage('Profil aktualisiert.')
      onProfileSaved?.()
    } catch (err) {
      console.error(err)
      setError('Konnte Profil nicht aktualisieren.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-orange-400/15 via-transparent to-transparent blur-3xl" />
      <div className="mx-auto max-w-xl space-y-6 rounded-3xl border border-white/5 bg-slate-900/70 p-8 shadow-soft backdrop-blur">
        <div>
          <GradientBadge>Profil</GradientBadge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white">Einstellungen</h1>
          <p className="text-slate-300/80">Passe deinen Anzeigenamen an.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSave}>
          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
            Anzeigename
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
              placeholder="z.B. Dein Name"
            />
          </label>

          {message ? (
            <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-50">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-5 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        </form>
      </div>
    </div>
  )
}

const AppShell = () => {
  const [matches, setMatches] = useState([])
  const [form, setForm] = useState({
    homeTeam: '',
    awayTeam: '',
    homeScore: '',
    awayScore: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const standings = useMemo(() => computeStandings(matches), [matches])
  const navItems = user ? PRIVATE_NAV_ITEMS : PUBLIC_NAV_ITEMS
  const isAdmin = useMemo(() => {
    const email = (user?.email || '').toLowerCase()
    if (!email) return false
    return ADMIN_EMAILS.includes(email)
  }, [user])

  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setMatches(next)
      },
      (err) => {
        console.error(err)
        setError('Konnte Daten nicht laden. Bitte pruefe die Firebase-Konfiguration.')
      },
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => setUser(nextUser))
    return () => unsubscribe()
  }, [])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.homeTeam === form.awayTeam) {
      setError('Heim- und Auswärtsteam muessen unterschiedlich sein.')
      return
    }
    const hs = Number(form.homeScore)
    const as = Number(form.awayScore)
    if ([hs, as].some(Number.isNaN) || hs < 0 || as < 0) {
      setError('Bitte gueltige Tore eingeben (0 oder hoeher).')
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, 'matches'), {
        homeTeam: form.homeTeam,
        awayTeam: form.awayTeam,
        homeScore: hs,
        awayScore: as,
        date: new Date(form.date),
        createdAt: serverTimestamp(),
      })
      setForm((prev) => ({ ...prev, homeScore: '', awayScore: '' }))
    } catch (err) {
      console.error(err)
      setError('Speichern fehlgeschlagen. Bitte Konfiguration pruefen.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.25),transparent_25%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.2),transparent_25%)]" />
      </div>
      <TopNav user={user} onLogout={handleLogout} navItems={navItems} />
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route path="/tabelle-oeffentlich" element={<PublicTablePage standings={standings} />} />
        <Route path="/galerie" element={<GalleryPage />} />
        <Route
          path="/tabelle"
          element={
            <PrivateRoute user={user}>
              <TablePage
                matches={matches}
                standings={standings}
                form={form}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                saving={saving}
                error={error}
                isAdmin={isAdmin}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/mannschaft"
          element={
            <PrivateRoute user={user}>
              <TeamPage />
            </PrivateRoute>
          }
        />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/anfahrt" element={<AnfahrtPage />} />
        <Route path="/ueber-uns" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage user={user} />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  )
}

export default App










