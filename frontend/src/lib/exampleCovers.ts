const EXAMPLE_COVERS = [
  '/covers/cover-study.jpg',
  '/covers/cover-fitness.jpg',
  '/covers/cover-shield.jpg',
  '/covers/cover-diploma.jpg',
  '/covers/cover-quiz.jpg',
  '/covers/cover-notes.jpg',
];

export function exampleCover(index: number) {
  return EXAMPLE_COVERS[Math.abs(index) % EXAMPLE_COVERS.length];
}
