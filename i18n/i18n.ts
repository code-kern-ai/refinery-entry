import i18n from 'i18next'
import settingsEN from './locales/en/settings.json'

import settingsDE from './locales/de/settings.json'

import settingsNL from './locales/nl/settings.json'

i18n.init({
    resources: {
        en: {
            settings: settingsEN
        },
        de: {
            settings: settingsDE,
        },
        nl: {
            settings: settingsNL,
        },
    },
    ns: ["settings"],
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false // not needed for react as it escapes by default
    },
});

export default i18n