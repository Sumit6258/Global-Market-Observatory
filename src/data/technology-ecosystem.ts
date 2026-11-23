import { K } from './sec-sources'

// The single source of truth for the technology ecosystem. Nothing here is market data.
// Every entity and relationship names a source, but no statement has yet been checked against its source.
export const REVIEWED_ON = '2026-11-13'
export const CHECKED_ON = '2026-11-22'

export type Part = 'core' | 'enabling' | 'adjacent'
export interface Check { url: string; note: string; date: string }
export interface Layer { n: number; name: string; summary: string }
export interface Category { id: string; layer: number; name: string; def: string }
export interface Membership { layer: number; cat: string; part: Part; uncertain?: boolean; check?: Check }
export interface Entity { id: string; name: string; country: string; status: 'public' | 'private'; ticker?: string; research?: string; desc: string; memberships: Membership[]; sources: string[]; lastReviewed: string }
export type RelKind = 'commercial' | 'integration' | 'competitive'
export interface Relation { from: string; to: string; kind: RelKind; type: string; text: string; sources: string[]; check?: Check }
export interface LayerLink { from: number; to: number; text: string }

export const PART_TEXT: Record<Part, string> = {
  core: 'Core participant: operates directly in this category.',
  enabling: 'Enabling participant: supplies products or infrastructure this category depends on.',
  adjacent: 'Adjacent participant: takes part in or benefits from this category without being a central provider.',
}
export const KIND_LABEL: Record<RelKind, string> = { commercial: 'Commercial relationship', integration: 'Product or platform integration', competitive: 'Competitor' }

export const LAYERS: Layer[] = [
  { n: 1, name: 'Semiconductors and hardware', summary: 'Companies that design, manufacture and equip the production of chips and memory. Every other layer depends on this one.' },
  { n: 2, name: 'Computing and AI infrastructure', summary: 'Accelerators, servers, networking, and the data centres, power and cooling that house them. This layer turns chips into usable capacity.' },
  { n: 3, name: 'Cloud computing and platforms', summary: 'Providers that rent computing, storage and data platforms over the internet, and the platforms built on top of them.' },
  { n: 4, name: 'AI models and research', summary: 'Organisations that research, train and operate foundation models. Private organisations appear for context only.' },
  { n: 5, name: 'AI applications and enterprise software', summary: 'Software that applies AI to work: productivity, security, analytics, automation and enterprise applications.' },
  { n: 6, name: 'Technology services and IT consulting', summary: 'Firms that implement, integrate and run technology for enterprises. Several Indian companies in this registry sit here.' },
  { n: 7, name: 'Robotics, automation and autonomous systems', summary: 'Machines and software that sense and act in the physical world, from factory robots to vehicles.' },
]

// General dependencies between layers. These are industry structure, not claims about any company pair.
export const LAYER_LINKS: LayerLink[] = [
  { from: 1, to: 2, text: 'Processors, memory and networking chips become the accelerators, servers and switches inside data centres.' },
  { from: 2, to: 3, text: 'Cloud providers rent out computing built from servers, networking and data-centre capacity.' },
  { from: 3, to: 4, text: 'Large models are trained and served on accelerator and cloud capacity.' },
  { from: 4, to: 5, text: 'Applications and enterprise software are built on, or integrate, models.' },
  { from: 5, to: 6, text: 'Services firms implement and customise platforms and AI tools for enterprises.' },
  { from: 1, to: 7, text: 'Robotics and automation rely on processors, sensors and software, and increasingly on AI models.' },
]

