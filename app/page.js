import { events } from '../data/events';
import EventCountdown from '../components/EventCountdown';

const event = events[0];
const description = `${event.eventSub} Отсчёт до ${event.displayDate} по Санкт-Петербургу.`;

export const metadata = {
  title: event.eventName,
  description,
  openGraph: {
    title: event.eventName,
    description,
  },
};

export default function Home() {
  return <EventCountdown event={event} />;
}
