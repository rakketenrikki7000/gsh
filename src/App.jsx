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
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth'
import { auth, db } from './firebase'

const TEAM_OPTIONS = [
  'ASV Werth',
  'BSV Rakete',
  'Bilstain',
  'Gut Schluck Hauset',
  'Hall Star',
  'Herbestha',
  'Inferno',
  'Kettenis A',
  'Kettenis B',
  'Tanja',
  'Tornado',
  'Tülje',
  'Walk',
  'Werth',
]

const STADIUM_OPTIONS = [
  'Stadionstraße 10, 4721 Kelmis, Belgien (Untergrund: Kunstrasen)',
  'Kirchstraße 97, 4730 Raeren, Belgien (Untergrund: Rasen)',
  'Schönefelderweg 240, 4700 Eupen, Belgien (Untergrund: Rasen)',
  'Lichtenbuscher Straße 155, 4731 Raeren, Belgien (Untergrund: Rasen)',
  'Talstraße 43, 4701 Eupen, Belgien (Untergrund: Rasen)',
  'Gemmenich',
  'Faymonville',
]

const POSITION_GROUPS = [
  { key: 'tor', label: 'Tor' },
  { key: 'verteidigung', label: 'Verteidigung' },
  { key: 'mittelfeld', label: 'Mittelfeld' },
  { key: 'angriff', label: 'Angriff' },
  { key: 'staff', label: 'Trainerstab' },
]

const SPONSOR_LOGOS = [
  { src: '/Dienstleistungen_Stefan_Siffrin.jpg', alt: 'Dienstleistungen Stefan Siffrin', href: 'https://be.linkedin.com/in/stefan-siffrin-552864158' },
  { src: '/jkmotor-raeder.jpg', alt: 'JK Motor Raeder', href: 'https://www.jkmotorraeder.be/' },
  { src: '/Elektro_Bemelmans.png', alt: 'Elektro Bemelmans', href: 'https://elektro-bemelmans.be/' },
  { src: '/Metzgerei_Vincent.jpg', alt: 'Metzgerei Vincent', href: 'https://www.facebook.com/people/Metzgerei-boucherie-Dorthu-Steyns/100054569703802/' },
  { src: '/Mauel.png', alt: 'Mauel', href: 'https://www.mauel.be/' },
  { src: '/Ralph_Creutz.jpg', alt: 'Ralph Creutz', href: 'https://www.creutz-ralph.be/' },
]
const SPONSOR_LOOP = [...SPONSOR_LOGOS, ...SPONSOR_LOGOS, ...SPONSOR_LOGOS, ...SPONSOR_LOGOS]

const PUBLIC_NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/news', label: 'News' },
  { to: '/tabelle-oeffentlich', label: 'Tabelle' },
  { to: '/galerie', label: 'Galerie' },
  { to: '/anfahrt', label: 'Anfahrt' },
  { to: '/ueber-uns', label: 'über uns' },
]

const PRIVATE_NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/news', label: 'News' },
  { to: '/tabelle', label: 'Tabelle' },
  { to: '/spielplan', label: 'Spielplan' },
  { to: '/mannschaft', label: 'Mannschaft' },
  { to: '/galerie', label: 'Galerie' },
  { to: '/anfahrt', label: 'Anfahrt' },
  { to: '/ueber-uns', label: 'über uns' },
]

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean)

const I18N_DE = {
  nav_table: 'Tabelle',
  results_badge: 'Ergebnisse & Tabelle',
  results_title: 'Spielstände und Ranking',
  results_subtitle: 'Checke die aktuelle Tabelle und sieh dir den Live-Feed an',
  news_badge: 'News & Updates',
  news_title: 'Aktuelles aus dem Verein',
  news_subtitle: 'Berichte, Ankuendigungen und Stories rund um Gut Schluck Hauset.',
  news_read_more: 'Mehr lesen',
  admin_manage_tables: 'Tabellen verwalten',
  admin_active_table: 'Aktive Tabelle',
  admin_loading_tables: 'Lade Tabellen...',
  admin_no_table: 'Noch keine Tabelle vorhanden.',
  admin_delete_table: 'Tabelle loeschen',
  admin_new_table: 'Neue Tabelle',
  admin_table_name: 'Name',
  admin_table_placeholder: 'z.B. Saison 2026',
  admin_create_table: 'Tabelle erstellen',
  admin_creating: 'Erstellt...',
  workflow_results: 'Ergebnis erfassen',
  workflow_table: 'Tabelle',
  workflow_no_table: 'Noch keine Tabelle vorhanden. Bitte zuerst eine Tabelle anlegen.',
  workflow_home: 'Heimteam',
  workflow_away: 'Auswärtssteam',
  workflow_home_score: 'Heim-Tore',
  workflow_away_score: 'Auswaerts-Tore',
  workflow_date: 'Datum',
  workflow_save: 'Ergebnis speichern',
  workflow_saving: 'Speichern…',
  live_feed: 'Letzte Ergebnisse',
  live_feed_empty: 'Noch keine Spiele für diese Tabelle.',
  live_feed_select: 'Bitte zuerst eine Tabelle auswählen.',
  live_feed_delete: 'Loeschen',
  notes_title: 'Traineranmerkung',
  notes_label: 'Anmerkung',
  notes_placeholder: 'Kurz anmerken...',
  notes_save: 'Anmerkung speichern',
  notes_saving: 'Speichert...',
  notes_loading: 'Lade Notizen...',
  notes_empty: 'Noch keine Notizen vorhanden.',
  notes_more: 'Mehr öffnen',
  notes_less: 'Weniger anzeigen',
  public_badge: 'Spielstand',
  public_subtitle: 'Ergebnisse und Tabelle für alle Fans und Mitglieder',
  public_filter_all: 'All',
  public_filter_home: 'Home',
  public_filter_away: 'Away',
  public_no_data: 'Noch keine Daten. Erfasse das erste Ergebnis im privaten Bereich.',
  gallery_badge: 'Galerie',
  gallery_title: 'Momentes & Events',
  gallery_create_event: 'Event anlegen',
  gallery_new: 'Neues',
  gallery_event_name: 'Event Name',
  gallery_event_placeholder: 'z.B. Derby 2025',
  gallery_create: 'Event erstellen',
  gallery_creating: 'Legt an...',
  gallery_upload: 'Bilder hochladen',
  gallery_upload_kicker: 'Upload',
  gallery_select_event: 'Event Auswahl',
  gallery_select_placeholder: 'Event waehlen...',
  gallery_images: 'Bilder',
  gallery_selected: 'Ausgewaehlt',
  gallery_file_hint: 'PNG oder JPG, mehrere Dateien möglich.',
  gallery_save_images: 'Bilder speichern',
  gallery_uploading: 'Laedt hoch...',
  gallery_back: 'Zurück zu Events',
  gallery_save: 'Speichern',
  gallery_deleting: 'Löscht...',
  gallery_delete: 'Event löschen',
  schedule_badge: 'Spielplan',
  schedule_title: 'Spiele & Zusagen',
  schedule_subtitle: 'Nur für angemeldete Spieler und Admins.',
  team_badge: 'Mannschaft',
  team_title: 'Gut Schluck Hauset',
  login_badge: 'Login',
  login_title: 'Anmelden',
  login_subtitle: 'Melde dich mit deiner E-Mail und deinem Passwort an.',
  login_members: 'Nur für Vereinsmitglieder.',
  login_email: 'E-Mail',
  login_password: 'Passwort',
  login_button: 'Anmelden',
  login_loading: 'Anmeldung läuft...',
}

const useI18n = () => ({
  t: (key) => I18N_DE[key] || key,
})

const TABLE_STORAGE_KEY = 'gsh-active-table'

const formatDate = (value) => {
  if (!value) return '-'
  if (value?.toDate) return value.toDate().toLocaleDateString('de-DE')
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('de-DE')
}