const c = (layer: number, id: string, name: string, def: string): Category => ({ id, layer, name, def })
export const CATEGORIES: Category[] = [
  c(1, 'gpu', 'GPU manufacturers', 'Design graphics processors, the main chips for training and running AI models.'),
  c(1, 'cpu', 'CPU manufacturers', 'Design the general-purpose processors that run operating systems and software.'),
  c(1, 'design', 'Semiconductor designers', 'Design chips, often without owning factories.'),
  c(1, 'foundry', 'Chip foundries', 'Manufacture chips designed by other companies.'),
  c(1, 'equip', 'Semiconductor equipment', 'Make the machines used to fabricate, inspect and test chips.'),
  c(1, 'memory', 'Memory manufacturers', 'Make DRAM, NAND and high-bandwidth memory that sit beside processors.'),
  c(1, 'storage', 'Storage technology', 'Make drives and media that keep data when power is off.'),
  c(1, 'pack', 'Chip packaging and testing', 'Assemble, package and test finished chips.'),
  c(1, 'parts', 'Electronic components', 'Make the passive and discrete parts and boards that chips are mounted on.'),
  c(2, 'accel', 'AI accelerators', 'Chips and systems built to speed up AI training and inference.'),
  c(2, 'hpc', 'High-performance computing', 'Systems for large scientific and engineering workloads.'),
  c(2, 'dc', 'Data centres', 'Facilities that house, power and connect computing equipment.'),
  c(2, 'server', 'Server infrastructure', 'Build the servers and racks that run workloads.'),
  c(2, 'net', 'Networking', 'Switches, routers and links that connect machines inside and between data centres.'),
  c(2, 'ent', 'Enterprise hardware', 'Computing and networking equipment sold to businesses.'),
  c(2, 'stor', 'Storage systems', 'Arrays and appliances that store enterprise data.'),
  c(2, 'power', 'Cooling and power infrastructure', 'Power distribution and cooling that keep data centres running.'),
  c(3, 'iaas', 'Infrastructure as a Service', 'Rent virtual machines, storage and networking on demand.'),
  c(3, 'paas', 'Platform as a Service', 'Rent managed platforms for building and running applications.'),
  c(3, 'ecloud', 'Enterprise cloud', 'Cloud and hybrid platforms aimed at large organisations.'),
  c(3, 'cdb', 'Cloud databases', 'Managed database services delivered over the cloud.'),
  c(3, 'cstor', 'Cloud storage', 'Object, file and block storage delivered over the cloud.'),
  c(3, 'dplat', 'Data platforms', 'Platforms that store, process and share analytical data.'),
  c(3, 'cnet', 'Cloud networking', 'Network, edge and content-delivery services delivered over the cloud.'),
  c(4, 'fm', 'Foundation models', 'Large general-purpose models that are adapted to many tasks.'),
  c(4, 'llm', 'Large language models', 'Models trained on text to understand and generate language.'),
  c(4, 'mm', 'Multimodal AI', 'Models that handle text, images, audio or video together.'),
  c(4, 'research', 'AI research', 'Fundamental and applied research that advances AI methods.'),
  c(4, 'train', 'Model training', 'Building models by training them on large datasets.'),
  c(4, 'infer', 'Model inference', 'Running trained models to answer requests.'),
  c(4, 'oss', 'Open-source AI ecosystems', 'Models and tools released with open weights or open code.'),
  c(5, 'eai', 'Enterprise AI', 'AI platforms and agents built for business use.'),
  c(5, 'prod', 'AI productivity tools', 'AI assistants inside everyday work software.'),
  c(5, 'dev', 'Developer tools', 'Tools for writing, testing and running software.'),
  c(5, 'sec', 'AI security', 'Security software that uses AI or protects AI systems.'),
  c(5, 'anal', 'AI analytics', 'Analytics and monitoring software that uses AI.'),
  c(5, 'bauto', 'Business automation', 'Software that automates business workflows.'),
  c(5, 'cs', 'Customer-service AI', 'AI for customer support and engagement.'),
  c(5, 'apps', 'AI-powered applications', 'Consumer and professional applications built around AI.'),
  c(5, 'esw', 'Enterprise software', 'Business applications and platforms sold to organisations.'),
  c(6, 'consult', 'IT consulting', 'Advise organisations on technology strategy and change.'),
  c(6, 'swdev', 'Software development', 'Build custom software for clients.'),
  c(6, 'outsrc', 'IT outsourcing', 'Run client technology operations under long-term contracts.'),
  c(6, 'dx', 'Digital transformation', 'Modernise client processes and systems with digital technology.'),
  c(6, 'integ', 'Technology integration', 'Connect separate systems and vendors into working solutions.'),
  c(6, 'eng', 'Engineering services', 'Engineering and R&D services for product makers.'),
  c(6, 'eimpl', 'Enterprise implementation', 'Install and customise enterprise software platforms.'),
  c(6, 'cloudc', 'Cloud consulting', 'Plan and carry out moves to cloud platforms.'),
  c(6, 'aiimpl', 'AI implementation services', 'Put AI tools and models into client operations.'),
  c(7, 'irobot', 'Industrial robotics', 'Robots that perform manufacturing tasks.'),
  c(7, 'wauto', 'Warehouse automation', 'Systems that move and store goods automatically.'),
  c(7, 'auton', 'Autonomous systems', 'Machines that operate with limited human control.'),
  c(7, 'rsw', 'Robotics software', 'Software that controls, simulates or coordinates robots.'),
  c(7, 'mvis', 'Machine vision', 'Cameras and software that let machines inspect and guide work.'),
  c(7, 'iai', 'Industrial AI', 'AI applied to industrial operations and equipment.'),
  c(7, 'av', 'Autonomous vehicles', 'Vehicles and software that drive with little or no human input.'),
  c(7, 'pauto', 'Process automation', 'Control and software systems that automate industrial and business processes.'),
]

