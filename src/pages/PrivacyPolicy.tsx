import { Link } from 'react-router-dom';

const operator = import.meta.env.VITE_PRIVACY_OPERATOR?.trim();
const contact = import.meta.env.VITE_PRIVACY_CONTACT_EMAIL?.trim();

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-12 text-foreground">
      <Link to="/" className="text-primary underline underline-offset-4">
        Back to Colosseum Guide
      </Link>
      <h1 className="text-3xl font-bold">Visitor privacy notice</h1>
      {(!operator || !contact) && (
        <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm">
          Draft notice. The operator and privacy contact details are pending confirmation.
        </p>
      )}
      <p>
        This notice describes how the Colosseum Guide mobile app uses location, tour progress and
        optional analytics.
      </p>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Location, maps and audio</h2>
        <p>
          The app uses your location and compass on your device to show your position and guide you
          to stops. You can manage location access in your device settings. The app loads map tiles
          from Google. Tile requests disclose the requested map area and carry ordinary connection
          information, including your IP address.
        </p>
        <p>
          The text-to-speech engine installed on your device reads the tour aloud. Its settings and
          any network use depend on the engine you choose.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Tour downloads and progress</h2>
        <p>
          The app stores your language choice, downloaded tour content and visited stops on your
          device. It connects to the tour service for content updates. You can remove the stored
          data through your device’s app settings.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Optional tour analytics</h2>
        <p>
          Analytics is off by default. If you turn it on, the app shares tour activity to help the
          tour team understand which stops people visit or skip and how often they finish tours or
          narrations.
        </p>
        <p>
          Events include random installation, session and event identifiers, the event type and
          time, tour type, selected language, and relevant Landmark, Floor or Viewpoint identifiers.
          The analytics payload excludes names, email addresses, GPS coordinates and audio
          recordings. Authorized administrators can see aggregate reports. Server events expire 90
          days after they occurred.
        </p>
        <p>
          To withdraw consent, open the map’s offline tour settings, choose{' '}
          <strong>Tour analytics privacy</strong>, turn off <strong>Share tour activity</strong> and
          save. This clears pending events and stops future sharing. Previously received events
          expire on the server.
        </p>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Privacy contact</h2>
        {operator && contact ? (
          <p>
            Contact {operator} at{' '}
            <a className="text-primary underline" href={`mailto:${contact}`}>
              {contact}
            </a>{' '}
            with privacy questions or requests about your data.
          </p>
        ) : (
          <dl className="grid gap-2">
            <div>
              <dt className="font-medium">App operator</dt>
              <dd>{operator || 'To be confirmed'}</dd>
            </div>
            <div>
              <dt className="font-medium">Privacy email</dt>
              <dd>{contact || 'To be confirmed'}</dd>
            </div>
          </dl>
        )}
      </section>
    </main>
  );
}
