export const make = (tagName: string, classNames: string[]| string | null = null, attributes: { [key: string]: string | Function } = {}) => {
  const el = document.createElement(tagName);

  if (Array.isArray(classNames)) {
    el.classList.add(...classNames);
  } else if (classNames) {
    el.classList.add(classNames);
  }

  Object.keys(attributes).forEach((attrName) => {
    // @ts-ignore
    el[attrName] = attributes[attrName]
  });

  return el;
};
