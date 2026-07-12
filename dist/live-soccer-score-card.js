/**
 * Live Soccer Score Card
 * ------------------------------------------------------------------------
 * Single-entity Lovelace card for live football/soccer scores. Built for
 * "Multiscrape" sensors.
 *
 * Flags: rendered from the flag-icons project (square 1x1 SVGs), served via
 * jsDelivr's GitHub mirror. flag-icons is MIT licensed, © 2013 Panayiotis
 * Lipiridis: https://github.com/lipis/flag-icons — see LICENSE in that repo.
 * Teams not found in the lookup table (e.g. club names) fall back to a
 * plain text badge — nothing breaks, it just won't show a flag.
 *
 * ------------------------------------------------------------------------
 */

const FLAG_CDN_BASE = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7/flags/1x1/';

// National-team name -> flag-icons code. Keys are matched after lowercasing,
// stripping diacritics/punctuation and collapsing whitespace (see
// _normalizeTeamName). Not exhaustive — anything unmapped (including club
// names, which have no meaningful "flag") falls back to a text badge.
const COUNTRY_FLAG_CODES = {
  // UEFA
  albania: 'al', andorra: 'ad', armenia: 'am', austria: 'at', azerbaijan: 'az',
  belarus: 'by', belgium: 'be', bosnia: 'ba', 'bosnia and herzegovina': 'ba',
  bulgaria: 'bg', croatia: 'hr', cyprus: 'cy', czechia: 'cz', 'czech republic': 'cz',
  denmark: 'dk', england: 'gb-eng', estonia: 'ee', 'faroe islands': 'fo',
  finland: 'fi', france: 'fr', georgia: 'ge', germany: 'de', gibraltar: 'gi',
  greece: 'gr', hungary: 'hu', iceland: 'is', ireland: 'ie',
  'republic of ireland': 'ie', israel: 'il', italy: 'it', kazakhstan: 'kz',
  kosovo: 'xk', latvia: 'lv', liechtenstein: 'li', lithuania: 'lt',
  luxembourg: 'lu', malta: 'mt', moldova: 'md', monaco: 'mc',
  montenegro: 'me', netherlands: 'nl', holland: 'nl', 'north macedonia': 'mk',
  'northern ireland': 'gb-nir', norway: 'no', poland: 'pl', portugal: 'pt',
  romania: 'ro', russia: 'ru', 'san marino': 'sm', scotland: 'gb-sct',
  serbia: 'rs', slovakia: 'sk', slovenia: 'si', spain: 'es', sweden: 'se',
  switzerland: 'ch', turkiye: 'tr', turkey: 'tr', ukraine: 'ua', wales: 'gb-wls',

  // CONMEBOL
  argentina: 'ar', bolivia: 'bo', brazil: 'br', chile: 'cl', colombia: 'co',
  ecuador: 'ec', paraguay: 'py', peru: 'pe', uruguay: 'uy', venezuela: 've',

  // CONCACAF
  canada: 'ca', 'costa rica': 'cr', mexico: 'mx', panama: 'pa',
  'united states': 'us', usa: 'us', jamaica: 'jm', honduras: 'hn',
  'el salvador': 'sv', guatemala: 'gt', 'trinidad and tobago': 'tt',
  haiti: 'ht', curacao: 'cw',

  // AFC
  japan: 'jp', 'south korea': 'kr', 'korea republic': 'kr', australia: 'au',
  iran: 'ir', 'saudi arabia': 'sa', qatar: 'qa', iraq: 'iq',
  'united arab emirates': 'ae', uzbekistan: 'uz', china: 'cn', india: 'in',
  thailand: 'th', vietnam: 'vn', indonesia: 'id', jordan: 'jo',
  bahrain: 'bh', kuwait: 'kw', oman: 'om', 'north korea': 'kp',
  palestine: 'ps', syria: 'sy', lebanon: 'lb',

  // CAF
  morocco: 'ma', senegal: 'sn', tunisia: 'tn', algeria: 'dz', egypt: 'eg',
  nigeria: 'ng', cameroon: 'cm', ghana: 'gh', 'ivory coast': 'ci',
  'cote d ivoire': 'ci', 'south africa': 'za', mali: 'ml',
  'burkina faso': 'bf', 'cape verde': 'cv', 'dr congo': 'cd', congo: 'cg',
  gabon: 'ga', guinea: 'gn', zambia: 'zm', tanzania: 'tz', kenya: 'ke',
  uganda: 'ug', ethiopia: 'et', mozambique: 'mz', angola: 'ao',
  namibia: 'na', botswana: 'bw', zimbabwe: 'zw', benin: 'bj', togo: 'tg',
  niger: 'ne', mauritania: 'mr', gambia: 'gm', 'sierra leone': 'sl',
  liberia: 'lr', 'equatorial guinea': 'gq', comoros: 'km', libya: 'ly',
  sudan: 'sd',

  // OFC
  'new zealand': 'nz', fiji: 'fj', 'papua new guinea': 'pg',
  'solomon islands': 'sb', vanuatu: 'vu', tahiti: 'pf', 'new caledonia': 'nc',
};