type M = [layer: number, cat: string, part: Part, uncertain?: true, check?: Check]
const ck = (url: string, note: string): Check => ({ url, note, date: CHECKED_ON })
// Pages read during the 2026-11-22 source check. Each claim was confirmed on the company's own page.
const GAUDI = 'https://intel.com/content/www/us/en/products/details/processors/ai-accelerators/gaudi3.html'
const PHI = 'https://azure.microsoft.com/en-us/blog/introducing-phi-3-redefining-whats-possible-with-slms/'
const NOVA = 'https://aws.amazon.com/about-aws/whats-new/2024/12/amazon-nova-foundation-models-bedrock'
const GRANITE = 'https://ibm.com/think/news/granite-foundation-models'
const MICRON_H200 = 'https://investors.micron.com/node/46656'
const MICRON_AMD = 'https://micron.gcs-web.com/node/48946'
const US = 'United States'
const E = (id: string, name: string, country: string, status: 'public' | 'private', desc: string, m: M[], sources: string[], ticker?: string): Entity => ({
  id, name, country, status, desc, sources, ticker, research: ticker, lastReviewed: m.some(x => x[4]) ? CHECKED_ON : REVIEWED_ON,
  memberships: m.map(([layer, cat, part, uncertain, check]) => ({ layer, cat, part, ...(uncertain ? { uncertain } : {}), ...(check ? { check } : {}) })),
})
const pub = (id: string, name: string, country: string, desc: string, m: M[], url: string | string[], ticker?: string) => E(id, name, country, 'public', desc, m, Array.isArray(url) ? url : [url], ticker)

