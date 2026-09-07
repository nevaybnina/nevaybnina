import { events } from '../data/events';
import EventCountdown from '../components/EventCountdown';

export default function Home() {
  const event = events[0];
  return <EventCountdown event={event} />;
}
