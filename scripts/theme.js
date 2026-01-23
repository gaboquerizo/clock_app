'use strict';

/* Dark Mode + User Preferences */

const $ThemeToggle = document.querySelector('[data-theme-switch]');
const $HTMLRoot = document.documentElement;

addEventListener('DOMContentLoaded', qualifiedName => {
  const Light = window.matchMedia('(prefers-color-scheme: light)').matches;  // true
  const Dark = window.matchMedia('(prefers-color-scheme: dark)').matches;    // false

  if( Light ){
    $ThemeToggle.setAttribute('checked', '');
    $HTMLRoot.setAttribute('data-theme', 'light');
  }else if( Dark ){
    $ThemeToggle.removeAttribute('checked');
    $HTMLRoot.setAttribute('data-theme', 'dark');
  }

});

$ThemeToggle.addEventListener('click', () => {
  const SetTheme = $ThemeToggle.checked ? 'light' : 'dark';
  $HTMLRoot.setAttribute('data-theme', SetTheme);
});