export const ENTITIES: Entity[] = [
  // Layer 1 and 2: hardware and infrastructure
  pub('nvidia', 'NVIDIA', US, 'Designs GPUs, AI accelerators, networking and the CUDA software platform; its chips are made by contract foundries.', [[1, 'gpu', 'core'], [1, 'design', 'core'], [2, 'accel', 'core'], [2, 'net', 'core']], K.NVDA, 'NVDA'),
  pub('amd', 'AMD', US, 'Designs x86 CPUs, GPUs and AI accelerators; its chips are made by contract foundries.', [[1, 'cpu', 'core'], [1, 'gpu', 'core'], [2, 'accel', 'core']], K.AMD, 'AMD'),
  pub('intel', 'Intel', US, 'Designs and manufactures x86 CPUs, sells Gaudi AI accelerators and runs a contract foundry business.', [[1, 'cpu', 'core'], [1, 'foundry', 'core'], [2, 'accel', 'core', undefined, ck(GAUDI, 'Intel’s own product page presents the Gaudi 3 AI accelerator.')]], [K.INTC, GAUDI], 'INTC'),
  pub('broadcom', 'Broadcom', US, 'Designs semiconductors for networking and custom AI accelerators, and sells infrastructure software.', [[1, 'design', 'core'], [2, 'net', 'core'], [5, 'esw', 'core']], K.AVGO, 'AVGO'),
  pub('qualcomm', 'Qualcomm', US, 'Designs processors and wireless chips without owning factories, and licenses its patents.', [[1, 'design', 'core']], 'https://www.qualcomm.com/'),
  pub('micron', 'Micron', US, 'Makes DRAM, NAND and high-bandwidth memory.', [[1, 'memory', 'core'], [1, 'storage', 'core'], [2, 'accel', 'enabling']], 'https://www.micron.com/'),
  pub('amat', 'Applied Materials', US, 'Makes equipment used to fabricate semiconductors.', [[1, 'equip', 'core']], 'https://www.appliedmaterials.com/'),
  pub('asml', 'ASML', 'Netherlands', 'Makes the lithography systems chipmakers use to print circuits.', [[1, 'equip', 'core']], 'https://www.asml.com/'),
  pub('tsmc', 'TSMC', 'Taiwan', 'Manufactures chips designed by other companies and provides advanced packaging.', [[1, 'foundry', 'core'], [1, 'pack', 'core']], 'https://www.tsmc.com/'),
  pub('samsung', 'Samsung Electronics', 'South Korea', 'Makes memory chips, runs a foundry and sells consumer electronics.', [[1, 'memory', 'core'], [1, 'foundry', 'core']], 'https://www.samsung.com/'),
  pub('dell', 'Dell Technologies', US, 'Sells servers, storage and PCs, including servers built for AI workloads.', [[2, 'server', 'core'], [2, 'ent', 'core'], [2, 'stor', 'core']], 'https://www.dell.com/'),
  pub('smci', 'Super Micro Computer', US, 'Builds server and rack systems, including for AI workloads.', [[2, 'server', 'core'], [2, 'dc', 'enabling']], 'https://www.supermicro.com/'),
  pub('arista', 'Arista Networks', US, 'Sells high-speed Ethernet switches for data centres and cloud networks.', [[2, 'net', 'core']], 'https://www.arista.com/'),
  pub('cisco', 'Cisco', US, 'Sells networking, security and collaboration products.', [[2, 'net', 'core'], [2, 'ent', 'core'], [5, 'sec', 'adjacent']], K.CSCO, 'CSCO'),
  pub('vertiv', 'Vertiv', US, 'Makes power and cooling equipment for data centres.', [[2, 'power', 'core'], [2, 'dc', 'enabling']], 'https://www.vertiv.com/'),
  pub('equinix', 'Equinix', US, 'Operates colocation data centres and interconnection services.', [[2, 'dc', 'core']], 'https://www.equinix.com/'),
  pub('dlr', 'Digital Realty', US, 'Owns and operates data centres leased to enterprises and cloud providers.', [[2, 'dc', 'core']], 'https://www.digitalrealty.com/'),
  // Layer 3 and 4: cloud and models
  pub('microsoft', 'Microsoft', US, 'Sells cloud infrastructure and platforms (Azure), productivity and developer software, develops the Phi language models, and partners with OpenAI.', [[3, 'iaas', 'core'], [3, 'paas', 'core'], [5, 'prod', 'core'], [5, 'dev', 'core'], [4, 'llm', 'core', undefined, ck(PHI, 'Microsoft’s Azure blog describes Phi-3 as a family of open AI models developed by Microsoft.')]], [K.MSFT, PHI], 'MSFT'),
  pub('amazon', 'Amazon', US, 'Operates Amazon Web Services, a cloud infrastructure and platform provider, develops the Nova foundation models, and runs retail.', [[3, 'iaas', 'core'], [3, 'paas', 'core'], [3, 'cstor', 'core'], [4, 'fm', 'core', undefined, ck(NOVA, 'Amazon announced its own Amazon Nova foundation models, available in Amazon Bedrock.')]], [K.AMZN, NOVA], 'AMZN'),
  pub('alphabet', 'Alphabet', US, 'Operates Google Cloud and develops Gemini models, TPU accelerators and Google Workspace.', [[3, 'iaas', 'core'], [4, 'fm', 'core'], [4, 'mm', 'core'], [4, 'research', 'core'], [2, 'accel', 'core'], [5, 'prod', 'core']], K.GOOGL, 'GOOGL'),
  pub('oracle', 'Oracle', US, 'Sells cloud infrastructure, databases and enterprise applications.', [[3, 'iaas', 'core'], [3, 'cdb', 'core'], [5, 'esw', 'core']], K.ORCL, 'ORCL'),
  pub('ibm', 'IBM', US, 'Sells hybrid cloud and AI software, develops the Granite foundation models, and provides consulting services.', [[3, 'ecloud', 'core'], [6, 'consult', 'core'], [4, 'fm', 'core', undefined, ck(GRANITE, 'IBM describes Granite as its own family of foundation models, offered in watsonx.')]], [K.IBM, GRANITE], 'IBM'),
  pub('salesforce', 'Salesforce', US, 'Sells cloud-based customer-relationship and enterprise software with AI agents.', [[5, 'esw', 'core'], [5, 'cs', 'core'], [5, 'eai', 'core'], [3, 'dplat', 'adjacent']], K.CRM, 'CRM'),
  pub('snowflake', 'Snowflake', US, 'Sells a cloud data platform that runs on the major cloud providers.', [[3, 'dplat', 'core'], [3, 'cstor', 'adjacent']], K.SNOW, 'SNOW'),
  pub('cloudflare', 'Cloudflare', US, 'Provides a global network offering security, performance and edge computing services.', [[3, 'cnet', 'core'], [5, 'sec', 'core'], [3, 'paas', 'adjacent']], K.NET, 'NET'),
  pub('meta', 'Meta Platforms', US, 'Develops the Llama open-weight models and runs social platforms.', [[4, 'fm', 'core'], [4, 'llm', 'core'], [4, 'oss', 'core'], [4, 'research', 'core']], K.META, 'META'),
  E('openai', 'OpenAI', US, 'private', 'AI research company that develops the GPT models and ChatGPT. Private: no ticker, price or valuation is shown.', [[4, 'fm', 'core'], [4, 'llm', 'core'], [4, 'mm', 'core'], [5, 'apps', 'core']], ['https://openai.com/']),
  E('anthropic', 'Anthropic', US, 'private', 'AI safety and research company that develops the Claude models. Private: no ticker, price or valuation is shown.', [[4, 'fm', 'core'], [4, 'llm', 'core'], [4, 'research', 'core'], [5, 'apps', 'core']], ['https://www.anthropic.com/']),
  // Layer 5: applications and enterprise software
  pub('adobe', 'Adobe', US, 'Sells creative, document and marketing software with generative AI features.', [[5, 'apps', 'core'], [5, 'prod', 'core']], K.ADBE, 'ADBE'),
  pub('servicenow', 'ServiceNow', US, 'Sells workflow-automation software with AI agents for enterprises.', [[5, 'bauto', 'core'], [5, 'eai', 'core'], [5, 'esw', 'core']], K.NOW, 'NOW'),
  pub('palantir', 'Palantir', US, 'Sells data-analytics and AI platforms to governments and enterprises.', [[5, 'anal', 'core'], [5, 'eai', 'core']], K.PLTR, 'PLTR'),
  pub('datadog', 'Datadog', US, 'Sells cloud monitoring, security and observability software.', [[5, 'anal', 'core'], [5, 'sec', 'adjacent']], K.DDOG, 'DDOG'),
  pub('crowdstrike', 'CrowdStrike', US, 'Sells cloud-delivered cybersecurity software.', [[5, 'sec', 'core']], K.CRWD, 'CRWD'),
  pub('mongodb', 'MongoDB', US, 'Sells a document database, including its Atlas cloud service.', [[3, 'cdb', 'core'], [5, 'dev', 'adjacent']], K.MDB, 'MDB'),
  pub('uipath', 'UiPath', US, 'Sells robotic-process and agentic automation software.', [[5, 'bauto', 'core'], [7, 'pauto', 'core']], 'https://www.uipath.com/'),
  pub('intuit', 'Intuit', US, 'Sells tax, accounting and personal-finance software with AI assistants.', [[5, 'apps', 'core'], [5, 'esw', 'core']], 'https://www.intuit.com/'),
  // Layer 6: Indian technology services
  pub('tcs', 'TCS', 'India', 'Provides IT consulting, outsourcing and digital services, and also sells some software products.', [[6, 'consult', 'core'], [6, 'outsrc', 'core'], [6, 'dx', 'core']], 'https://www.tcs.com/'),
  pub('infosys', 'Infosys', 'India', 'Provides consulting, outsourcing and digital services, including AI offerings.', [[6, 'consult', 'core'], [6, 'outsrc', 'core'], [6, 'dx', 'core']], 'https://www.infosys.com/'),
  pub('hcltech', 'HCLTech', 'India', 'Provides IT and engineering services and sells software through HCLSoftware.', [[6, 'outsrc', 'core'], [6, 'eng', 'core'], [5, 'esw', 'adjacent']], 'https://www.hcltech.com/'),
  pub('wipro', 'Wipro', 'India', 'Provides consulting, IT outsourcing and digital transformation services.', [[6, 'consult', 'core'], [6, 'outsrc', 'core'], [6, 'dx', 'core']], 'https://www.wipro.com/'),
  pub('techm', 'Tech Mahindra', 'India', 'Provides IT services with a focus on telecom and enterprise clients.', [[6, 'consult', 'core'], [6, 'outsrc', 'core']], 'https://www.techmahindra.com/'),
  pub('ltimindtree', 'LTIMindtree', 'India', 'Provides IT consulting and digital transformation services.', [[6, 'consult', 'core'], [6, 'dx', 'core'], [6, 'outsrc', 'core']], 'https://www.ltimindtree.com/'),
  pub('persistent', 'Persistent Systems', 'India', 'Provides software product engineering and digital engineering services.', [[6, 'swdev', 'core'], [6, 'dx', 'core']], 'https://www.persistent.com/'),
  pub('coforge', 'Coforge', 'India', 'Provides software development and digital engineering services.', [[6, 'swdev', 'core'], [6, 'dx', 'core']], 'https://www.coforge.com/'),
  pub('mphasis', 'Mphasis', 'India', 'Provides cloud and digital transformation services.', [[6, 'dx', 'core'], [6, 'cloudc', 'core']], 'https://www.mphasis.com/'),
  pub('kpit', 'KPIT Technologies', 'India', 'Provides software engineering for vehicles, including driver-assistance and electrification software.', [[6, 'eng', 'core'], [7, 'av', 'adjacent', true]], 'https://www.kpit.com/'),
  pub('tataelxsi', 'Tata Elxsi', 'India', 'Provides design and engineering services for automotive, media and healthcare clients.', [[6, 'eng', 'core'], [7, 'av', 'adjacent', true]], 'https://www.tataelxsi.com/'),
  pub('ltts', 'L&T Technology Services', 'India', 'Provides engineering and R&D services across industries.', [[6, 'eng', 'core']], 'https://www.ltts.com/'),
  pub('cyient', 'Cyient', 'India', 'Provides engineering and technology services.', [[6, 'eng', 'core']], 'https://www.cyient.com/'),
  pub('zensar', 'Zensar Technologies', 'India', 'Provides digital and software services.', [[6, 'dx', 'core'], [6, 'swdev', 'core']], 'https://www.zensar.com/'),
  pub('ofss', 'Oracle Financial Services Software', 'India', 'Sells banking software products and related implementation services; Oracle holds a majority stake.', [[5, 'esw', 'core'], [6, 'eimpl', 'adjacent']], 'https://www.oracle.com/'),
  // Layer 7: robotics and automation
  pub('rockwell', 'Rockwell Automation', US, 'Makes industrial automation hardware and software.', [[7, 'pauto', 'core'], [7, 'iai', 'adjacent']], 'https://www.rockwellautomation.com/'),
  pub('teradyne', 'Teradyne', US, 'Makes semiconductor test equipment and, through Teradyne Robotics, collaborative and mobile robots.', [[1, 'equip', 'core'], [7, 'irobot', 'core'], [7, 'wauto', 'core']], 'https://www.teradyne.com/'),
  pub('symbotic', 'Symbotic', US, 'Builds AI-enabled warehouse automation systems.', [[7, 'wauto', 'core']], 'https://www.symbotic.com/'),
  pub('cognex', 'Cognex', US, 'Makes machine-vision systems and barcode readers.', [[7, 'mvis', 'core']], 'https://www.cognex.com/'),
  pub('tesla', 'Tesla', US, 'Makes electric vehicles and develops driver-assistance and autonomy software.', [[7, 'av', 'core', true], [7, 'auton', 'core', true]], 'https://www.tesla.com/'),
]