const normalizeName = (value) =>
  (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const computeStandings = (matches, mode = 'all') => {
  const table = {}
  matches.forEach((match) => {
    const { homeTeam, awayTeam, homeScore, awayScore } = match
    if (!homeTeam || !awayTeam) return
    const hs = Number(homeScore)
    const as = Number(awayScore)
    if (Number.isNaN(hs) || Number.isNaN(as)) return
    const includeHome = mode !== 'away'
    const includeAway = mode !== 'home'
    const ensure = (team) =>
      (table[team] ??= { team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 })

    if (includeHome) {
      ensure(homeTeam)
      table[homeTeam].played += 1
      table[homeTeam].gf += hs
      table[homeTeam].ga += as
      if (hs > as) {
        table[homeTeam].wins += 1
        table[homeTeam].points += 3
      } else if (hs < as) {
        table[homeTeam].losses += 1
      } else {
        table[homeTeam].draws += 1
        table[homeTeam].points += 1
      }
    }

    if (includeAway) {
      ensure(awayTeam)
      table[awayTeam].played += 1
      table[awayTeam].gf += as
      table[awayTeam].ga += hs
      if (as > hs) {
        table[awayTeam].wins += 1
        table[awayTeam].points += 3
      } else if (as < hs) {
        table[awayTeam].losses += 1
      } else {
        table[awayTeam].draws += 1
        table[awayTeam].points += 1
      }
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

const SponsorMarquee = () => (
  <div className="mt-8">
    <div className="relative overflow-hidden rounded-xl bg-slate-950/60 px-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-950 via-slate-950/70 to-transparent" />
      <div className="flex min-w-[200%] flex-nowrap items-center gap-6 py-4 sponsor-marquee-track">
        {SPONSOR_LOOP.map((logo, idx) => (
          logo.href ? (
            <a
              key={`${logo.alt}-${idx}`}
              href={logo.href}
              target="_blank"
              rel="noreferrer"
              className="flex h-16 w-44 items-center justify-center rounded-xl bg-white/5 px-4 py-2 shadow-inner transition hover:-translate-y-0.5 hover:scale-[1.06] hover:bg-white/15 hover:shadow-[0_0_28px_rgba(16,185,129,0.45)] hover:border hover:border-emerald-400/60"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="max-h-12 w-full object-contain brightness-110 contrast-110"
                loading="lazy"
              />
            </a>
          ) : (
            <div
              key={`${logo.alt}-${idx}`}
              className="flex h-16 w-44 items-center justify-center rounded-xl bg-white/5 px-4 py-2 shadow-inner transition hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(16,185,129,0.35)] hover:border hover:border-emerald-400/40"
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="max-h-12 w-full object-contain brightness-110 contrast-110"
                loading="lazy"
              />
            </div>
          )
        ))}
      </div>
    </div>
  </div>
)

const PlayerCard = ({ player }) => {
  const initials = (player.name || '')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-lg shadow-emerald-500/10">
      {player.photo ? (
        <img src={player.photo} alt={player.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-indigo-500/30 via-slate-800 to-slate-900 text-2xl font-bold text-emerald-100">
          {initials || '?'}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-slate-900/80" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 py-3">
        <div>
          {player.number ? (
            <p className="text-sm font-bold text-emerald-200 drop-shadow">#{player.number}</p>
          ) : null}
          <p className="text-lg font-semibold leading-tight text-white">{player.name || 'Unbekannt'}</p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-200">Profil</span>
      </div>
    </div>
  )
}

const TopNav = ({ user, userAvatar, onLogout, navItems }) => {
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
          aria-label="Menue"
        >
          <span className="text-lg">{open ? 'X' : '|||'}</span>
        </button>

        <nav
          className={`${open ? 'flex' : 'hidden'
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
              <>
                <div className="flex items-center gap-2 md:hidden">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-orange-400 text-sm font-bold text-slate-900"
                    aria-label="ProfilMenue"
                  >
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={user.displayName || user.email || 'Profil'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (user.displayName || user.email || '?').slice(0, 1).toUpperCase()
                    )}
                  </button>
                  {menuOpen ? (
                    <div className="flex items-center gap-2">
                      <Link
                        to="/einstellungen"
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-300/50 hover:text-emerald-50"
                        onClick={() => {
                          setMenuOpen(false)
                          setOpen(false)
                        }}
                      >
                        Einstellungen
                      </Link>
                      <button
                        className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
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
                <div className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                    aria-label="ProfilMenue"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-orange-400 text-sm font-bold text-slate-900">
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={user.displayName || user.email || 'Profil'}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        (user.displayName || user.email || '?').slice(0, 1).toUpperCase()
                      )}
                    </span>
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-slate-900/95 p-2 shadow-lg shadow-emerald-500/20">
                      <Link
                        to="/einstellungen"
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                        onClick={() => {
                          setMenuOpen(false)
                          setOpen(false)
                        }}
                      >
                        Einstellungen
                      </Link>
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
              </>
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
          <GradientBadge>Über Gut Schluck Hauset - Fussball</GradientBadge>
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

    <SponsorMarquee />

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card title="Unsere DNA" kicker="Verein">
        <p className="text-sm text-slate-200/90">
          Mehr als ein Klub: Gut Schluck Hauset steht fuer Teamgeist, Nachwuchsförderung und packende Heimspiele. Wir
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

const NewsPage = () => {
  const { t } = useI18n()
  return (
  <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
    <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
    <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-orange-500/15 via-transparent to-transparent blur-3xl" />
    <header className="mb-8">
      <GradientBadge>{t('news_badge')}</GradientBadge>
      <h1 className="mt-3 font-display text-4xl font-semibold text-white">{t('news_title')}</h1>
      <p className="text-slate-300/80">{t('news_subtitle')}</p>
    </header>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {newsItems.map((item) => (
        <Card key={item.title} title={item.title} kicker={item.tag}>
          <p className="text-xs text-slate-400">{formatDate(item.date)}</p>
          <p className="mt-2 text-sm text-slate-200/90">{item.body}</p>
          <button className="mt-4 inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300/60 hover:text-emerald-100">
            {t('news_read_more')}
          </button>
        </Card>
      ))}
    </div>
  </div>
)
}

const TablePage = ({
  matches,
  form,
  handleChange,
  handleSubmit,
  saving,
  error,
  isAdmin,
  tables,
  selectedTableId,
  onSelectTable,
  activeTable,
  tablesError,
  loadingTables,
  onDeleteTable,
}) => {
  const { t } = useI18n()
  const toTime = (value) => {
    if (!value) return 0
    if (value?.toDate) return value.toDate().getTime()
    const parsed = new Date(value).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const [rankingFilter, setRankingFilter] = useState('all')
  const [notes, setNotes] = useState([])
  const [notesError, setNotesError] = useState('')
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [noteForm, setNoteForm] = useState({ body: '' })
  const [savingNote, setSavingNote] = useState(false)
  const [noteExpanded, setNoteExpanded] = useState(false)
  const [tableForm, setTableForm] = useState({ name: '' })
  const [creatingTable, setCreatingTable] = useState(false)
  const [tableCreateError, setTableCreateError] = useState('')
  const [deletingTableId, setDeletingTableId] = useState('')
  const [tableDeleteError, setTableDeleteError] = useState('')
  const [deletingMatchId, setDeletingMatchId] = useState('')
  const [matchDeleteError, setMatchDeleteError] = useState('')

  const activeMatches = useMemo(() => {
    if (!selectedTableId) return []
    return matches.filter((match) => match.tableId === selectedTableId)
  }, [matches, selectedTableId])

  const latestMatches = useMemo(
    () =>
      [...activeMatches]
        .sort((a, b) => (toTime(b.date || b.createdAt) ?? 0) - (toTime(a.date || a.createdAt) ?? 0))
        .slice(0, 4),
    [activeMatches],
  )

  const standingsView = useMemo(
    () => computeStandings(activeMatches, rankingFilter),
    [activeMatches, rankingFilter],
  )
  const tableTitle = activeTable ? activeTable.name : t('nav_table')

  const handleNoteChange = (event) => {
    setNoteForm({ body: event.target.value })
  }

  const handleTableField = (field) => (event) => {
    setTableForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleCreateTable = async (event) => {
    event.preventDefault()
    setTableCreateError('')
    const name = tableForm.name.trim()
    if (!name) {
      setTableCreateError('Bitte einen Tabellennamen eingeben.')
      return
    }
    setCreatingTable(true)
    try {
      const docRef = await addDoc(collection(db, 'tables'), {
        name,
        createdAt: serverTimestamp(),
      })
      setTableForm({ name: '' })
      onSelectTable?.(docRef.id)
    } catch (err) {
      console.error(err)
      setTableCreateError('Konnte Tabelle nicht erstellen.')
    } finally {
      setCreatingTable(false)
    }
  }

  const handleDeleteTable = async (tableId, label) => {
    if (!tableId || !onDeleteTable) return
    const ok = window.confirm(
      `Tabelle "${label}" wirklich löschen? Alle Spiele darin werden ebenfalls gelöscht.`,
    )
    if (!ok) return
    setTableDeleteError('')
    setDeletingTableId(tableId)
    try {
      await onDeleteTable(tableId)
    } catch (err) {
      console.error(err)
      setTableDeleteError('Konnte Tabelle nicht löschen.')
    } finally {
      setDeletingTableId('')
    }
  }

  const handleDeleteMatch = async (matchId) => {
    if (!matchId) return
    const ok = window.confirm('Dieses Ergebnis wirklich löschen?')
    if (!ok) return
    setMatchDeleteError('')
    setDeletingMatchId(matchId)
    try {
      await deleteDoc(doc(db, 'matches', matchId))
    } catch (err) {
      console.error(err)
      setMatchDeleteError('Konnte Ergebnis nicht löschen.')
    } finally {
      setDeletingMatchId('')
    }
  }

  const handleNoteSubmit = async (event) => {
    event.preventDefault()
    setNotesError('')
    if (!noteForm.body.trim()) {
      setNotesError('Bitte einen Text eingeben.')
      return
    }
    setSavingNote(true)
    try {
      await addDoc(collection(db, 'notes'), {
        body: noteForm.body,
        createdAt: serverTimestamp(),
      })
      setNoteForm({ body: '' })
    } catch (err) {
      console.error(err)
      setNotesError('Konnte Notiz nicht speichern.')
    } finally {
      setSavingNote(false)
    }
  }

  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setNotes(next)
        setNoteExpanded(false)
        setLoadingNotes(false)
      },
      (err) => {
        console.error(err)
        setNotesError('Konnte Anmerkung nicht laden.')
        setLoadingNotes(false)
      },
    )
    return () => unsubscribe()
  }, [])

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />
      <header className="mb-8">
        <GradientBadge>{t('results_badge')}</GradientBadge>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">{t('results_title')}</h1>
        <p className="text-slate-300/80">{t('results_subtitle')}</p>
      </header>

      <div className="space-y-6" id="report">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {isAdmin ? (
            <Card title={t('admin_manage_tables')} kicker="Admin">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">
                    {t('admin_active_table')}
                  </p>
                  <div className="mt-2">
                    {loadingTables ? (
                      <p className="text-sm text-slate-300/70">{t('admin_loading_tables')}</p>
                    ) : tablesError ? (
                      <p className="text-sm text-red-200/90">{tablesError}</p>
                    ) : tables.length === 0 ? (
                      <p className="text-sm text-slate-300/70">{t('admin_no_table')}</p>
                    ) : (
                      <select
                        value={selectedTableId || ''}
                        onChange={(event) => onSelectTable?.(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                      >
                        {tables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {selectedTableId && activeTable ? (
                    <button
                      type="button"
                      disabled={deletingTableId === selectedTableId}
                      onClick={() => handleDeleteTable(selectedTableId, activeTable.name)}
                      className="mt-3 inline-flex items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-100 transition hover:border-red-400/70 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingTableId === selectedTableId ? 'Loesche...' : t('admin_delete_table')}
                    </button>
                  ) : null}
                </div>

                <form className="space-y-3" onSubmit={handleCreateTable}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/70">
                    {t('admin_new_table')}
                  </p>
                  <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                    {t('admin_table_name')}
                    <input
                      type="text"
                      value={tableForm.name}
                      onChange={handleTableField('name')}
                      className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                      placeholder={t('admin_table_placeholder')}
                    />
                  </label>
                  {tableCreateError ? (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                      {tableCreateError}
                    </p>
                  ) : null}
                  {tableDeleteError ? (
                    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                      {tableDeleteError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={creatingTable}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingTable ? t('admin_creating') : t('admin_create_table')}
                  </button>
                </form>
              </div>
            </Card>
          ) : null}

          {isAdmin ? (
            <Card title={t('workflow_results')} kicker="Workflow">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                  {t('workflow_table')}
                  {tables.length === 0 ? (
                    <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-100">
                      {t('workflow_no_table')}
                    </div>
                  ) : (
                    <select
                      value={selectedTableId || ''}
                      onChange={(event) => onSelectTable?.(event.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {tables.map((table) => (
                        <option key={table.id} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  )}
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                    {t('workflow_home')}
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
                    {t('workflow_away')}
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
                    {t('workflow_home_score')}
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
                    {t('workflow_away_score')}
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
                    {t('workflow_date')}
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
                    {saving ? t('workflow_saving') : t('workflow_save')}
                  </button>
                </div>
              </form>
            </Card>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title={t('live_feed')} kicker="Live Feed" id="results">
            <div className="space-y-3">
              {matchDeleteError ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  {matchDeleteError}
                </p>
              ) : null}
              {latestMatches.length === 0 ? (
                <p className="text-sm text-slate-300/70">
                  {selectedTableId ? t('live_feed_empty') : t('live_feed_select')}
                </p>
              ) : (
                latestMatches.map((match) => {
                  const isGsh = match.homeTeam === 'Gut Schluck Hauset' || match.awayTeam === 'Gut Schluck Hauset'
                  return (
                    <div
                      key={match.id}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                        isGsh
                          ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                          : 'border-white/5 bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {match.homeTeam} <span className="text-emerald-200">vs</span> {match.awayTeam}
                        </p>
                        <p className="text-xs text-slate-300/70">{formatDate(match.date)}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                        <div
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                            isGsh ? 'bg-emerald-500/20 text-emerald-50' : 'bg-slate-900/80 text-emerald-100'
                          }`}
                        >
                          <span>{match.homeScore}</span>
                          <span>:</span>
                          <span>{match.awayScore}</span>
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            disabled={deletingMatchId === match.id}
                            onClick={() => handleDeleteMatch(match.id)}
                            className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-100 transition hover:border-red-400/70 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingMatchId === match.id ? '...' : t('live_feed_delete')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          <Card title={t('notes_title')} kicker="GSH" id="notes">
            <div className="space-y-4">
            {isAdmin ? (
              <form className="space-y-3" onSubmit={handleNoteSubmit}>
                <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                  {t('notes_label')}
                  <textarea
                    value={noteForm.body}
                    onChange={handleNoteChange}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    rows="3"
                    placeholder={t('notes_placeholder')}
                  />
                </label>
                {notesError ? (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                    {notesError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={savingNote}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingNote ? t('notes_saving') : t('notes_save')}
                </button>
              </form>
            ) : null}

            <div className="space-y-3">
              {loadingNotes ? (
                <p className="text-sm text-slate-300/70">{t('notes_loading')}</p>
              ) : notesError ? (
                <p className="text-sm text-red-200/90">{notesError}</p>
              ) : notes.length === 0 ? (
                <p className="text-sm text-slate-300/70">{t('notes_empty')}</p>
              ) : (
                (() => {
                  const note = notes[0]
                  const noteText = note.body || note.text || ''
                  const wordList = noteText.trim() ? noteText.trim().split(/\s+/) : []
                  const isLong = wordList.length > 150
                  const displayText =
                    isLong && !noteExpanded ? `${wordList.slice(0, 150).join(' ')} ...` : noteText
                  return (
                    <div key={note.id} className="rounded-2xl border border-white/5 bg-white/5 p-3">
                      <p className="text-sm text-slate-200/90">{displayText}</p>
                      <p className="mt-1 text-[11px] text-slate-300/70">{formatDate(note.createdAt)}</p>
                      {isLong ? (
                        <button
                          type="button"
                          onClick={() => setNoteExpanded((v) => !v)}
                          className="mt-2 text-xs font-semibold text-emerald-200 hover:text-emerald-100"
                        >
                          {noteExpanded ? t('notes_less') : t('notes_more')}
                        </button>
                      ) : null}
                    </div>
                  )
                })()
              )}
            </div>
            </div>
          </Card>
        </div>
      </div>

      <Card title={tableTitle} kicker="Live Ranking" id="standings" className="mt-12">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          {[
            { value: 'all', label: t('public_filter_all') },
            { value: 'home', label: t('public_filter_home') },
            { value: 'away', label: t('public_filter_away') },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRankingFilter(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${rankingFilter === opt.value
                  ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-50 shadow shadow-emerald-500/30'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/50 hover:text-emerald-50'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

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
              {standingsView.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center text-slate-300/70">
                    Noch keine Daten. Erfasse das erste Ergebnis.
                  </td>
                </tr>
              ) : (
                standingsView.map((row, idx) => (
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
      <p className="text-slate-300/80">Adresse, Parken und Karte für den schnellsten Weg zum GSH.</p>
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
            <p className="text-xs text-slate-400">Parkplätze direkt vor dem Platz - Buslinie 722 bis "Hauset Dorf"</p>
            <a
              href="https://maps.google.com/?q=Kirchstra%C3%9Fe+97,+4730+Raeren"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              In Google Maps öffnen
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
        { icon: '🏟️', title: 'Tradition', body: 'Über 50 Jahre Vereinsgeschichte prägen unsere Identität' },
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

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || `event-${Date.now()}`

const GalleryPage = ({ isAdmin }) => {
  const { t } = useI18n()
  const [eventName, setEventName] = useState('')
  const [events, setEvents] = useState([])
  const [eventError, setEventError] = useState('')
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [images, setImages] = useState([])
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [editEventName, setEditEventName] = useState('')
  const [savingEventName, setSavingEventName] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState(false)
  const [deletingImageId, setDeletingImageId] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'galleryEvents'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setEvents(list)
        if (selectedEventId && list.length && !list.find((evt) => evt.id === selectedEventId)) {
          setSelectedEventId('')
        }
      },
      (err) => {
        console.error(err)
        setEventError('Events konnten nicht geladen werden.')
      },
    )
    return () => unsubscribe()
  }, [selectedEventId])

  const selectedEvent = events.find((evt) => evt.id === selectedEventId)

  useEffect(() => {
    setEditEventName(selectedEvent ? selectedEvent.name || selectedEvent.id : '')
  }, [selectedEventId, selectedEvent])

  useEffect(() => {
    if (!selectedEventId) {
      setImages([])
      return undefined
    }
    const imagesRef = query(
      collection(db, 'galleryEvents', selectedEventId, 'images'),
      orderBy('createdAt', 'desc'),
    )
    const unsubscribe = onSnapshot(
      imagesRef,
      (snapshot) => {
        setImages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
      },
      (err) => {
        console.error(err)
        setUploadError('Bilder konnten nicht geladen werden.')
      },
    )
    return () => unsubscribe()
  }, [selectedEventId])

  useEffect(() => {
    setLightboxIndex(null)
  }, [selectedEventId])

  useEffect(() => {
    if (lightboxIndex === null) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLightboxIndex(null)
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setLightboxIndex((prev) => {
          if (prev === null || images.length === 0) return null
          return (prev - 1 + images.length) % images.length
        })
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        setLightboxIndex((prev) => {
          if (prev === null || images.length === 0) return null
          return (prev + 1) % images.length
        })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxIndex, images.length])

  useEffect(() => {
    if (lightboxIndex === null) return
    if (images.length === 0) {
      setLightboxIndex(null)
      return
    }
    if (lightboxIndex > images.length - 1) {
      setLightboxIndex(images.length - 1)
    }
  }, [images, lightboxIndex])

  const currentLightboxImage =
    lightboxIndex !== null && images[lightboxIndex] ? images[lightboxIndex] : null

  const showPrevImage = () => {
    if (!images.length) return
    setLightboxIndex((prev) => {
      if (prev === null) return 0
      return (prev - 1 + images.length) % images.length
    })
  }

  const showNextImage = () => {
    if (!images.length) return
    setLightboxIndex((prev) => {
      if (prev === null) return 0
      return (prev + 1) % images.length
    })
  }

  const handleCreateEvent = async () => {
    setEventError('')
    if (!isAdmin) {
      setEventError('Nur Admins können Events anlegen.')
      return
    }
    const name = eventName.trim()
    if (!name) {
      setEventError('Bitte einen Event Namen eingeben.')
      return
    }
    const slug = slugify(name)
    setCreatingEvent(true)
    try {
      const eventRef = doc(db, 'galleryEvents', slug)
      await setDoc(
        eventRef,
        { name, slug, createdAt: serverTimestamp() },
        { merge: true },
      )
      setEventName('')
      setSelectedEventId(slug)
    } catch (err) {
      console.error(err)
      setEventError('Event konnte nicht angelegt werden.')
    } finally {
      setCreatingEvent(false)
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles(files)
  }

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Konnte Bild nicht lesen.'))
      reader.readAsDataURL(file)
    })

  const handleUpload = async (event) => {
    event.preventDefault?.()
    setUploadError('')
    if (!isAdmin) {
      setUploadError('Nur Admins können Bilder hochladen.')
      return
    }
    if (!selectedEventId) {
      setUploadError('Bitte zuerst ein Event anlegen oder auswählen.')
      return
    }
    if (!selectedFiles.length) {
      setUploadError('Bitte mindestens ein Bild waehlen.')
      return
    }
    setUploading(true)
    try {
      const dataUrls = await Promise.all(selectedFiles.map((file) => fileToBase64(file)))
      const imagesRef = collection(db, 'galleryEvents', selectedEventId, 'images')
      await Promise.all(
        dataUrls.map((dataUrl, idx) =>
          addDoc(imagesRef, {
            name: selectedFiles[idx].name,
            dataUrl,
            createdAt: serverTimestamp(),
          }),
        ),
      )
      setSelectedFiles([])
    } catch (err) {
      console.error(err)
      setUploadError('Upload fehlgeschlagen. Bitte versuche es erneut.')
    } finally {
      setUploading(false)
    }
  }

  const handleRenameEvent = async () => {
    if (!isAdmin) {
      setEventError('Nur Admins können Events bearbeiten.')
      return
    }
    if (!selectedEventId) {
      setEventError('Kein Event ausgewählt.')
      return
    }
    const name = editEventName.trim()
    if (!name) {
      setEventError('Bitte einen neuen Namen eingeben.')
      return
    }
    setSavingEventName(true)
    try {
      const eventRef = doc(db, 'galleryEvents', selectedEventId)
      await updateDoc(eventRef, { name })
    } catch (err) {
      console.error(err)
      setEventError('Event konnte nicht aktualisiert werden.')
    } finally {
      setSavingEventName(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!isAdmin) {
      setEventError('Nur Admins können Events löschen.')
      return
    }
    if (!selectedEventId) return
    const confirmDelete = window.confirm('Event und alle zugehörigen Bilder löschen?')
    if (!confirmDelete) return
    setDeletingEvent(true)
    try {
      const imagesRef = collection(db, 'galleryEvents', selectedEventId, 'images')
      const imgSnap = await getDocs(imagesRef)
      await Promise.all(imgSnap.docs.map((d) => deleteDoc(d.ref)))
      await deleteDoc(doc(db, 'galleryEvents', selectedEventId))
      setSelectedEventId('')
    } catch (err) {
      console.error(err)
      setEventError('Event konnte nicht gelöscht werden.')
    } finally {
      setDeletingEvent(false)
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (!isAdmin) {
      setUploadError('Nur Admins können Bilder löschen.')
      return
    }
    if (!selectedEventId || !imageId) return
    setDeletingImageId(imageId)
    try {
      await deleteDoc(doc(db, 'galleryEvents', selectedEventId, 'images', imageId))
    } catch (err) {
      console.error(err)
      setUploadError('Bild konnte nicht gelöscht werden.')
    } finally {
      setDeletingImageId('')
    }
  }

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-400/20 via-transparent to-transparent blur-3xl" />
      <header className="mb-8">
        <GradientBadge>{t('gallery_badge')}</GradientBadge>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">{t('gallery_title')}</h1>
      </header>

      {isAdmin ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title={t('gallery_create_event')} kicker={t('gallery_new')}>
            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                {t('gallery_event_name')}
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                  placeholder={t('gallery_event_placeholder')}
                />
              </label>
              {eventError ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  {eventError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={creatingEvent}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingEvent ? t('gallery_creating') : t('gallery_create')}
              </button>
            </div>
          </Card>

          <Card title={t('gallery_upload')} kicker={t('gallery_upload_kicker')}>
            <form className="space-y-3" onSubmit={handleUpload}>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                {t('gallery_select_event')}
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="">{t('gallery_select_placeholder')}</option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.name || evt.id}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                {t('gallery_images')}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  onChange={handleFileChange}
                  className="block w-full rounded-lg border border-dashed border-white/20 bg-slate-800/70 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/30 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white"
                />
                {selectedFiles.length ? (
                  <p className="text-xs text-emerald-200/80">
                    {t('gallery_selected')}: {selectedFiles.length} Datei(en)
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">{t('gallery_file_hint')}</p>
                )}
              </label>

              {uploadError ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  {uploadError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? t('gallery_uploading') : t('gallery_save_images')}
              </button>
            </form>
          </Card>
        </div>
      ) : null}

      {selectedEventId === '' ? (
        <div className="mt-8 space-y-4">
          {events.length === 0 ? (
            <span className="text-sm text-slate-400">Noch keine Events vorhanden.</span>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((evt) => (
                <button
                  key={evt.id}
                  type="button"
                  onClick={() => setSelectedEventId(evt.id)}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 px-5 py-5 text-left shadow-sm transition hover:border-emerald-300/35 hover:bg-white/5"
                >
                  <p className="text-lg font-semibold text-white leading-snug">{evt.name || evt.id}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xl font-semibold text-white">
              {selectedEvent ? selectedEvent.name || selectedEvent.id : 'Event'}
            </p>
            <div className="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center md:w-auto">
              {isAdmin ? (
                <>
                  <input
                    type="text"
                    value={editEventName}
                    onChange={(e) => setEditEventName(e.target.value)}
                    className="rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-sm text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    placeholder={t('gallery_event_name')}
                  />
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={handleRenameEvent}
                      disabled={savingEventName}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-emerald-300/50 hover:text-emerald-50 disabled:opacity-60"
                    >
                      {savingEventName ? t('gallery_creating') : t('gallery_save')}
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteEvent}
                      disabled={deletingEvent}
                      className="rounded-full border border-red-400/60 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-60"
                    >
                      {deletingEvent ? t('gallery_deleting') : t('gallery_delete')}
                    </button>
                  </div>
                </>
              ) : null}
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedEventId('')}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white hover:border-emerald-300/50 hover:text-emerald-50"
                >
                  {t('gallery_back')}
                </button>
              </div>
            </div>
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-slate-300/80">
              Noch keine Bilder gespeichert. Lade jetzt welche hoch.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-lg shadow-emerald-500/10"
                >
                  {img.dataUrl ? (
                    <div className="relative aspect-[4/3] bg-slate-800/60">
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="absolute inset-0 cursor-zoom-in"
                        aria-label="Bild in Originalgröße anzeigen"
                      >
                        <img
                          src={img.dataUrl}
                          alt={img.name || 'Event Bild'}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDeleteImage(img.id)
                          }}
                          disabled={deletingImageId === img.id}
                          className="absolute right-3 top-3 rounded-full border border-white/20 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-white shadow hover:border-red-400/60 hover:text-red-200 disabled:opacity-60"
                        >
                          {deletingImageId === img.id ? '...' : 'Löschen'}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-slate-800/50 text-sm text-slate-300/70">
                      Kein Bildinhalt vorhanden
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentLightboxImage?.dataUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-5 top-5 rounded-full border border-white/20 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white hover:border-emerald-300/50 hover:text-emerald-50"
          >
            Schließen
          </button>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  showPrevImage()
                }}
                className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-900/80 px-3 py-2 text-lg font-bold text-white hover:border-emerald-300/50 hover:text-emerald-50"
                aria-label="Vorheriges Bild"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  showNextImage()
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-900/80 px-3 py-2 text-lg font-bold text-white hover:border-emerald-300/50 hover:text-emerald-50"
                aria-label="Nächstes Bild"
              >
                ›
              </button>
            </>
          ) : null}
          <div
            className="max-h-[90vh] max-w-[95vw] overflow-hidden rounded-2xl border border-white/15 bg-slate-900/60 p-2"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={currentLightboxImage.dataUrl}
              alt={currentLightboxImage.name || 'Event Bild'}
              className="max-h-[85vh] w-auto max-w-[90vw] object-contain sm:max-h-[85vh] sm:max-w-[90vw]"
            />
          </div>
          {images.length > 1 && lightboxIndex !== null ? (
            <p className="absolute bottom-5 rounded-full border border-white/15 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-100">
              {lightboxIndex + 1} / {images.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

const SchedulePage = ({ user, isAdmin }) => {
  const { t } = useI18n()
  const defaultDate = new Date().toLocaleDateString('sv-SE')
  const defaultHour = new Date().toLocaleTimeString('de-DE', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'Europe/Berlin',
  })
  const defaultMinute = String(
    Math.max(
      1,
      Math.min(
        59,
        Number(
          new Date().toLocaleTimeString('de-DE', {
            minute: '2-digit',
            hour12: false,
            timeZone: 'Europe/Berlin',
          }),
        ),
      ),
    ),
  ).padStart(2, '0')
  const [games, setGames] = useState([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [gamesError, setGamesError] = useState('')
  const [savingGame, setSavingGame] = useState(false)
  const [editingGameId, setEditingGameId] = useState('')
  const [editForm, setEditForm] = useState({
    opponent: '',
    location: '',
    gshSide: 'home',
    date: defaultDate,
    meetTime: `${defaultHour}:${defaultMinute}`,
    startTime: `${defaultHour}:${defaultMinute}`,
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingGameId, setDeletingGameId] = useState('')
  const [nowTick, setNowTick] = useState(Date.now())
  const [openGameId, setOpenGameId] = useState('')
  const [gameForm, setGameForm] = useState({
    opponent: '',
    location: '',
    gshSide: 'home',
    date: defaultDate,
    meetTime: `${defaultHour}:${defaultMinute}`,
    startTime: `${defaultHour}:${defaultMinute}`,
  })
  const [votingId, setVotingId] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'schedule'), orderBy('date', 'asc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setGames(next)
        setLoadingGames(false)
      },
      (err) => {
        console.error(err)
        setGamesError('Konnte Spielplan nicht laden.')
        setLoadingGames(false)
      },
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 60000)
    return () => clearInterval(id)
  }, [])

  const handleGameField = (field) => (event) => {
    setGameForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleEditField = (field) => (event) => {
    setEditForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleCreateGame = async (event) => {
    event.preventDefault()
    if (!isAdmin) return
    setGamesError('')
    if (!gameForm.opponent.trim()) {
      setGamesError('Bitte Gegner eintragen.')
      return
    }
    if (!gameForm.location.trim()) {
      setGamesError('Bitte Ort eintragen.')
      return
    }
    if (!gameForm.date) {
      setGamesError('Bitte Datum auswählen.')
      return
    }
    setSavingGame(true)
    try {
      await addDoc(collection(db, 'schedule'), {
        opponent: gameForm.opponent.trim(),
        location: gameForm.location.trim(),
        gshSide: gameForm.gshSide || 'home',
        date: gameForm.date,
        meetTime: gameForm.meetTime || null,
        startTime: gameForm.startTime || null,
        createdAt: serverTimestamp(),
        votes: {},
      })
      setGameForm((prev) => ({ ...prev, opponent: '', location: '' }))
    } catch (err) {
      console.error(err)
      setGamesError('Konnte Spiel nicht speichern.')
    } finally {
      setSavingGame(false)
    }
  }

  const handleVote = async (gameId, value) => {
    if (!user) return
    setGamesError('')
    setVotingId(gameId)
    try {
      const displayName = user.displayName || user.email || 'Spieler'
      await updateDoc(doc(db, 'schedule', gameId), {
        [`votes.${user.uid}`]: {
          status: value,
          name: displayName,
          email: user.email || null,
          updatedAt: serverTimestamp(),
        },
      })
    } catch (err) {
      console.error(err)
      setGamesError('Abstimmung fehlgeschlagen.')
    } finally {
      setVotingId('')
    }
  }

  const getGameDateTime = (game) => {
    if (!game?.date) return null
    const [y, m, d] = game.date.split('-').map(Number)
    const base = new Date(y, (m || 1) - 1, d || 1)
    if (Number.isNaN(base.getTime())) return null
    const time = (game.startTime || '00:00').split(':')
    const hours = Number(time[0] || 0)
    const minutes = Number(time[1] || 0)
    base.setHours(hours, minutes, 0, 0)
    return base
  }

  const isVotingClosed = (game) => {
    const gameDateTime = getGameDateTime(game)
    if (!gameDateTime) return false
    const closeDate = new Date(gameDateTime)
    closeDate.setDate(closeDate.getDate() - 4)
    return nowTick >= closeDate.getTime()
  }

  const getVotingCountdown = (game) => {
    const gameDateTime = getGameDateTime(game)
    if (!gameDateTime) return ''
    const closeDate = new Date(gameDateTime)
    closeDate.setDate(closeDate.getDate() - 4)
    const diffMs = closeDate.getTime() - nowTick
    if (diffMs <= 0) return 'Geschlossen'
    const totalMinutes = Math.floor(diffMs / 60000)
    const days = Math.floor(totalMinutes / (60 * 24))
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
    const minutes = totalMinutes % 60
    const parts = []
    if (days) parts.push(`${days}d`)
    if (hours) parts.push(`${hours}h`)
    parts.push(`${minutes}m`)
    return parts.join(' ')
  }

  const formatWeekday = (value) => {
    if (!value) return ''
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return ''
    return parsed.toLocaleDateString('de-DE', { weekday: 'long', timeZone: 'Europe/Berlin' })
  }

  const startEditGame = (game) => {
    setEditingGameId(game.id)
    setEditForm({
      opponent: game.opponent || '',
      location: game.location || '',
      gshSide: game.gshSide || 'home',
      date: game.date || defaultDate,
      meetTime: game.meetTime || `${defaultHour}:${defaultMinute}`,
      startTime: game.startTime || `${defaultHour}:${defaultMinute}`,
    })
  }

  const cancelEditGame = () => {
    setEditingGameId('')
  }

  const handleUpdateGame = async (event) => {
    event.preventDefault()
    if (!isAdmin || !editingGameId) return
    setGamesError('')
    if (!editForm.opponent.trim()) {
      setGamesError('Bitte Gegner eintragen.')
      return
    }
    if (!editForm.location.trim()) {
      setGamesError('Bitte Ort eintragen.')
      return
    }
    if (!editForm.date) {
      setGamesError('Bitte Datum auswählen.')
      return
    }
    setSavingEdit(true)
    try {
      await updateDoc(doc(db, 'schedule', editingGameId), {
        opponent: editForm.opponent.trim(),
        location: editForm.location.trim(),
        gshSide: editForm.gshSide || 'home',
        date: editForm.date,
        meetTime: editForm.meetTime || null,
        startTime: editForm.startTime || null,
        updatedAt: serverTimestamp(),
      })
      setEditingGameId('')
    } catch (err) {
      console.error(err)
      setGamesError('Konnte Spiel nicht aktualisieren.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteGame = async (gameId) => {
    if (!isAdmin || !gameId) return
    const ok = window.confirm('Spiel wirklich löschen?')
    if (!ok) return
    setGamesError('')
    setDeletingGameId(gameId)
    try {
      await deleteDoc(doc(db, 'schedule', gameId))
    } catch (err) {
      console.error(err)
      setGamesError('Konnte Spiel nicht löschen.')
    } finally {
      setDeletingGameId('')
    }
  }

  const toggleGameDetails = (gameId) => {
    setOpenGameId((prev) => (prev === gameId ? '' : gameId))
  }

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />
      <header className="mb-8">
        <GradientBadge>{t('schedule_badge')}</GradientBadge>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">{t('schedule_title')}</h1>
        <p className="text-slate-300/80">{t('schedule_subtitle')}</p>
      </header>

      <div className="space-y-6">
        {isAdmin ? (
          <Card title="Spiel erstellen" kicker="Admin">
            <form className="space-y-4" onSubmit={handleCreateGame}>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Gegner
                <select
                  value={gameForm.opponent}
                  onChange={handleGameField('opponent')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                  required
                >
                  <option value="">Bitte wählen</option>
                    {TEAM_OPTIONS.filter((team) => team !== 'Gut Schluck Hauset').map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Ort
                <select
                  value={gameForm.location}
                  onChange={handleGameField('location')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                  required
                >
                  <option value="">Bitte wählen</option>
                  {STADIUM_OPTIONS.map((stadium) => (
                    <option key={stadium} value={stadium}>
                      {stadium}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Gut Schluck Hauset
                <select
                  value={gameForm.gshSide}
                  onChange={handleGameField('gshSide')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="home">Heim</option>
                  <option value="away">Auswärts</option>
                </select>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                  Datum
                  <input
                    type="date"
                    value={gameForm.date}
                    onChange={handleGameField('date')}
                    lang="de"
                    className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    required
                  />
                </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                    Treffpunkt Stunde
                    <select
                      value={gameForm.meetTime.split(':')[0]}
                      onChange={(event) => {
                        const hour = event.target.value
                        const minute = gameForm.meetTime.split(':')[1] || '00'
                        setGameForm((prev) => ({ ...prev, meetTime: `${hour}:${minute}` }))
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, '0')).map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                    Treffpunkt Minute
                    <select
                      value={gameForm.meetTime.split(':')[1]}
                      onChange={(event) => {
                        const minute = event.target.value
                        const hour = gameForm.meetTime.split(':')[0] || '00'
                        setGameForm((prev) => ({ ...prev, meetTime: `${hour}:${minute}` }))
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {Array.from({ length: 60 }, (_, idx) => String(idx).padStart(2, '0')).map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                    Spielbeginn Stunde
                    <select
                      value={gameForm.startTime.split(':')[0]}
                      onChange={(event) => {
                        const hour = event.target.value
                        const minute = gameForm.startTime.split(':')[1] || '00'
                        setGameForm((prev) => ({ ...prev, startTime: `${hour}:${minute}` }))
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, '0')).map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                    Spielbeginn Minute
                    <select
                      value={gameForm.startTime.split(':')[1]}
                      onChange={(event) => {
                        const minute = event.target.value
                        const hour = gameForm.startTime.split(':')[0] || '00'
                        setGameForm((prev) => ({ ...prev, startTime: `${hour}:${minute}` }))
                      }}
                      className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                    >
                      {Array.from({ length: 60 }, (_, idx) => String(idx).padStart(2, '0')).map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              </div>
              {gamesError ? (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                  {gamesError}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={savingGame}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingGame ? 'Speichert...' : 'Spiel erstellen'}
              </button>
            </form>
          </Card>
        ) : null}

        <div className="space-y-4">
          {loadingGames ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300/70">
              Lade Spielplan...
            </div>
          ) : games.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300/70">
              Noch keine Spiele geplant.
            </div>
          ) : (
            games.map((game) => {
              const votes = game.votes || {}
              const values = Object.values(votes)
              const yesList = values.filter((v) => v?.status === 'yes')
              const noList = values.filter((v) => v?.status === 'no')
              const userVote = user ? votes[user.uid]?.status : null
              const isEditing = editingGameId === game.id
              return (
                <div
                  key={game.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-emerald-400/30"
                >
                    {isEditing ? (
                      <form className="space-y-3" onSubmit={handleUpdateGame}>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Gegner
                            <select
                              value={editForm.opponent}
                              onChange={handleEditField('opponent')}
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                              required
                            >
                              <option value="">Bitte wählen</option>
                              {TEAM_OPTIONS.filter((team) => team !== 'Gut Schluck Hauset').map((team) => (
                                <option key={team} value={team}>
                                  {team}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Ort
                            <select
                              value={editForm.location}
                              onChange={handleEditField('location')}
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                              required
                            >
                              <option value="">Bitte wählen</option>
                              {STADIUM_OPTIONS.map((stadium) => (
                                <option key={stadium} value={stadium}>
                                  {stadium}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Gut Schluck Hauset
                            <select
                              value={editForm.gshSide}
                              onChange={handleEditField('gshSide')}
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                            >
                              <option value="home">Heim</option>
                              <option value="away">Auswärts</option>
                            </select>
                          </label>
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Datum
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={handleEditField('date')}
                              lang="de"
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                              required
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Treffpunkt Stunde
                            <select
                              value={editForm.meetTime.split(':')[0]}
                              onChange={(event) => {
                                const hour = event.target.value
                                const minute = editForm.meetTime.split(':')[1] || '00'
                                setEditForm((prev) => ({ ...prev, meetTime: `${hour}:${minute}` }))
                              }}
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                            >
                              {Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, '0')).map((hour) => (
                                <option key={hour} value={hour}>
                                  {hour}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Treffpunkt Minute
                            <select
                              value={editForm.meetTime.split(':')[1]}
                              onChange={(event) => {
                                const minute = event.target.value
                                const hour = editForm.meetTime.split(':')[0] || '00'
                                setEditForm((prev) => ({ ...prev, meetTime: `${hour}:${minute}` }))
                              }}
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                            >
                              {Array.from({ length: 60 }, (_, idx) => String(idx).padStart(2, '0')).map((minute) => (
                                <option key={minute} value={minute}>
                                  {minute}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Spielbeginn Stunde
                            <select
                              value={editForm.startTime.split(':')[0]}
                              onChange={(event) => {
                                const hour = event.target.value
                                const minute = editForm.startTime.split(':')[1] || '00'
                                setEditForm((prev) => ({ ...prev, startTime: `${hour}:${minute}` }))
                              }}
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                            >
                              {Array.from({ length: 24 }, (_, idx) => String(idx).padStart(2, '0')).map((hour) => (
                                <option key={hour} value={hour}>
                                  {hour}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                            Spielbeginn Minute
                            <select
                              value={editForm.startTime.split(':')[1]}
                              onChange={(event) => {
                                const minute = event.target.value
                                const hour = editForm.startTime.split(':')[0] || '00'
                                setEditForm((prev) => ({ ...prev, startTime: `${hour}:${minute}` }))
                              }}
                              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                            >
                              {Array.from({ length: 60 }, (_, idx) => String(idx).padStart(2, '0')).map((minute) => (
                                <option key={minute} value={minute}>
                                  {minute}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={savingEdit}
                            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingEdit ? 'Speichert...' : 'Speichern'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditGame}
                            className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:border-emerald-300/50"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div
                          className="cursor-pointer"
                          onClick={() => toggleGameDetails(game.id)}
                        >
                          <p className="text-lg font-semibold text-white">
                            {game.gshSide === 'away'
                              ? `${game.opponent} vs Gut Schluck Hauset`
                              : `Gut Schluck Hauset vs ${game.opponent}`}
                          </p>
                          <div className="mt-3 text-white">
                            <div className="space-y-2 sm:hidden">
                              {[
                                { label: 'Datum', value: formatDate(game.date) },
                                { label: 'Treffpunkt', value: game.meetTime || '--:--' },
                                { label: 'Spielbeginn', value: game.startTime || '--:--' },
                                { label: 'Timer', value: getVotingCountdown(game) },
                              ].map((item) => (
                                <div key={item.label} className="flex items-baseline justify-between gap-3">
                                  <span className="text-xs uppercase tracking-[0.2em] text-slate-300/80">
                                    {item.label}
                                  </span>
                                  <span className="text-sm font-semibold text-white">{item.value}</span>
                                </div>
                              ))}
                            </div>
                            <div className="hidden sm:block">
                              <div className="grid grid-cols-[1.1fr_0.9fr_1.3fr_1.2fr] gap-2 sm:gap-10 px-1 text-sm uppercase tracking-[0.2em] text-slate-300/80">
                                <span className="text-center">Datum</span>
                                <span className="text-center">Treffpunkt</span>
                                <span className="text-center">Spielbeginn</span>
                                <span className="text-center">Timer</span>
                              </div>
                              <div className="mt-2 grid grid-cols-[1.1fr_0.9fr_1.3fr_1.2fr] gap-2 sm:gap-6 px-1 text-base font-semibold text-white">
                                <span className="text-center">{formatDate(game.date)}</span>
                                <span className="text-center">{game.meetTime || '--:--'}</span>
                                <span className="text-center">{game.startTime || '--:--'}</span>
                                <span className="text-center">{getVotingCountdown(game)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isVotingClosed(game) ? null : null}
                          <button
                            type="button"
                            disabled={!user || votingId === game.id || isVotingClosed(game)}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(game.id, 'yes')
                            }}
                            className={`rounded-full px-4 py-2 text-lg font-semibold transition ${
                              userVote === 'yes'
                                ? 'bg-emerald-500/20 text-emerald-50 border border-emerald-400/60'
                                : 'border border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/50 hover:text-emerald-50'
                            }`}
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            disabled={!user || votingId === game.id || isVotingClosed(game)}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(game.id, 'maybe')
                            }}
                            className={`rounded-full px-4 py-2 text-lg font-semibold transition ${
                              userVote === 'maybe'
                                ? 'bg-amber-500/20 text-amber-50 border border-amber-400/60'
                                : 'border border-white/10 bg-white/5 text-slate-200 hover:border-amber-300/50 hover:text-amber-50'
                            }`}
                          >
                            ?
                          </button>
                          <button
                            type="button"
                            disabled={!user || votingId === game.id || isVotingClosed(game)}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleVote(game.id, 'no')
                            }}
                            className={`rounded-full px-4 py-2 text-lg font-semibold transition ${
                              userVote === 'no'
                                ? 'bg-red-500/20 text-red-100 border border-red-400/60'
                                : 'border border-white/10 bg-white/5 text-slate-200 hover:border-red-300/50 hover:text-red-100'
                            }`}
                          >
                            👎
                          </button>
                          {isAdmin ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditGame(game)
                                }}
                                className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-white transition hover:border-emerald-300/50"
                              >
                                Bearbeiten
                              </button>
                              <button
                                type="button"
                                disabled={deletingGameId === game.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteGame(game.id)
                                }}
                                className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-100 transition hover:border-red-400/70 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingGameId === game.id ? '...' : 'Loeschen'}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {openGameId === game.id ? (
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200/90">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300/70">Adresse</p>
                        {game.location ? (
                          (() => {
                            const [address, rest] = game.location.split(' (')
                            const detail = rest ? `(${rest}` : ''
                            return (
                              <div className="mt-2">
                                <p className="text-sm font-semibold text-white">{address}</p>
                                {detail ? (
                                  <p className="text-xs text-slate-300/80">{detail}</p>
                                ) : null}
                              </div>
                            )
                          })()
                        ) : (
                          <p className="mt-2">Keine Adresse hinterlegt.</p>
                        )}
                        {game.location ? (
                          <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
                            <iframe
                              title={`Karte ${game.location}`}
                              src={`https://maps.google.com/maps?q=${encodeURIComponent(game.location)}&z=16&output=embed`}
                              width="100%"
                              height="220"
                              allowFullScreen=""
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              className="border-0"
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {isAdmin ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-xs text-emerald-50">
                          <p className="font-semibold">Dabei</p>
                          <p className="mt-1">
                            {yesList.length
                              ? yesList.map((v) => v.name || v.email || 'Spieler').join(', ')
                              : '—'}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-50">
                            <p className="font-semibold">Vielleicht</p>
                            <p className="mt-1">
                              {values.filter((v) => v?.status === 'maybe').length
                                ? values
                                    .filter((v) => v?.status === 'maybe')
                                    .map((v) => v.name || v.email || 'Spieler')
                                    .join(', ')
                                : '—'}
                            </p>
                          </div>
                          <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-100">
                            <p className="font-semibold">Nicht dabei</p>
                            <p className="mt-1">
                              {noList.length
                                ? noList.map((v) => v.name || v.email || 'Spieler').join(', ')
                                : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

const TeamPage = ({ isAdmin }) => {
  const { t } = useI18n()
  const [players, setPlayers] = useState([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [playersError, setPlayersError] = useState('')
  const [playerForm, setPlayerForm] = useState({
    name: '',
    number: '',
    position: 'tor',
    staffRole: '',
  })
  const [savingPlayer, setSavingPlayer] = useState(false)
  const [playerImage, setPlayerImage] = useState(null)
  const [deletingPlayerId, setDeletingPlayerId] = useState('')

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'playerprofiles'),
      (snapshot) => {
        const next = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setPlayers(next)
        setLoadingPlayers(false)
      },
      (err) => {
        console.error(err)
        setPlayersError('Konnte Spieler nicht laden.')
        setLoadingPlayers(false)
      },
    )
    return () => unsubscribe()
  }, [])

  const handlePlayerChange = (field) => (event) => {
    setPlayerForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handlePlayerSubmit = async (event) => {
    event.preventDefault()
    setPlayersError('')
    if (!isAdmin) {
      setPlayersError('Nur Admins können Profile anlegen.')
      return
    }
    if (!playerForm.name.trim()) {
      setPlayersError('Bitte Name eingeben.')
      return
    }
    if (!playerForm.position) {
      setPlayersError('Bitte Position wählen.')
      return
    }
    if (playerForm.position === 'staff' && !playerForm.staffRole.trim()) {
      setPlayersError('Bitte Rolle für Trainerstab auswählen.')
      return
    }
    setSavingPlayer(true)
    try {
      let photoData = null
      if (playerImage) {
        const isValidType = ['image/png', 'image/jpeg', 'image/jpg'].includes(playerImage.type)
        if (!isValidType) {
          setPlayersError('Bitte PNG oder JPG hochladen.')
          setSavingPlayer(false)
          return
        }
        photoData = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('Konnte Bild nicht lesen.'))
          reader.readAsDataURL(playerImage)
        })
      }

      const num = playerForm.number ? Number(playerForm.number) : null
      await addDoc(collection(db, 'playerprofiles'), {
        name: playerForm.name,
        number: Number.isNaN(num) ? null : num,
        position: playerForm.position || 'tor',
        staffRole: playerForm.position === 'staff' ? playerForm.staffRole || null : null,
        photo: photoData,
        createdAt: serverTimestamp(),
      })
      setPlayerForm({ name: '', number: '', position: 'tor', staffRole: '' })
      setPlayerImage(null)
    } catch (err) {
      console.error(err)
      setPlayersError('Konnte Spieler nicht speichern.')
    } finally {
      setSavingPlayer(false)
    }
  }

  const handleDeletePlayer = async (playerId) => {
    if (!isAdmin) {
      setPlayersError('Nur Admins können Profile löschen.')
      return
    }
    if (!playerId) return
    const confirmDelete = window.confirm('Profil wirklich löschen?')
    if (!confirmDelete) return
    setPlayersError('')
    setDeletingPlayerId(playerId)
    try {
      await deleteDoc(doc(db, 'playerprofiles', playerId))
    } catch (err) {
      console.error(err)
      setPlayersError('Profil konnte nicht gelöscht werden.')
    } finally {
      setDeletingPlayerId('')
    }
  }

  const positionOrder = useMemo(
    () =>
      POSITION_GROUPS.reduce((acc, pos, idx) => {
        acc[pos.key] = idx
        return acc
      }, {}),
    [],
  )

  const groupedPlayers = useMemo(() => {
    const base = POSITION_GROUPS.map((group) => ({ ...group, list: [] }))
    const unknown = { key: 'other', label: 'Sonstiges', list: [] }
    const sorted = [...players].sort((a, b) => {
      const posA = positionOrder[a.position] ?? 99
      const posB = positionOrder[b.position] ?? 99
      if (posA !== posB) return posA - posB
      const numA = Number(a.number)
      const numB = Number(b.number)
      const hasNumA = !Number.isNaN(numA)
      const hasNumB = !Number.isNaN(numB)
      if (hasNumA && hasNumB && numA !== numB) return numA - numB
      return (a.name || '').localeCompare(b.name || '')
    })

    sorted.forEach((player) => {
      const target = base.find((g) => g.key === player.position) || unknown
      target.list.push(player)
    })
    return [...base, ...(unknown.list.length ? [unknown] : [])]
  }, [players, positionOrder])

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/15 via-transparent to-transparent blur-3xl" />
      <header className="mb-8">
        <GradientBadge>{t('team_badge')}</GradientBadge>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">{t('team_title')}</h1>
      </header>

      {isAdmin ? (
        <Card title="Profil anlegen" kicker="Admin" id="player-create">
          <form className="space-y-4" onSubmit={handlePlayerSubmit}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Name
                <input
                  type="text"
                  value={playerForm.name}
                  onChange={handlePlayerChange('name')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Nummer
                <input
                  type="number"
                  min="0"
                  value={playerForm.number}
                  onChange={handlePlayerChange('number')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="z.B. 13 (optional)"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Position
                <select
                  value={playerForm.position}
                  onChange={handlePlayerChange('position')}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                >
                  {POSITION_GROUPS.map((pos) => (
                    <option key={pos.key} value={pos.key}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </label>
              {playerForm.position === 'staff' ? (
                <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                  Rolle (Trainerstab)
                  <select
                    value={playerForm.staffRole}
                    onChange={handlePlayerChange('staffRole')}
                    className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="Trainer">Trainer</option>
                    <option value="Co-Trainer">Co-Trainer</option>
                    <option value="Assistent">Assistent</option>
                  </select>
                </label>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-slate-200/80">
                Bild (PNG/JPG)
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                  onChange={(e) => setPlayerImage(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500/30 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-white"
                />
                {playerImage ? (
                  <span className="text-xs text-emerald-200/90">Ausgewählt: {playerImage.name}</span>
                ) : (
                  <span className="text-xs text-slate-400">Optional, PNG oder JPG</span>
                )}
              </label>
            </div>
            {playersError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {playersError}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={savingPlayer}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-orange-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPlayer ? 'Speichert...' : 'Profil speichern'}
            </button>
          </form>
        </Card>
      ) : null}

      <div className="space-y-10">
        {loadingPlayers ? (
          <Card title="Lade Kader..." kicker="Status">
            <p className="text-sm text-slate-300/70">Spieler werden geladen.</p>
          </Card>
        ) : playersError ? (
          <Card title="Fehler" kicker="Kader">
            <p className="text-sm text-red-200/90">{playersError}</p>
          </Card>
        ) : (
          groupedPlayers.map((group) =>
            group.list.length === 0 ? null : (
              <div key={group.key}>
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200/80">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {group.list.map((player) => {
                    const initials = (player.name || '')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()
                    return (
                      <div
                        key={player.id}
                        className="relative h-72 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-lg shadow-emerald-500/10"
                      >
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-indigo-500/30 via-slate-800 to-slate-900 text-2xl font-bold text-emerald-100">
                            {initials || '?'}
                          </div>
                        )}
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(player.id)}
                            disabled={deletingPlayerId === player.id}
                            className="absolute right-3 top-3 z-10 rounded-full border border-white/20 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold text-white shadow hover:border-red-400/70 hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingPlayerId === player.id ? '...' : 'Löschen'}
                          </button>
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-slate-900/80" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-4 py-3">
                          <div>
                            {player.number ? (
                              <p className="text-sm font-bold text-emerald-200 drop-shadow">#{player.number}</p>
                            ) : null}
                            <p className="text-lg font-semibold leading-tight text-white">{player.name || 'Unbekannt'}</p>
                          </div>
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-emerald-200">
                            {player.position === 'staff' ? player.staffRole || 'Staff' : group.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ),
          )
        )}
      </div>
    </div>
  )
}

const PublicTablePage = ({ matches, activeTable }) => {
  const { t } = useI18n()
  const [publicFilter, setPublicFilter] = useState('all')
  const publicMatches = useMemo(() => {
    if (!activeTable) return []
    return matches.filter((match) => match.tableId === activeTable.id)
  }, [matches, activeTable])
  const publicLatestMatches = useMemo(() => {
    const getMatchTime = (match) => {
      if (!match?.date) return 0
      if (match.date?.toDate) return match.date.toDate().getTime()
      const parsed = new Date(match.date)
      return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
    }
    return [...publicMatches].sort((a, b) => getMatchTime(b) - getMatchTime(a)).slice(0, 6)
  }, [publicMatches])
  const standingsView = useMemo(
    () => computeStandings(publicMatches, publicFilter),
    [publicMatches, publicFilter],
  )
  const tableTitle = activeTable ? activeTable.name : t('nav_table')

  return (
    <div className="relative isolate w-full px-4 pt-10 sm:px-6 lg:px-10">
      <div className="absolute inset-0 -z-10 bg-grid-radial bg-[length:40px_40px] opacity-30" />
      <div className="absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl" />
      <header className="mb-8">
        <GradientBadge>{t('public_badge')}</GradientBadge>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white">{tableTitle}</h1>
        <p className="text-slate-300/80">{t('public_subtitle')}</p>
      </header>
      <Card title={t('live_feed')} kicker="Live Feed" id="public-results" className="mb-8">
        <div className="space-y-3">
          {publicLatestMatches.length === 0 ? (
            <p className="text-sm text-slate-300/70">
              {activeTable ? t('live_feed_empty') : t('live_feed_select')}
            </p>
          ) : (
            publicLatestMatches.map((match) => {
              const isGsh = match.homeTeam === 'Gut Schluck Hauset' || match.awayTeam === 'Gut Schluck Hauset'
              return (
                <div
                  key={match.id}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                    isGsh
                      ? 'border-emerald-400/50 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : 'border-white/5 bg-white/5'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {match.homeTeam} <span className="text-emerald-200">vs</span> {match.awayTeam}
                    </p>
                    <p className="text-xs text-slate-300/70">{formatDate(match.date)}</p>
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${
                      isGsh ? 'bg-emerald-500/20 text-emerald-50' : 'bg-slate-900/80 text-emerald-100'
                    }`}
                  >
                    <span>{match.homeScore}</span>
                    <span>:</span>
                    <span>{match.awayScore}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
      <Card title={tableTitle} kicker="Live Ranking">
        <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
          {[
            { value: 'all', label: t('public_filter_all') },
            { value: 'home', label: t('public_filter_home') },
            { value: 'away', label: t('public_filter_away') },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPublicFilter(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${publicFilter === opt.value
                  ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-50 shadow shadow-emerald-500/30'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/50 hover:text-emerald-50'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
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
              {standingsView.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center text-slate-300/70">
                    {t('public_no_data')}
                  </td>
                </tr>
              ) : (
                standingsView.map((row, idx) => (
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

const LoginPage = ({ user }) => {
  const { t } = useI18n()
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
          <GradientBadge>{t('login_badge')}</GradientBadge>
          <h1 className="mt-3 font-display text-3xl font-semibold text-white">{t('login_title')}</h1>
          <p className="text-slate-300/80">
            {t('login_subtitle')}
            <br />
            {t('login_members')}
          </p>
        </div>

        {user ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
            Bereits angemeldet als <span className="font-semibold">{user.email}</span>.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
            {t('login_email')}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
            {t('login_password')}
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
            {loading ? t('login_loading') : t('login_button')}
          </button>
        </form>
      </div>
    </div>
  )
}

const SettingsPage = ({ user, onProfileSaved, theme, onThemeChange }) => {
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
      await updateProfile(user, { displayName: displayName || null })
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
        </div>

        <form className="space-y-4" onSubmit={handleSave}>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-200/80">Design</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'dark', label: 'Dark Mode' },
                { value: 'light', label: 'Light Mode' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onThemeChange?.(opt.value)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    theme === opt.value
                      ? 'border-emerald-400/70 bg-emerald-500/20 text-emerald-50 shadow shadow-emerald-500/30'
                      : 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-300/50 hover:text-emerald-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-200/80">
            Anzeigename
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-slate-800/80 px-3 py-2 text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/40"
              placeholder="Vorname, Nachname"
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
  const [tables, setTables] = useState([])
  const [playerProfiles, setPlayerProfiles] = useState([])
  const [theme, setTheme] = useState(() => {
    try {
      return window?.localStorage?.getItem('gsh-theme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [loadingTables, setLoadingTables] = useState(true)
  const [tablesError, setTablesError] = useState('')
  const [selectedTableId, setSelectedTableId] = useState('')
  const [form, setForm] = useState({
    homeTeam: 'Gut Schluck Hauset',
    awayTeam: 'Gut Schluck Hauset',
    homeScore: '',
    awayScore: '',
    date: new Date().toISOString().slice(0, 10),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const standings = useMemo(() => computeStandings(matches), [matches])
  const navItems = user ? PRIVATE_NAV_ITEMS : PUBLIC_NAV_ITEMS
  const activeTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) || null,
    [tables, selectedTableId],
  )
  const isAdmin = useMemo(() => {
    const email = (user?.email || '').toLowerCase()
    if (!email) return false
    return ADMIN_EMAILS.includes(email)
  }, [user])
  const userAvatar = useMemo(() => {
    const name = normalizeName(user?.displayName)
    if (!name) return null
    const match = playerProfiles.find((player) => normalizeName(player?.name) === name)
    return match?.photo || null
  }, [playerProfiles, user])

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
    const q = query(collection(db, 'tables'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const next = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setTables(next)
        setTablesError('')
        setLoadingTables(false)
        setSelectedTableId((prev) => {
          if (prev && next.some((table) => table.id === prev)) return prev
          const stored = window?.localStorage?.getItem(TABLE_STORAGE_KEY) || ''
          if (stored && next.some((table) => table.id === stored)) return stored
          return next[0]?.id || ''
        })
      },
      (err) => {
        console.error(err)
        setTablesError('Konnte Tabellen nicht laden.')
        setLoadingTables(false)
      },
    )
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!selectedTableId) return
    try {
      window?.localStorage?.setItem(TABLE_STORAGE_KEY, selectedTableId)
    } catch (err) {
      console.warn('Konnte Tabellenauswahl nicht speichern.', err)
    }
  }, [selectedTableId])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => setUser(nextUser))
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const next = theme === 'light' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      window?.localStorage?.setItem('gsh-theme', next)
    } catch (err) {
      console.warn('Konnte Theme nicht speichern.', err)
    }
  }, [theme])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'playerprofiles'),
      (snapshot) => {
        const next = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        setPlayerProfiles(next)
      },
      (err) => {
        console.error(err)
      },
    )
    return () => unsubscribe()
  }, [])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!selectedTableId) {
      setError('Bitte zuerst eine Tabelle anlegen oder auswählen.')
      return
    }
    if (form.homeTeam === form.awayTeam) {
      setError('Heim- und Auswärtssteam müssen unterschiedlich sein.')
      return
    }
    const hs = Number(form.homeScore)
    const as = Number(form.awayScore)
    if ([hs, as].some(Number.isNaN) || hs < 0 || as < 0) {
      setError('Bitte gültige Tore eingeben (0 oder höher).')
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, 'matches'), {
        tableId: selectedTableId,
        tableName: activeTable?.name || null,
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

  const handleDeleteTable = async (tableId) => {
    if (!tableId) return
    const matchesQuery = query(collection(db, 'matches'), where('tableId', '==', tableId))
    const snapshot = await getDocs(matchesQuery)
    await Promise.all(snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)))
    await deleteDoc(doc(db, 'tables', tableId))
    if (selectedTableId === tableId) {
      setSelectedTableId('')
      try {
        window?.localStorage?.removeItem(TABLE_STORAGE_KEY)
      } catch (err) {
        console.warn('Konnte Tabellenauswahl nicht entfernen.', err)
      }
    }
  }

  return (
      <div className={`min-h-screen pb-16 ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-950 to-slate-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,118,110,0.25),transparent_25%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(249,115,22,0.2),transparent_25%)]" />
        </div>
        <TopNav user={user} userAvatar={userAvatar} onLogout={handleLogout} navItems={navItems} />
        <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route path="/tabelle-oeffentlich" element={<PublicTablePage matches={matches} activeTable={activeTable} />} />
        <Route path="/galerie" element={<GalleryPage isAdmin={isAdmin} />} />
        <Route
          path="/tabelle"
          element={
            <PrivateRoute user={user}>
              <TablePage
                matches={matches}
                form={form}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                saving={saving}
                error={error}
                isAdmin={isAdmin}
                tables={tables}
                selectedTableId={selectedTableId}
                onSelectTable={setSelectedTableId}
                activeTable={activeTable}
                tablesError={tablesError}
                loadingTables={loadingTables}
                onDeleteTable={handleDeleteTable}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/mannschaft"
          element={
            <PrivateRoute user={user}>
              <TeamPage isAdmin={isAdmin} />
            </PrivateRoute>
          }
        />
        <Route
          path="/spielplan"
          element={
            <PrivateRoute user={user}>
              <SchedulePage user={user} isAdmin={isAdmin} />
            </PrivateRoute>
          }
        />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/anfahrt" element={<AnfahrtPage />} />
        <Route path="/ueber-uns" element={<AboutPage />} />
        <Route
          path="/einstellungen"
          element={
            <PrivateRoute user={user}>
              <SettingsPage
                user={user}
                onProfileSaved={() => setUser(auth.currentUser)}
                theme={theme}
                onThemeChange={setTheme}
              />
            </PrivateRoute>
          }
        />
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
























