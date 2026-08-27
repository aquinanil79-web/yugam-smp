const updateRegistryCodeLabels = () => {
  const uuidInput = document.querySelector('input[name="minecraftUuid"]')
  if (uuidInput) uuidInput.closest('label')?.remove()
  document.querySelectorAll('.review-fields small, .card-fields span').forEach(node => {
    if (node.textContent.includes('MINECRAFT UUID')) {
      if (node.tagName === 'SMALL') node.textContent = 'REGISTRY CODE'
      else if (node.firstChild) node.firstChild.textContent = 'REGISTRY CODE'
    }
  })
}
updateRegistryCodeLabels()
new MutationObserver(updateRegistryCodeLabels).observe(document.body, { childList: true, subtree: true })