const R = (from: string, to: string, kind: RelKind, type: string, text: string, sources: string[], check?: Check): Relation => ({ from, to, kind, type, text, sources, ...(check ? { check } : {}) })
export const RELATIONS: Relation[] = [
  R('tsmc', 'nvidia', 'commercial', 'Manufactures for', 'NVIDIA relies on contract foundries, and its filings name TSMC as one of them.', [K.NVDA]),
  R('tsmc', 'amd', 'commercial', 'Manufactures for', 'AMD relies on contract foundries, and its filings name TSMC as one of them.', [K.AMD]),
  R('tsmc', 'broadcom', 'commercial', 'Manufactures for', 'Broadcom relies on contract foundries, and its filings name TSMC as one of them.', [K.AVGO]),
  R('asml', 'tsmc', 'commercial', 'Supplies technology to', 'ASML supplies lithography systems to leading chipmakers, TSMC among them.', ['https://www.asml.com/']),
  R('amat', 'tsmc', 'commercial', 'Supplies technology to', 'Applied Materials supplies fabrication equipment to leading chipmakers, TSMC among them.', ['https://www.appliedmaterials.com/']),
  R('micron', 'nvidia', 'commercial', 'Supplies technology to', 'Micron’s HBM3E memory is part of NVIDIA H200 GPUs.', [MICRON_H200], ck(MICRON_H200, 'Micron’s press release says its 24GB HBM3E will be part of NVIDIA H200 Tensor Core GPUs.')),
  R('micron', 'amd', 'commercial', 'Supplies technology to', 'Micron’s HBM3E memory is designed into AMD Instinct MI350 Series GPUs.', [MICRON_AMD], ck(MICRON_AMD, 'Micron’s press release says its HBM3E 36GB 12-high memory is designed into the AMD Instinct MI350 Series.')),
  R('microsoft', 'openai', 'commercial', 'Operates infrastructure for', 'Azure hosts OpenAI models, and Microsoft is an investor in and partner of OpenAI.', [K.MSFT]),
  R('amazon', 'anthropic', 'commercial', 'Operates infrastructure for', 'AWS is a cloud partner of Anthropic, and Amazon is an investor in Anthropic.', [K.AMZN]),
  R('amazon', 'snowflake', 'commercial', 'Operates infrastructure for', 'Snowflake runs its platform on AWS, among other clouds.', [K.SNOW]),
  R('microsoft', 'snowflake', 'commercial', 'Operates infrastructure for', 'Snowflake runs its platform on Azure, among other clouds.', [K.SNOW]),
  R('alphabet', 'snowflake', 'commercial', 'Operates infrastructure for', 'Snowflake runs its platform on Google Cloud, among other clouds.', [K.SNOW]),
  R('nvidia', 'amazon', 'integration', 'Integrates with', 'AWS offers compute instances built on NVIDIA GPUs.', ['https://aws.amazon.com/']),
  R('nvidia', 'microsoft', 'integration', 'Integrates with', 'Azure offers virtual machines built on NVIDIA GPUs.', ['https://azure.microsoft.com/']),
  R('nvidia', 'alphabet', 'integration', 'Integrates with', 'Google Cloud offers compute built on NVIDIA GPUs.', ['https://cloud.google.com/']),
  R('nvidia', 'amd', 'competitive', 'Competes with', 'Both design GPUs and AI accelerators and name each other as competitors.', [K.NVDA, K.AMD]),
  R('amd', 'intel', 'competitive', 'Competes with', 'Both design x86 CPUs and name each other as competitors.', [K.AMD, K.INTC]),
  R('microsoft', 'amazon', 'competitive', 'Competes with', 'Azure and AWS compete in cloud infrastructure and platforms.', [K.MSFT, K.AMZN]),
  R('microsoft', 'alphabet', 'competitive', 'Competes with', 'Azure and Google Cloud compete in cloud infrastructure and platforms.', [K.MSFT, K.GOOGL]),
  R('amazon', 'alphabet', 'competitive', 'Competes with', 'AWS and Google Cloud compete in cloud infrastructure and platforms.', [K.AMZN, K.GOOGL]),
  R('equinix', 'dlr', 'competitive', 'Competes with', 'Both operate data centres for enterprise and cloud customers.', ['https://www.equinix.com/', 'https://www.digitalrealty.com/']),
]
