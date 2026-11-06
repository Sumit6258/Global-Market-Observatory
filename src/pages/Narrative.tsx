import { Link } from 'react-router-dom'
import { Tag } from '../ui'

export default function Narrative() {
  return (
    <section className="first">
      <h1>The Narrative</h1>
      <p className="lede">The Market Intelligence Timeline connects verified events with companies, industries and price history. It has no events yet. <Tag s="UNAVAILABLE" /></p>
      <p>No news or events provider is connected, and the platform does not write event summaries it cannot source. Each event will carry a headline, company or industry, event date, publication timestamp, source, short factual description and original URL.</p>
      <p>Event timing is never presented as causation. <Link to="/methodology/policy/corrections">Read the event policy</Link> or <Link to="/methodology/sources/events">the status of the events source</Link>.</p>
    </section>
  )
}