const STYLES = `
  :host {
    display: block;
  }
  .card {
    position: relative;
    border-radius: 28px;
    padding: 18px 20px 16px;
    background: linear-gradient(
      100deg,
      var(--lss-edge-color, #6e1522) 0%,
      var(--lss-center-color, #170608) 32%,
      var(--lss-center-color, #170608) 68%,
      var(--lss-edge-color, #6e1522) 100%
    );
    box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.06);
    overflow: hidden;
    box-sizing: border-box;
    font-family: var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  }
  .comp-label {
    text-align: center;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.2px;
    color: var(--lss-label-color, #e19aab);
    margin-bottom: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .match-row {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px;
  }
  .side {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .side-1 { justify-content: flex-start; }
  .side-2 { justify-content: flex-end; }
  .team {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex-shrink: 0;
  }
  .badge {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .badge-flag {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .badge-flag[hidden] { display: none; }
  .badge-text {
    color: #fff;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: 0.5px;
  }
  .team-name {
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.4px;
    white-space: nowrap;
  }
  .score {
    color: #fff;
    font-weight: 800;
    font-size: clamp(26px, 8vw, 38px);
    min-width: 28px;
    text-align: center;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
  }
  .status {
    justify-self: center;
    color: #fff;
    font-weight: 700;
    font-size: clamp(14px, 4vw, 18px);
    text-align: center;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    padding: 0 4px;
  }
  .status.live::before {
    content: '';
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #ff4d4d;
    margin-right: 6px;
    vertical-align: middle;
    animation: lss-pulse 1.4s ease-in-out infinite;
  }
  @keyframes lss-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
  }
  @media (prefers-reduced-motion: reduce) {
    .status.live::before { animation: none; }
  }
  .error-message {
    text-align: center;
    color: rgba(255, 255, 255, 0.75);
    font-size: 14px;
    padding: 10px 4px;
  }
`;

class LiveSoccerScoreCard extends HTMLElement {
  // Native, schema-driven visual editor. Replaces a hand-built editor
  // element — that approach broke in two ways: (1) it could crash if the
  // element connected to the DOM before setConfig() ran, which silently
  // disabled the whole visual editor, and (2) it never re-synced its
  // fields when setConfig() was called again (e.g. after picking a
  // getEntitySuggestion result), so the entity picker looked empty even
  // though the config was correct. ha-form owns its own render/sync
  // lifecycle, so both problems go away by construction.
  static getConfigForm() {
    return {
      schema: [
        {
          name: 'entity',
          required: true,
          selector: { entity: { filter: { integration: 'multiscrape' } } },
        },
        { name: 'title', selector: { text: {} } },
        { name: 'subtitle', selector: { text: {} } },
      ],
      computeLabel: (schema) => {
        switch (schema.name) {
          case 'entity':
            return 'Entity';
          case 'title':
            return 'Title override';
          case 'subtitle':
            return 'Subtitle';
          default:
            return undefined;
        }
      },
      computeHelper: (schema) => {
        switch (schema.name) {
          case 'entity':
            return 'Only entities from the Multiscrape integration are listed.';
          case 'title':
            return "Leave empty to use the entity's friendly_name.";
          case 'subtitle':
            return 'Optional, e.g. "Quarterfinal" — your entity has no round/stage data, so this is set manually.';
          default:
            return undefined;
        }
      },
    };
  }

