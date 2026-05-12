let activePath: string[] = [];
let activeIndex = 0;

export function setNavigationGuide(path: string[]) {
  activePath = path;
  activeIndex = 0;
}

export function getNavigationGuide() {
  return {
    path: activePath,
    index: activeIndex,
  };
}

export function advanceNavigationGuide() {
  if (activeIndex < activePath.length - 1) {
    activeIndex += 1;
  }
}

export function clearNavigationGuide() {
  activePath = [];
  activeIndex = 0;
}