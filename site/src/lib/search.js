import Fuse from 'fuse.js'

export function createSearch(data) {
  return new Fuse(data, {
    keys: ['title', 'venue', 'collaborators'],
    threshold: 0.3,
    ignoreLocation: true,
  })
}