  static getStubConfig(hass) {
    let entity = '';
    try {
      if (hass && hass.entities) {
        entity =
          Object.keys(hass.entities).find(
            (id) => hass.entities[id].platform === 'multiscrape'
          ) || '';
      }
    } catch (e) {
      entity = '';
    }
    return { entity, subtitle: '', title: '' };
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error('Please select an entity.');
    }
    this._config = { subtitle: '', title: '', ...config };
    this._buildDom();
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    // Sections view. "auto" matches the card's height to its content —
    // confirmed against other cards' real configs. Note: the official dev
    // docs instead say to omit `rows` for auto-sizing; both point at the
    // same "don't force a fixed row count" behavior, so this is kept as
    // requested. Full width (12 of 12 columns) since flags + two scores
    // need more horizontal room than the previous 6-column default.
    return { columns: 12, rows: 'auto', min_rows: 2 };
  }

  connectedCallback() {
    this._connected = true;
    this._startTicker();
  }

  disconnectedCallback() {
    this._connected = false;
    this._stopTicker();
  }

  _buildDom() {
    if (this._root) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>${STYLES}</style>
      <div class="card">
        <div class="content">
          <div class="comp-label"></div>
          <div class="match-row">
            <div class="side side-1">
              <div class="team">
                <div class="badge">
                  <img class="badge-flag" alt="" hidden>
                  <span class="badge-text"></span>
                </div>
                <div class="team-name"></div>
              </div>
              <span class="score score-1"></span>
            </div>
            <div class="status"></div>
            <div class="side side-2">
              <span class="score score-2"></span>
              <div class="team">
                <div class="badge">
                  <img class="badge-flag" alt="" hidden>
                  <span class="badge-text"></span>
                </div>
                <div class="team-name"></div>
              </div>
            </div>
          </div>
        </div>
        <div class="error-message" hidden></div>
      </div>
    `;
    this._root = root;
    this._els = {
      card: root.querySelector('.card'),
      content: root.querySelector('.content'),
      errorMessage: root.querySelector('.error-message'),
      compLabel: root.querySelector('.comp-label'),
      team1Img: root.querySelector('.side-1 .badge-flag'),
      team1Badge: root.querySelector('.side-1 .badge-text'),
      team1Name: root.querySelector('.side-1 .team-name'),
      team2Img: root.querySelector('.side-2 .badge-flag'),
      team2Badge: root.querySelector('.side-2 .badge-text'),
      team2Name: root.querySelector('.side-2 .team-name'),
      score1: root.querySelector('.score-1'),
      score2: root.querySelector('.score-2'),
      status: root.querySelector('.status'),
    };
  }

  _showError(message) {
    this._els.content.hidden = true;
    this._els.errorMessage.hidden = false;
    this._els.errorMessage.textContent = message;
  }

  _render() {
    if (!this._config) return;
    if (!this._root) this._buildDom();
    if (!this._hass) return;

    const entityId = this._config.entity;
    if (!entityId) {
      this._showError('No entity selected — choose a Multiscrape entity in the card editor.');
      return;
    }
    const stateObj = this._hass.states[entityId];
    if (!stateObj) {
      this._showError(`Entity not found: ${entityId}`);
      return;
    }

    this._els.content.hidden = false;
    this._els.errorMessage.hidden = true;

    const attrs = stateObj.attributes || {};
    const team1 = attrs.team_1 || this._teamFromState(stateObj, 0) || 'Team 1';
    const team2 = attrs.team_2 || this._teamFromState(stateObj, 1) || 'Team 2';

    const label = this._config.title || attrs.friendly_name || '';
    this._els.compLabel.textContent = this._config.subtitle
      ? `${label} · ${this._config.subtitle}`
      : label;

    this._setBadge(this._els.team1Img, this._els.team1Badge, team1);
    this._setBadge(this._els.team2Img, this._els.team2Badge, team2);
    this._els.team1Name.textContent = this._abbreviate(team1);
    this._els.team2Name.textContent = this._abbreviate(team2);

    const [g1, g2] = this._getScores(attrs);
    this._els.score1.textContent = g1 === null ? '-' : g1;
    this._els.score2.textContent = g2 === null ? '-' : g2;

    this._lastStateObj = stateObj;
    this._updateStatus();

    this._els.card.setAttribute(
      'aria-label',
      `${team1} ${g1 ?? ''} - ${g2 ?? ''} ${team2}, ${this._els.status.textContent}`
    );
  }

  _updateStatus() {
    if (!this._lastStateObj || !this._els) return;
    const attrs = this._lastStateObj.attributes || {};
    const status = this._computeStatus(this._lastStateObj, attrs);
    this._els.status.textContent = status.label;
    this._els.status.classList.toggle('live', status.isLive);
  }

  _startTicker() {
    if (this._tickerId) return;
    this._tickerId = setInterval(() => this._updateStatus(), 1000);
  }

  _stopTicker() {
    if (this._tickerId) {
      clearInterval(this._tickerId);
      this._tickerId = null;
    }
  }

  _teamFromState(stateObj, index) {
    const raw = (stateObj.state || '').replace(/\s*\([^)]*\)\s*$/, '');
    const parts = raw.split(/\s+vs\.?\s+/i);
    return parts.length === 2 ? parts[index].trim() : null;
  }

  _normalizeTeamName(name) {
    return String(name)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['\u2019]/g, ' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _flagCode(name) {
    return COUNTRY_FLAG_CODES[this._normalizeTeamName(name)] || null;
  }

  _setBadge(imgEl, textEl, teamName) {
    textEl.textContent = this._abbreviate(teamName);
    const code = this._flagCode(teamName);
    if (code) {
      imgEl.hidden = false;
      textEl.hidden = true;
      imgEl.onerror = () => {
        // Offline HA instance, wrong code, or jsDelivr unreachable — fall
        // back to the text badge instead of showing a broken image.
        imgEl.hidden = true;
        textEl.hidden = false;
      };
      imgEl.src = `${FLAG_CDN_BASE}${code}.svg`;
    } else {
      imgEl.hidden = true;
      imgEl.removeAttribute('src');
      textEl.hidden = false;
    }
  }

  _abbreviate(name) {
    const letters = String(name).replace(/[^a-zA-Z]/g, '');
    return (letters.slice(0, 3) || String(name).slice(0, 3) || '???').toUpperCase();
  }

  _toBool(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.trim().toLowerCase() === 'true';
    return !!val;
  }

  _toNumber(val) {
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
    if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) {
      return Number(val);
    }
    return null;
  }

  _getScores(attrs) {
    const g1 = this._toNumber(attrs.goals_team_1);
    const g2 = this._toNumber(attrs.goals_team_2);
    if (g1 !== null && g2 !== null) return [g1, g2];
    if (typeof attrs.score === 'string' && attrs.score.includes(':')) {
      const [a, b] = attrs.score.split(':');
      const na = this._toNumber(a);
      const nb = this._toNumber(b);
      if (na !== null && nb !== null) return [na, nb];
    }
    return [null, null];
  }

  _extractKickoff(stateObj) {
    const match = (stateObj.state || '').match(/\(([^)]+)\)/);
    if (!match) return null;
    const date = new Date(match[1]);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  _computeStatus(stateObj, attrs) {
    const ongoing = this._toBool(attrs.ongoing);
    const kickoff = this._extractKickoff(stateObj);
    const now = new Date();

    if (ongoing) {
      if (kickoff) {
        const elapsed = Math.max(0, Math.floor((now - kickoff) / 1000));
        const mm = Math.floor(elapsed / 60);
        const ss = elapsed % 60;
        return { label: `${mm}:${String(ss).padStart(2, '0')}`, isLive: true };
      }
      return { label: 'LIVE', isLive: true };
    }

    if (kickoff) {
      if (now < kickoff) {
        const sameDay = now.getFullYear() === kickoff.getFullYear()
          && now.getMonth() === kickoff.getMonth()
          && now.getDate() === kickoff.getDate();

        if (sameDay) {
          const time = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return { label: `Kickoff ${time}`, isLive: false };
        }

        const day = kickoff.toLocaleDateString('en-US', { weekday: 'long' });
        return { label: `Kickoff ${day}`, isLive: false };
      }
      return { label: 'Full Time', isLive: false };
    }

    return { label: 'Not Live', isLive: false };
  }
}

customElements.define('live-soccer-score-card', LiveSoccerScoreCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'live-soccer-score-card',
  name: 'Live Soccer Score',
  description: 'A single-entity live soccer score card (built for Multiscrape sensors).',
  preview: false,
  // Requires HA 2026.6+. On older versions this is simply ignored — no
  // suggestion shows up, but nothing breaks either.
  getEntitySuggestion: (hass, entityId) => {
    const entry = hass.entities && hass.entities[entityId];
    if (!entry || entry.platform !== 'multiscrape') return null;
    const id = entityId.toLowerCase();
    if (!id.includes('fifa') && !id.includes('world_cup')) return null;
    return {
      config: { type: 'custom:live-soccer-score-card', entity: entityId },
    };
  },
});
