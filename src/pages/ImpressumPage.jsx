import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function ImpressumPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      {i18n.language === 'en' && (
        <p className="legal-english-notice" style={{ fontStyle: 'italic', color: 'var(--color-text-light)', marginBottom: 16 }}>
          {t('imprint.englishNotice')}
        </p>
      )}

      <h1>Impressum</h1>
      <p className="legal-subtitle">Angaben gemäß § 5 TMG</p>

      <div className="legal-section">
        <h2>Verantwortlich</h2>
        <p>
          Tushar Mehta<br />
          Adresse auf Anfrage per E-Mail
        </p>
      </div>

      <div className="legal-section">
        <h2>Kontakt</h2>
        <p>
          E-Mail: tushar20mehta@gmail.com
        </p>
      </div>

      <div className="legal-section">
        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
          allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
          zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
        </p>
      </div>

      <div className="legal-section">
        <h2>Haftung für Links</h2>
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
          Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
        </p>
      </div>

      <div className="legal-section">
        <h2>Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit.
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </div>
    </div>
  )
}
