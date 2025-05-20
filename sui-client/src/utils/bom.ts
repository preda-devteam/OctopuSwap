export function download(url: string, fileName = `${Date.now()}`) {
  const a = document.createElement('a')

  a.href = url
  a.download = fileName

  document.body.appendChild(a)

  a.click()

  document.body.removeChild(a)
}
