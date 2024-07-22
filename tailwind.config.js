const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('./submodules/tailwind-config/tailwind.config.js'),
  ]
}
