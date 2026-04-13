import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation, Trans } from 'react-i18next'

export default function DatenschutzPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <button className="detail-back" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> {t('common.back')}
      </button>

      <h1>{t('privacy.title')}</h1>

      <div className="legal-section">
        <h2>{t('privacy.section1Title')}</h2>
        <p>
          {t('privacy.section1Text')}<br /><br />
          Tushar Mehta<br />
          {t('imprint.addressOnRequest')}<br /><br />
          E-Mail: alextiktok403@gmail.com
        </p>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section2Title')}</h2>
        <p>{t('privacy.section2Intro')}</p>
        <ul>
          <li><Trans i18nKey="privacy.section2Item1" /></li>
          <li><Trans i18nKey="privacy.section2Item2" /></li>
          <li><Trans i18nKey="privacy.section2Item3" /></li>
          <li><Trans i18nKey="privacy.section2Item4" /></li>
          <li><Trans i18nKey="privacy.section2Item5" /></li>
          <li><Trans i18nKey="privacy.section2Item6" /></li>
          <li><Trans i18nKey="privacy.section2Item7" /></li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section3Title')}</h2>
        <p>{t('privacy.section3Intro')}</p>
        <ul>
          <li><Trans i18nKey="privacy.section3Item1" /></li>
          <li><Trans i18nKey="privacy.section3Item2" /></li>
          <li><Trans i18nKey="privacy.section3Item3" /></li>
          <li><Trans i18nKey="privacy.section3Item4" /></li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section4Title')}</h2>
        <p><Trans i18nKey="privacy.section4Text1" /></p>
        <p><Trans i18nKey="privacy.section4Text2" /></p>
        <p>{t('privacy.section4Text3')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section5Title')}</h2>
        <p><Trans i18nKey="privacy.section5Text1" /></p>
        <p>{t('privacy.section5Text2')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section6Title')}</h2>
        <p>{t('privacy.section6Intro')}</p>
        <ul>
          <li><Trans i18nKey="privacy.section6Item1" /></li>
          <li><Trans i18nKey="privacy.section6Item2" /></li>
          <li><Trans i18nKey="privacy.section6Item3" /></li>
          <li><Trans i18nKey="privacy.section6Item4" /></li>
          <li><Trans i18nKey="privacy.section6Item5" /></li>
          <li><Trans i18nKey="privacy.section6Item6" /></li>
          <li><Trans i18nKey="privacy.section6Item7" /></li>
          <li><Trans i18nKey="privacy.section6Item8" /></li>
        </ul>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section7Title')}</h2>
        <p>{t('privacy.section7Text1')}</p>
        <p>{t('privacy.section7Text2')}</p>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section8Title')}</h2>
        <p>{t('privacy.section8Text1')}</p>
        <p>{t('privacy.section8Text2')}</p>
        <p>{t('privacy.section8Text3')}</p>
        <p>{t('privacy.section8Text4')}</p>
        <p>
          <Trans
            i18nKey="privacy.section8Text5"
            components={[
              <a key="google-privacy" href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">_</a>,
              <a key="recaptcha-tos" href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">_</a>,
            ]}
          />
        </p>
      </div>

      <div className="legal-section">
        <h2>{t('privacy.section9Title')}</h2>
        <p>
          {t('privacy.section9Text')}<br /><br />
          Tushar Mehta<br />
          E-Mail: alextiktok403@gmail.com
        </p>
      </div>

      <p className="legal-updated">{t('privacy.lastUpdated')}</p>
    </div>
  )
}
