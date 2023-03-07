/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    future: {
        hoverOnlyWhenSupported: true
    },
    theme: {
        extend: {
            fontFamily: {
                sans: ['Verdana', 'sans-serif']
            }
        }
    },
    plugins: []
};