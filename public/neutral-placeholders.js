const neutralizePlayerExample = () => {
  const input = document.querySelector('input[name="playerName"]')
  if (input) input.placeholder = 'Your display name'
}
neutralizePlayerExample()
new MutationObserver(neutralizePlayerExample).observe(document.body, { childList: true, subtree: true })
