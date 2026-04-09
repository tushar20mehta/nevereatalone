import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function DatenschutzPage() {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Zurück
      </button>

      <h1>Datenschutzerklärung</h1>

      <div className="legal-section">
        <h2>1. Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br /><br />
          Tushar Mehta<br />
          Adresse auf Anfrage per E-Mail<br /><br />
          E-Mail: tushar20mehta@gmail.com
        </p>
      </div>

      <div className="legal-section">
        <h2>2. Erhobene Daten</h2>
        <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
        <ul>
          <li><strong>Kontodaten:</strong> Name, E-Mail-Adresse (über Google-Authentifizierung)</li>
          <li><strong>Profilbild:</strong> Freiwillig hochgeladenes Foto, gespeichert als komprimierter Base64-String</li>
          <li><strong>Standort:</strong> Freiwillig angegebene PLZ/Stadt</li>
          <li><strong>Gesundheitsdaten (Art. 9 DSGVO):</strong> Allergien und Unverträglichkeiten — diese besonderen Kategorien personenbezogener Daten werden nur mit Ihrer ausdrücklichen Einwilligung erhoben und verarbeitet</li>
          <li><strong>Präferenzen:</strong> Küchenpräferenzen, bevorzugte Gangart bei Running Dinner</li>
          <li><strong>Nutzungsverhalten:</strong> Erstellte Dinner, Teilnahmen, Chat-Nachrichten, Swipe-Entscheidungen, Team-Anmeldungen</li>
          <li><strong>Technische Daten:</strong> IP-Adresse, Browser-Typ, Zugriffszeitpunkt (über Firebase-Infrastruktur)</li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>3. Rechtsgrundlagen</h2>
        <p>Die Verarbeitung Ihrer Daten erfolgt auf Grundlage folgender Rechtsgrundlagen:</p>
        <ul>
          <li><strong>Art. 6 Abs. 1 lit. a DSGVO (Einwilligung):</strong> Für die Verarbeitung von Gesundheitsdaten (Allergien), das Hochladen eines Profilbilds und die Nutzung nicht-essentieller Funktionen</li>
          <li><strong>Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung):</strong> Für die Bereitstellung der Plattformfunktionen (Dinner erstellen, teilnehmen, Chat)</li>
          <li><strong>Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse):</strong> Für technische Analyse und Sicherheit der Plattform</li>
          <li><strong>Art. 9 Abs. 2 lit. a DSGVO:</strong> Für die Verarbeitung besonderer Kategorien personenbezogener Daten (Allergien als Gesundheitsdaten) — nur mit ausdrücklicher Einwilligung</li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>4. Auftragsverarbeiter und Drittland-Transfer</h2>
        <p>
          Wir nutzen <strong>Google Firebase</strong> (Google Ireland Limited / Google LLC) als Infrastruktur für Authentifizierung,
          Datenbank (Firestore) und Hosting. Google ist als Auftragsverarbeiter gemäß Art. 28 DSGVO tätig.
        </p>
        <p>
          Ein Transfer personenbezogener Daten in die USA findet statt. Dieser Transfer ist durch das
          <strong> EU-US Data Privacy Framework</strong> (Angemessenheitsbeschluss der EU-Kommission vom 10. Juli 2023)
          abgesichert. Google LLC ist unter dem Data Privacy Framework zertifiziert.
        </p>
        <p>
          Darüber hinaus gelten die Standardvertragsklauseln (SCCs) der EU-Kommission als zusätzliche Schutzmaßnahme.
        </p>
      </div>

      <div className="legal-section">
        <h2>5. Cookies und lokale Speicherung</h2>
        <p>
          Diese Website verwendet ausschließlich <strong>technisch notwendige Cookies und lokale Speichermechanismen</strong>
          (localStorage/IndexedDB) für die Firebase-Authentifizierung. Diese sind erforderlich, um Sie nach dem Login
          eingeloggt zu halten. Es werden keine Marketing- oder Tracking-Cookies eingesetzt.
        </p>
        <p>
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (erforderlich für die Bereitstellung des Dienstes) sowie
          § 25 Abs. 2 Nr. 2 TDDDG (technisch erforderliche Speicherung).
        </p>
      </div>

      <div className="legal-section">
        <h2>6. Ihre Rechte</h2>
        <p>Sie haben gemäß DSGVO folgende Rechte:</p>
        <ul>
          <li><strong>Auskunftsrecht (Art. 15 DSGVO):</strong> Sie können Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten verlangen</li>
          <li><strong>Recht auf Berichtigung (Art. 16 DSGVO):</strong> Sie können die Berichtigung unrichtiger Daten verlangen. Dies können Sie direkt über Ihre Profilseite vornehmen.</li>
          <li><strong>Recht auf Löschung (Art. 17 DSGVO):</strong> Sie können die Löschung Ihrer Daten verlangen. Sie können Ihr Konto und alle zugehörigen Daten jederzeit über die Profilseite selbstständig löschen.</li>
          <li><strong>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO):</strong> Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen</li>
          <li><strong>Recht auf Datenübertragbarkeit (Art. 20 DSGVO):</strong> Sie können verlangen, dass wir Ihnen Ihre Daten in einem strukturierten, gängigen und maschinenlesbaren Format übermitteln</li>
          <li><strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können der Verarbeitung Ihrer Daten widersprechen, soweit diese auf berechtigtem Interesse basiert</li>
          <li><strong>Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie können Ihre erteilte Einwilligung jederzeit widerrufen</li>
          <li><strong>Beschwerderecht (Art. 77 DSGVO):</strong> Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren</li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>7. Speicherdauer</h2>
        <p>
          Ihre personenbezogenen Daten werden gespeichert, solange Ihr Benutzerkonto besteht. Bei Löschung des Kontos
          werden alle zugehörigen Daten (Profil, Profilbild, Präferenzen, Standort) unverzüglich gelöscht.
        </p>
        <p>
          Erstellte Dinner-Einträge und Chat-Nachrichten können nach Kontolöschung in anonymisierter Form
          bestehen bleiben, sofern sie für die Funktion der Plattform für andere Teilnehmer erforderlich sind.
        </p>
      </div>

      <div className="legal-section">
        <h2>8. Kontakt für Datenschutzanfragen</h2>
        <p>
          Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte wenden Sie sich bitte an:<br /><br />
          Tushar Mehta<br />
          E-Mail: tushar20mehta@gmail.com
        </p>
      </div>

      <p className="legal-updated">Stand: April 2026</p>
    </div>
  )
}
