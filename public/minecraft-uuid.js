let lookupTimer
let activeInput

const attachUuidLookup = () => {
  const usernameInput = document.querySelector('input[name="minecraftUsername"]')
  const uuidInput = document.querySelector('input[name="minecraftUuid"]')
  if (!usernameInput || !uuidInput || usernameInput === activeInput) return
  activeInput = usernameInput
  usernameInput.addEventListener('input', () => {
    clearTimeout(lookupTimer)
    const username = usernameInput.value.trim()
    if (!username) return
    lookupTimer = setTimeout(async () => {
      if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) return
      uuidInput.dataset.lookup = 'loading'
      try {
        const response = await fetch(`/api/minecraft/uuid/${encodeURIComponent(username)}`)
        if (!response.ok) return
        const data = await response.json()
        if (usernameInput.value.trim() === username) uuidInput.value = data.uuid
      } finally {
        delete uuidInput.dataset.lookup
      }
    }, 450)
  })
}

attachUuidLookup()
new MutationObserver(attachUuidLookup).observe(document.body, { childList: true, subtree: true })
const attachTimer = setInterval(() => {
  attachUuidLookup()
  if (activeInput) clearInterval(attachTimer)
}, 100)

document.addEventListener('input', event => {
  if (event.target?.name !== 'minecraftUsername') return
  clearTimeout(lookupTimer)
  const username = event.target.value.trim()
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) return
  const uuidInput = document.querySelector('input[name="minecraftUuid"]')
  let status = document.querySelector('#uuidStatus')
  if (!status && uuidInput) { status = document.createElement('small'); status.id = 'uuidStatus'; uuidInput.parentElement.append(status) }
  if (status) status.textContent = 'Looking up Minecraft profile...'
  lookupTimer = setTimeout(async () => {
    const response = await fetch(`/api/minecraft/uuid/${encodeURIComponent(username)}`)
    if (!response.ok || event.target.value.trim() !== username) { if (status) status.textContent = 'Profile not found. Enter the UUID manually.'; return }
    const data = await response.json()
    if (uuidInput) uuidInput.value = data.uuid
    if (status) status.textContent = 'UUID found and filled automatically.'
  }, 450)
})
