// Adaptador temporal: reemplazar cada función por llamadas a la API cuando exista backend.
const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms))

export async function mockLogin(users, username, password) {
  await wait()
  const user = users.find((item) => item.username.toLowerCase() === username.toLowerCase() && item.password === password && item.active)
  if (!user) throw new Error('Usuario, contraseña o estado de cuenta inválidos.')
  return { ...user, password: undefined }
}

export async function mockOperation(operation) {
  await wait(450)
  return { mode: 'mock', operation, persisted: false }
}
