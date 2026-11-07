export const brand = { name: 'Global Market Observatory', tagline: 'Markets are moving. Understand what is behind them.' }
export const REVIEWED = '2026-11-07'
export const MIN_COVERAGE = 0.8

export type Status = 'REAL-TIME' | 'DELAYED' | 'END-OF-DAY' | 'HISTORICAL' | 'UNAVAILABLE' | 'DEMO'
export const STATUS_RULES: Record<Status, string> = {
  'REAL-TIME': 'The provider explicitly supplies real-time data to credential-free browser clients and the observation is within its documented latency.',
  DELAYED: 'The provider documents or reports a delay. The delay is shown whenever it is known.',
  'END-OF-DAY': 'The official close of the most recently completed session.',
  HISTORICAL: 'Series data covering completed sessions.',
  UNAVAILABLE: 'No valid observation exists. A failed refresh keeps the last valid observation with its original timestamp and a downgraded label.',
  DEMO: 'A synthetic development fixture. It is not market data.',
}

export type Market = { name: string; tz: string; open: [number, number]; pre?: number; after?: number; indices: string[] }
// Session hours are minutes after local midnight.
export const MARKETS: Record<'india' | 'us', Market> = {
  india: { name: 'India', tz: 'Asia/Kolkata', open: [555, 930], indices: ['NIFTY 50', 'SENSEX', 'NIFTY NEXT 50', 'NIFTY 500', 'NIFTY IT', 'NIFTY BANK', 'NIFTY MIDCAP 100'] },
  us: { name: 'United States', tz: 'America/New_York', open: [570, 960], pre: 240, after: 1200, indices: ['S&P 500', 'NASDAQ Composite', 'NASDAQ 100', 'Dow Jones Industrial Average', 'Russell 2000', 'Philadelphia Semiconductor (SOX)'] },
}
export const SECTORS = ['Technology', 'Banking', 'Financial services', 'Healthcare', 'Pharmaceuticals', 'Energy', 'Consumer goods', 'Industrial manufacturing', 'Automotive', 'Telecommunications', 'Real estate', 'Utilities']
export const PERIODS = ['Today', '1 Week', '1 Month', '3 Months', '6 Months', 'YTD', '1 Year']
export const WINDOWS: Record<string, number> = { Today: 1, '1 Week': 5, '1 Month': 21, '3 Months': 63, '6 Months': 126, '1 Year': 252 }

export const SOURCES = [
  { id: 'demo-fixtures', name: 'DEMO fixture generator', supplies: 'Synthetic series behind every figure in this build', access: 'Bundled with the app (seeded random walk)', delay: 'Not market data', creds: 'None', terms: 'Not applicable (synthetic)', redistribution: 'Not applicable', reviewed: 'Not applicable', issues: 'Must never be presented as market data. Removed from production once live providers exist.', features: 'Nothing on the live site, development builds only (VITE_DEMO=1)' },
  { id: 'market-data', name: 'Public market-data provider (NSE, BSE, NYSE, NASDAQ)', supplies: 'Quotes, history, fundamentals', access: 'Not connected', delay: 'Unknown', creds: 'None required by design', terms: 'Not yet reviewed', redistribution: 'Not yet reviewed', reviewed: 'Not yet reviewed', issues: 'Provider research is still pending', features: 'None yet' },
  { id: 'sec-edgar', name: 'SEC EDGAR (US filings)', supplies: 'Filing index for US-listed companies: 8-K, 10-Q and 10-K, with links to the original documents', access: 'GitHub Actions snapshot twice a day, data.sec.gov JSON', delay: 'Filings appear as published, then up to one refresh cycle later', creds: 'None. A descriptive User-Agent with a contact email is required', terms: 'SEC fair-access policy, at most 10 requests per second', redistribution: 'Public filings, links to originals kept', reviewed: '2026-11-07', issues: 'US companies only', features: 'The Narrative, What Changed' },
  { id: 'frankfurter', name: 'Frankfurter (blended central-bank reference rates)', supplies: 'USD/INR daily rate and five-year history', access: 'GitHub Actions snapshot twice a day, api.frankfurter.dev v2', delay: 'Daily rates, not intraday', creds: 'None', terms: 'Free to use. Blended rates are the provider’s own calculation', redistribution: 'Permitted for blended rates', reviewed: '2026-11-07', issues: 'Daily rates only, and recent decimals can shift as data is revised', features: 'USD/INR panel' },
]
export const LEDGER: { ds: string; src: string; st: Status }[] = [
  { ds: 'India indices', src: 'demo-fixtures', st: 'DEMO' },
  { ds: 'US indices', src: 'demo-fixtures', st: 'DEMO' },
  { ds: 'Sector series', src: 'demo-fixtures', st: 'DEMO' },
  { ds: 'Basket constituents', src: 'demo-fixtures', st: 'DEMO' },
  { ds: 'Events and news', src: 'events', st: 'UNAVAILABLE' },
  { ds: 'Foreign exchange', src: 'fx', st: 'UNAVAILABLE' },
  { ds: 'Holiday calendars', src: 'none', st: 'UNAVAILABLE' },
]

