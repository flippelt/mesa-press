export class MesaPressError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MesaPressError'
  }
}
