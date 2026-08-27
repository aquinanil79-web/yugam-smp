const normalizeServerModes = () => {
  const select = document.querySelector('select[name="serverMode"]')
  if (!select) return
  const current = select.value
  select.innerHTML = '<option>Survival</option><option>Anarchy</option>'
  select.value = current === 'Anarchy' ? 'Anarchy' : 'Survival'
}
normalizeServerModes()
new MutationObserver(normalizeServerModes).observe(document.body, { childList: true, subtree: true })
