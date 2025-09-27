// Lightweight browser stub that satisfies file-type's require('stream') call
export class PassThrough {
  pipe() {
    return this
  }

  on() {
    return this
  }

  once() {
    return this
  }
}

export const pipeline = () => undefined

export default {
  PassThrough,
  pipeline,
}