export type Role = 'core' | 'enabling' | 'adjacent'
type Co = { n: string; m: 'IN' | 'US'; role: Role }
const co = (m: 'IN' | 'US', role: Role, ...ns: string[]): Co[] => ns.map(n => ({ n, m, role }))
export const LAYERS: { name: string; cats: string[]; roster: Co[]; contextual?: string[] }[] = [
  { name: 'Semiconductors and Hardware', cats: ['GPU manufacturers', 'CPU manufacturers', 'Semiconductor designers', 'Chip foundries', 'Semiconductor equipment businesses', 'Memory and storage companies'], roster: co('US', 'core', 'NVIDIA', 'AMD', 'Intel', 'Broadcom') },
  { name: 'Computing Infrastructure', cats: ['Data centre operators', 'AI infrastructure providers', 'High-performance computing', 'Networking infrastructure', 'Enterprise hardware'], roster: [...co('US', 'core', 'Cisco'), ...co('US', 'enabling', 'Broadcom'), ...co('US', 'adjacent', 'IBM')] },
  { name: 'Cloud Infrastructure', cats: ['Cloud computing', 'Infrastructure as a Service', 'Platform as a Service', 'Data infrastructure', 'Enterprise computing'], roster: [...co('US', 'core', 'Amazon', 'Microsoft', 'Alphabet', 'Oracle'), ...co('US', 'enabling', 'Snowflake', 'MongoDB', 'Cloudflare'), ...co('US', 'adjacent', 'Datadog')] },
  { name: 'AI Models and Research', cats: ['Foundation model businesses', 'AI research organizations', 'AI model providers', 'Publicly listed AI development businesses'], roster: [...co('US', 'core', 'Alphabet', 'Meta'), ...co('US', 'enabling', 'Microsoft')], contextual: ['OpenAI', 'Anthropic'] },
  { name: 'AI Applications and Software', cats: ['Enterprise AI', 'AI-powered business software', 'Developer tools', 'AI security', 'Automation', 'Data analytics', 'Productivity software'], roster: [...co('US', 'core', 'Microsoft', 'Adobe', 'Salesforce', 'ServiceNow', 'Palantir'), ...co('US', 'adjacent', 'CrowdStrike', 'Datadog'), ...co('IN', 'adjacent', 'Oracle Financial Services Software')] },
  { name: 'Technology Services', cats: ['IT consulting', 'Software development', 'IT outsourcing', 'Digital transformation', 'Engineering services', 'Technology integration'], roster: [...co('IN', 'core', 'TCS', 'Infosys', 'HCL Technologies', 'Wipro', 'Tech Mahindra', 'LTIMindtree', 'Persistent Systems', 'Coforge', 'Mphasis', 'Zensar Technologies', 'KPIT Technologies', 'Tata Elxsi', 'L&T Technology Services', 'Cyient'), ...co('US', 'adjacent', 'IBM')] },
  { name: 'Robotics and Automation', cats: ['Industrial robotics', 'Autonomous systems', 'Automation software', 'Robotics hardware'], roster: [] },
]

