function normalizeSources(value) {
  return {
    light: value?.light || '',
    dark: value?.dark || value?.light || '',
  }
}

function applySource(element, sources, theme) {
  const activeTheme = theme === 'dark' ? 'dark' : 'light'
  const nextSource = activeTheme === 'dark' ? sources.dark : sources.light
  element.dataset.themeAsset = activeTheme
  if (nextSource && element.getAttribute('src') !== nextSource) {
    element.setAttribute('src', nextSource)
  }
}

export const themeSrcDirective = {
  mounted(element, binding) {
    element.__wallyThemeSources = normalizeSources(binding.value)
    element.__wallyThemeUnsubscribe = window.__wallyTheme?.subscribe?.((theme) => {
      applySource(element, element.__wallyThemeSources, theme)
    })
  },

  updated(element, binding) {
    element.__wallyThemeSources = normalizeSources(binding.value)
    applySource(element, element.__wallyThemeSources, window.__wallyTheme?.getTheme?.())
  },

  unmounted(element) {
    element.__wallyThemeUnsubscribe?.()
    delete element.__wallyThemeSources
    delete element.__wallyThemeUnsubscribe
  },
}