export const BASKETS = [
  { id: 'india-it', name: 'India IT Basket', ccy: 'INR', market: 'NSE listings (draft assumption)', version: '0.1', criteria: 'Draft. Listed Indian IT services, engineering-services and IT-software companies named in the product brief.', members: ['TCS', 'Infosys', 'HCL Technologies', 'Wipro', 'Tech Mahindra', 'LTIMindtree', 'Persistent Systems', 'Coforge', 'Mphasis', 'KPIT Technologies', 'Tata Elxsi', 'L&T Technology Services', 'Cyient', 'Zensar Technologies', 'Oracle Financial Services Software'] },
  { id: 'us-software', name: 'US Software Basket', ccy: 'USD', market: 'NYSE and NASDAQ listings', version: '0.1', criteria: 'Draft. US-listed software and cloud-software companies named in the product brief.', members: ['Microsoft', 'Oracle', 'Adobe', 'Salesforce', 'ServiceNow', 'Palantir', 'Snowflake', 'Datadog', 'Cloudflare', 'CrowdStrike', 'MongoDB'] },
  { id: 'semiconductor', name: 'Semiconductor Basket', ccy: 'USD', market: 'NASDAQ listings', version: '0.1', criteria: 'Draft. US-listed semiconductor companies named in the product brief.', members: ['NVIDIA', 'AMD', 'Intel', 'Broadcom'] },
]

export const METRICS = [
  { id: 'period-returns', name: 'Period returns', formula: 'R = P_end / P_start − 1', note: `Windows in trading sessions: ${Object.entries(WINDOWS).map(([k, v]) => `${k} = ${v}`).join(', ')}. YTD anchors to the last session of the previous calendar year. Not computed when the series is shorter than the window. Every period label in the product uses this one definition.` },
  { id: 'basket-level', name: 'Equal-weighted basket level', formula: 'L_t = L_(t−1) × (1 + mean of constituent returns at t), with L_0 = 100', note: `Rebalanced daily to equal weight. A value is published only when at least ${MIN_COVERAGE * 100}% of constituents have data.` },
  { id: 'contribution', name: 'Constituent contribution', formula: 'c_i = r_i / n', note: 'Shown in each basket’s latest calculation. Contributions sum to the basket return for the day.' },
  { id: 'session-status', name: 'Session status', formula: 'Local weekday and time in the exchange timezone, compared with the configured session hours', note: 'Holiday calendars are not loaded, so every open state says that holidays are not verified.' },
  { id: 'data-age', name: 'Data age', formula: 'age = now − exchange as-of time', note: 'Never measured from retrieval time. Date-only observations count from the start of that day (UTC), so age is never understated. Computed in your browser.' },
]

export const LIMITATIONS = [
  { id: 'no-live-data', text: 'No licensed price source is connected, so index, sector, basket and company price panels are hidden on the live site. Builds made with VITE_DEMO=1 show synthetic figures for development only.', affects: 'Price panels', status: 'Temporary' },
  { id: 'static-realtime', text: 'A no-credential static site cannot guarantee real-time data. Labels reflect what each provider actually delivers.', affects: 'All market data', status: 'Permanent' },
  { id: 'holidays', text: 'Exchange holiday calendars are not loaded, so session status cannot detect holidays.', affects: 'Session status', status: 'Temporary' },
  { id: 'classification', text: 'Value-chain layers, roles and basket membership are draft judgments from the product brief. No classification dataset is connected.', affects: 'Technology and AI, baskets', status: 'Temporary' },
  { id: 'baskets', text: 'Baskets with membership chosen today carry survivorship and hindsight bias when back-tested. They are not official indices.', affects: 'Baskets', status: 'Permanent' },
  { id: 'fx', text: 'FX comes from daily reference rates, so there is no intraday or live FX. Cross-currency comparison is not built yet.', affects: 'Comparisons', status: 'Temporary' },
  { id: 'events', text: 'Events are US SEC filings only. Indian filings, news and economic events are not covered, and a filing’s timing is never presented as causation.', affects: 'The Narrative', status: 'Temporary' },
  { id: 'advice', text: 'This platform provides financial information and research, not individualized investment advice.', affects: 'Everything', status: 'Permanent' },
]
